import { test, expect } from '../../fixtures/customer.fixture';
import { defect, MOCK_EMAIL, reachProfileForm, reachSmsStep, type Steps } from './helpers';
import { mockSignUpToProfileForm } from '../../utils/ciamMocks';
import { messages, wrongCodes } from '../../test-data/customer.data';
import type { Consent } from '../../pages/customer/SignUpProfileFormPage';

// No axe-core dependency is installed in this project, so TC-C-23 (axe scan) is not automated here.

test.describe('Customer - accessibility', () => {
  test('TC-C-20 @customer @smoke @regression @a11y email step and sign-in controls have accessible names', async ({ emailStepPage, loginPage }) => {
    await emailStepPage.open();
    await expect(emailStepPage.email).toHaveAccessibleName(/.+/);
    await expect(emailStepPage.sendCodeButton).toHaveAccessibleName(/.+/);
    await expect(emailStepPage.signInLink).toHaveAccessibleName(/.+/);
    await loginPage.open();
    await expect(loginPage.email).toHaveAccessibleName(/.+/);
    await expect(loginPage.password).toHaveAccessibleName(/.+/);
    await expect(loginPage.showPasswordButton).toHaveAccessibleName(/.+/);
  });

  test('TC-C-20 @customer @regression @a11y every profile-form text field and password toggle has an accessible name', async ({ page, emailStepPage, codeStepPage, profileFormPage, smsStepPage }) => {
    await reachProfileForm({ page, emailStepPage, codeStepPage, profileFormPage, smsStepPage });
    const boxes = await page.getByRole('textbox').all();
    expect(boxes.length).toBeGreaterThan(8);
    for (const box of boxes) await expect(box).toHaveAccessibleName(/.+/);
    await expect(profileFormPage.showPasswordButton).toHaveAccessibleName(/.+/);
    await expect(profileFormPage.showConfirmPasswordButton).toHaveAccessibleName(/.+/);
  });

  test('TC-C-20 @customer @regression @negative @a11y F-13 each consent checkbox is named by its consent text', async ({ page, emailStepPage, codeStepPage, profileFormPage, smsStepPage }) => {
    defect('F-13', 'consent checkboxes have no accessible name (AC-31)');
    await reachProfileForm({ page, emailStepPage, codeStepPage, profileFormPage, smsStepPage });
    for (const consent of ['electronic', 'terms', 'textMessaging', 'marketing'] as Consent[]) {
      await expect(profileFormPage.consentCheckbox(consent)).toHaveAccessibleName(/.+/);
    }
  });

  test('TC-C-20 @customer @regression @negative @a11y F-03 every email-code OTP box has an accessible name', async ({ page, emailStepPage, codeStepPage }) => {
    defect('F-03', '7 of the 8 email OTP boxes have no accessible name (AC-31)');
    await mockSignUpToProfileForm(page);
    await emailStepPage.open();
    await emailStepPage.requestCode(MOCK_EMAIL);
    await codeStepPage.expectLoaded();
    const boxes = await page.getByRole('textbox').all();
    expect(boxes).toHaveLength(8);
    for (const box of boxes) await expect(box).toHaveAccessibleName(/.+/);
  });

  test('TC-C-20 @customer @regression @negative @a11y F-13 SMS-step OTP boxes and the Back button have accessible names', async ({ page, emailStepPage, codeStepPage, profileFormPage, smsStepPage }) => {
    defect('F-13', '5 of 6 SMS OTP boxes and the Back icon button are unnamed (AC-31)');
    const steps: Steps = { page, emailStepPage, codeStepPage, profileFormPage, smsStepPage };
    await reachSmsStep(steps, 'invalid');
    const boxes = await page.getByRole('textbox').all();
    expect(boxes).toHaveLength(6);
    for (const box of boxes) await expect(box).toHaveAccessibleName(/.+/);
    await expect(smsStepPage.backButton).toHaveAccessibleName(/.+/);
  });

  test('TC-C-21 @customer @regression @a11y keyboard: Tab moves email -> Send code -> Sign in link; Enter submits the email step', async ({ page, emailStepPage, codeStepPage }) => {
    await mockSignUpToProfileForm(page);
    await emailStepPage.open();
    await emailStepPage.enterEmail(MOCK_EMAIL);
    await emailStepPage.email.press('Tab');
    await expect(emailStepPage.sendCodeButton).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(emailStepPage.signInLink).toBeFocused();
    await emailStepPage.email.focus();
    await page.keyboard.press('Enter');
    await codeStepPage.expectLoaded();
  });

  test('TC-C-21 @customer @regression @a11y keyboard: Enter submits the email-code step', async ({ page, emailStepPage, codeStepPage, profileFormPage }) => {
    await mockSignUpToProfileForm(page);
    await emailStepPage.open();
    await emailStepPage.requestCode(MOCK_EMAIL);
    await codeStepPage.expectLoaded();
    await codeStepPage.enterCode('12345678');
    await codeStepPage.expectVerifyEnabled(true);
    await page.keyboard.press('Enter');
    await profileFormPage.waitUntilReady();
  });

  test('TC-C-21 @customer @regression @negative @a11y keyboard: Enter submits the SMS step (AC-35)', async ({ page, emailStepPage, codeStepPage, profileFormPage, smsStepPage }) => {
    defect('NEW-AC-35', 'Enter on the filled 6-digit SMS code does not submit (Enter works on the email and email-code steps)');
    await reachSmsStep({ page, emailStepPage, codeStepPage, profileFormPage, smsStepPage }, 'invalid');
    await smsStepPage.enterCode(wrongCodes.sms);
    await smsStepPage.expectCompleteEnabled(true);
    await page.keyboard.press('Enter');
    await smsStepPage.toast.expectMessage(messages.invalidSmsCode); // the mock rejects the code, proving a submit happened
  });

  test('TC-C-21 @customer @regression @a11y keyboard: password Show/Hide on /login is operable with Enter and Space and exposes its state by name', async ({ loginPage, page }) => {
    await loginPage.open();
    await loginPage.password.fill('Abcdefg1');
    await loginPage.showPasswordButton.focus();
    await page.keyboard.press('Enter');
    await loginPage.expectPasswordMasked(false);
    await expect(loginPage.hidePasswordButton).toBeFocused();
    await page.keyboard.press('Space');
    await loginPage.expectPasswordMasked(true);
  });

  test('TC-C-22 @customer @regression @a11y error toasts are exposed as role=alert', async ({ page, emailStepPage, codeStepPage, profileFormPage, smsStepPage }) => {
    await reachSmsStep({ page, emailStepPage, codeStepPage, profileFormPage, smsStepPage }, 'invalid');
    await smsStepPage.completeProfile(wrongCodes.sms);
    await expect(smsStepPage.toast.alert.filter({ hasText: messages.invalidSmsCode })).toBeVisible();
  });

  test('TC-C-22 @customer @regression @negative @a11y F-04 the "Invalid email" error is announced (role=alert or aria-describedby/aria-invalid)', async ({ emailStepPage }) => {
    defect('F-04', '"Invalid email" has no role=alert and no aria-describedby (AC-34)');
    await emailStepPage.open();
    await emailStepPage.enterEmailAndBlur('abc');
    await emailStepPage.expectInlineError(messages.invalidEmail);
    const announced = emailStepPage.toast.alert.filter({ hasText: messages.invalidEmail });
    const described = (await emailStepPage.email.getAttribute('aria-describedby')) || (await emailStepPage.email.getAttribute('aria-invalid')) === 'true';
    expect((await announced.count()) > 0 || !!described).toBe(true);
  });
});
