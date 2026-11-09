import { test, expect } from '../../../fixtures/customer.fixture';
import { RUN_CUSTOMER_E2E, getCustomerEmail, getCustomerPassword, getSmsInboxUrl } from '../../../config/env';
import { smsSender } from '../../../test-data/customer.data';
import { ThirdPartyBlockedError } from '../../../utils/thirdPartyGuard';
import { INITIATE_URL, observe } from './signin.helpers';

test.describe('Customer Sign in - full sign-in with a real SMS code', () => {
  test.skip(!RUN_CUSTOMER_E2E, 'Opt-in real sign-in: set RUN_CUSTOMER_E2E=1 (uses the shared SMS inbox and sends one real code)');

  test('TC-S-60 @customer @signin @e2e-full sign in with the real account and SMS code and land on /apply-for-a-loan', async ({
    page,
    landingPage,
    loginPage,
    mfaStepPage,
    smsInbox,
    applyForLoanPage,
  }) => {
    // Preflight 1 (no real sign-in yet, so a blocked inbox costs no SMS): open the inbox and snapshot it.
    const seenCodes = await test.step('preflight: open the SMS inbox and snapshot it', async () => {
      try {
        await smsInbox.open(getSmsInboxUrl());
        const rows = await smsInbox.rowTexts(smsSender);
        return new Set(rows.map((r) => r.match(/\b(\d{6})\b/)?.[1]).filter((c): c is string => !!c));
      } catch (e) {
        if (e instanceof ThirdPartyBlockedError) test.skip(true, 'BLOCKED: receive-smss Cloudflare (F-02) - not bypassed');
        throw e;
      }
    });

    // Preflight 2: the single real credential attempt. user_not_found is returned at `initiate`, before any SMS is sent.
    await landingPage.open();
    await landingPage.startSignIn();
    await loginPage.fillCredentials(getCustomerEmail(), getCustomerPassword());
    const initiate = page.waitForResponse((r) => INITIATE_URL.test(r.url()));
    await loginPage.signInButton.click();
    const response = await initiate;
    if (response.status() === 400) {
      const body = await response.json().catch(() => ({}));
      if (body?.error === 'user_not_found') test.skip(true, 'BLOCKED: CUSTOMER_EMAIL not registered (S-F-01)');
    }

    await mfaStepPage.expectLoaded();
    const code = await test.step('read the new SMS code', () =>
      smsInbox.getNewCode({ sender: smsSender, excludeCodes: seenCodes, timeoutMs: 180_000, pollMs: 5_000 }),
    );
    await mfaStepPage.verify(code);
    await applyForLoanPage.expectLoaded();
    await expect(page).toHaveURL(/\/apply-for-a-loan/);
    observe('Signed-out /apply-for-a-loan shows the public welcome page at the same URL (TC-S-35), so the URL alone is weak proof; the MFA step must also be gone.');
    await expect(mfaStepPage.heading).toBeHidden();
  });
});
