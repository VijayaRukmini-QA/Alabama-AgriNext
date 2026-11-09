import { test, expect } from '../../fixtures/customer.fixture';
import { mockSignUpToProfileForm } from '../../utils/ciamMocks';
import { uniqueYopmailEmail } from '../../utils/customerEmail';
import { getCustomerEmail, getCustomerPassword } from '../../config/env';
import { malformedEmails, messages, wrongCodes } from '../../test-data/customer.data';
import { MOCK_EMAIL } from './helpers';

test.describe('Customer - create profile: email and code steps', () => {
  for (const bad of malformedEmails) {
    test(`TC-C-04 @customer @regression @negative malformed email "${bad}" shows "Invalid email" and Send code stays disabled`, async ({ emailStepPage }) => {
      await emailStepPage.open();
      await emailStepPage.enterEmailAndBlur(bad);
      await emailStepPage.expectInlineError(messages.invalidEmail);
      await emailStepPage.expectSendCodeEnabled(false);
    });
  }

  test('TC-C-07 @customer @regression Change on the code step returns to the email step with the email preserved (mocked)', async ({ page, emailStepPage, codeStepPage }) => {
    await mockSignUpToProfileForm(page);
    await emailStepPage.open();
    await emailStepPage.requestCode(MOCK_EMAIL);
    await codeStepPage.expectLoaded();
    await codeStepPage.changeEmail();
    await emailStepPage.expectLoaded();
    expect(await emailStepPage.emailValue()).toBe(MOCK_EMAIL);
  });

  // REAL code send #1 (throwaway yopmail address)
  test('TC-C-06 @customer @regression @negative wrong 8-digit email code shows the invalid-code toast and stays on the code step', async ({ page, emailStepPage, codeStepPage, profileFormPage }) => {
    const email = uniqueYopmailEmail();
    test.info().annotations.push({ type: 'data', description: `synthetic email ${email} (real code send #1)` });
    await emailStepPage.open();
    await emailStepPage.requestCode(email);
    await codeStepPage.expectLoaded();
    const verifyResponse = page.waitForResponse((r) => /signup\/v1\.0\/continue/.test(r.url()));
    await codeStepPage.verify(wrongCodes.email);
    expect((await verifyResponse).status()).toBe(400); // server rejected the code; the toast follows
    await codeStepPage.toast.expectMessage(messages.invalidEmailCode);
    await expect(codeStepPage.heading).toBeVisible();
    await expect(profileFormPage.firstName).toHaveCount(0);
  });

  // REAL code sends #2 and #3 (initial send + one resend, throwaway yopmail address)
  test('TC-C-07 @customer @regression Resend code becomes available after ~30 s, clears the boxes and restarts the timer', async ({ emailStepPage, codeStepPage }) => {
    test.setTimeout(120_000);
    const email = uniqueYopmailEmail();
    test.info().annotations.push({ type: 'data', description: `synthetic email ${email} (real code sends #2 and #3)` });
    await emailStepPage.open();
    await emailStepPage.requestCode(email);
    await codeStepPage.expectLoaded();
    await codeStepPage.expectResendCountingDown();
    await codeStepPage.enterCode('1234');
    await codeStepPage.expectResendAvailable(45_000);
    await codeStepPage.resendCode();
    await codeStepPage.expectResendCountingDown();
    await expect.poll(() => codeStepPage.enteredCode()).toBe('');
    await expect(codeStepPage.heading).toBeVisible();
  });

  // One real sign-in attempt; not destructive. Records whether CUSTOMER_EMAIL is registered (AC-15 precondition).
  test('TC-C-05 @customer @regression @negative CUSTOMER_EMAIL registration status probe via sign-in (recorded as annotation)', async ({ page, loginPage }) => {
    let email: string;
    let password: string;
    try {
      email = getCustomerEmail();
      password = getCustomerPassword();
    } catch (e) {
      test.skip(true, `CUSTOMER_EMAIL/CUSTOMER_PASSWORD not set: ${(e as Error).message}`);
      return;
    }
    await loginPage.open();
    await loginPage.signIn(email, password);
    const outcome = await Promise.race([
      loginPage.toast.alert.first().waitFor({ timeout: 30_000 }).then(() => 'toast' as const),
      page.waitForURL((u) => !/\/login/.test(u.pathname), { timeout: 30_000 }).then(() => 'navigated' as const),
    ]);
    const toastText = outcome === 'toast' ? await loginPage.toast.text() : '';
    const detail = outcome === 'toast' ? `toast "${toastText}"` : `navigated to ${new URL(page.url()).pathname}`;
    const notRegistered = toastText.includes(messages.invalidLogin);
    test.info().annotations.push({
      type: 'data',
      description: `TC-C-05 CUSTOMER_EMAIL sign-in result: ${notRegistered ? 'NOT REGISTERED (or wrong password)' : 'REGISTERED / other'} - ${detail}`,
    });
    expect(['toast', 'navigated']).toContain(outcome);
  });
});
