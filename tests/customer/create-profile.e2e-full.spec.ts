import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/customer.fixture';
import { YopmailInboxPage } from '../../pages/third-party/YopmailInboxPage';
import { ReceiveSmsInboxPage } from '../../pages/third-party/ReceiveSmsInboxPage';
import { ThirdPartyBlockedError } from '../../utils/thirdPartyGuard';
import { uniqueYopmailEmail } from '../../utils/customerEmail';
import {
  RUN_CUSTOMER_E2E,
  getCustomerFirstName,
  getCustomerLastName,
  getCustomerPassword,
  getCustomerPhone,
  getSmsInboxUrl,
} from '../../config/env';
import { addressQuery, smsSender } from '../../test-data/customer.data';

test.describe('Customer - full registration (real email + SMS inboxes)', () => {
  test.skip(!RUN_CUSTOMER_E2E, 'Opt-in real registration: set RUN_CUSTOMER_E2E=1 (uses public yopmail and receive-smss inboxes and sends real codes)');

  test('TC-C-01 @customer @e2e-full @regression create a profile end to end and land on /apply-for-a-loan', async ({
    context,
    page,
    emailStepPage,
    codeStepPage,
    profileFormPage,
    smsStepPage,
    applyForLoanPage,
  }) => {
    const email = uniqueYopmailEmail();
    test.info().annotations.push({ type: 'data', description: `generated synthetic email ${email}` });

    const yopmailPage = await context.newPage();
    const smsPage = await context.newPage();
    const yopmail = new YopmailInboxPage(yopmailPage);
    const smsInbox = new ReceiveSmsInboxPage(smsPage);

    /** Runs a third-party interaction; a bot wall becomes a clearly labelled skip (never bypassed). */
    async function guarded<T>(pageOf: (site: string) => Page, action: () => Promise<T>): Promise<T> {
      try {
        return await action();
      } catch (e) {
        if (e instanceof ThirdPartyBlockedError) {
          const shot = await pageOf(e.site).screenshot({ fullPage: true }).catch(() => undefined);
          if (shot) await test.info().attach(`blocked-${e.site}`, { body: shot, contentType: 'image/png' });
          test.skip(true, `BLOCKED: ${e.site} Cloudflare bot check (F-01/F-02) - not bypassed`);
        }
        throw e;
      }
    }
    const pageOf = (site: string): Page => (site.includes('yopmail') ? yopmailPage : smsPage);

    // Preflight both inboxes BEFORE any real code is sent, so a bot wall costs no send.
    await test.step('preflight third-party inboxes', async () => {
      await guarded(pageOf, () => yopmail.openInbox(email));
      await guarded(pageOf, () => smsInbox.open(getSmsInboxUrl()));
    });

    await test.step('request the email code', async () => {
      await emailStepPage.open();
      await emailStepPage.requestCode(email);
      await codeStepPage.expectLoaded();
    });

    const emailCode = await test.step('read the email code from yopmail', () =>
      guarded(pageOf, () => yopmail.waitForVerificationCode(email, { timeoutMs: 120_000, pollMs: 5_000 })),
    );

    await test.step('verify the email code', async () => {
      await codeStepPage.verify(emailCode);
      await profileFormPage.waitUntilReady();
      await profileFormPage.expectEmailPrefilled(email);
    });

    await test.step('fill the profile from env data', async () => {
      await profileFormPage.fillProfile({
        firstName: getCustomerFirstName(),
        lastName: getCustomerLastName(),
        phone: getCustomerPhone(),
        password: getCustomerPassword(),
        confirmPassword: getCustomerPassword(),
      });
      await profileFormPage.chooseLastAddressSuggestion(addressQuery);
      await profileFormPage.checkAllConsents();
      await profileFormPage.expectContinueEnabled(true);
    });

    // Snapshot the SMS inbox BEFORE Continue so only a newer message can match.
    const seenCodes = await test.step('snapshot the SMS inbox', async () => {
      const rows = await guarded(pageOf, () => smsInbox.rowTexts(smsSender));
      return new Set(rows.map((r) => r.match(/\b(\d{6})\b/)?.[1]).filter((c): c is string => !!c));
    });

    await test.step('Continue and wait for the SMS step', async () => {
      await profileFormPage.submit();
      await smsStepPage.expectLoaded();
    });

    const smsCode = await test.step('read the new SMS code', () =>
      guarded(pageOf, () => smsInbox.getNewCode({ sender: smsSender, excludeCodes: seenCodes, timeoutMs: 180_000, pollMs: 5_000 })),
    );

    await test.step('complete the profile', async () => {
      await smsStepPage.completeProfile(smsCode);
      await applyForLoanPage.expectLoaded();
    });
    await expect(page).toHaveURL(/\/apply-for-a-loan/);
  });
});
