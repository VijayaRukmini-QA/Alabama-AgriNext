import { test, expect } from '../../fixtures/customer.fixture';
import { reachSmsStep, type Steps } from './helpers';
import { messages, wrongCodes } from '../../test-data/customer.data';

test.describe('Customer - SMS verification step (mocked auth, no SMS sent)', () => {
  let steps: Steps;
  test.beforeEach(async ({ page, emailStepPage, codeStepPage, profileFormPage, smsStepPage }) => {
    steps = { page, emailStepPage, codeStepPage, profileFormPage, smsStepPage };
    await reachSmsStep(steps, 'invalid');
  });

  test('TC-C-17 @customer @regression @negative Complete Profile is disabled until 6 digits are entered', async ({ smsStepPage, page }) => {
    await smsStepPage.expectCompleteEnabled(false);
    await smsStepPage.enterCode('12345');
    expect(await smsStepPage.enteredCode()).toBe('12345');
    await smsStepPage.expectCompleteEnabled(false);
    await page.keyboard.type('6');
    await smsStepPage.expectCompleteEnabled(true);
  });

  test('TC-C-17 @customer @regression @negative a wrong 6-digit code shows the invalid-code toast and stays on the SMS step', async ({ smsStepPage, page }) => {
    await smsStepPage.completeProfile(wrongCodes.sms);
    await smsStepPage.toast.expectMessage(messages.invalidSmsCode);
    await smsStepPage.expectLoaded();
    expect(new URL(page.url()).pathname).not.toMatch(/apply-for-a-loan/);
  });

  test('TC-C-18 @customer @regression Resend code on the SMS step requests a new code (mocked)', async ({ page, smsStepPage }) => {
    const resend = page.waitForRequest('**/register/v1.0/challenge', { timeout: 20_000 });
    await smsStepPage.requestNewCode();
    await resend;
    await smsStepPage.expectLoaded();
  });
});
