import { test, expect } from '../../fixtures/customer.fixture';
import { MOCK_EMAIL, reachProfileForm } from './helpers';
import { mockSignUpToProfileForm } from '../../utils/ciamMocks';
import { messages } from '../../test-data/customer.data';

test.describe('Customer - create profile smoke', () => {
  test('TC-C-02 @customer @smoke @regression start page shows heading, email field, Send code (disabled) and Sign in link', async ({ emailStepPage }) => {
    await emailStepPage.open();
    await emailStepPage.expectLoaded();
    await emailStepPage.expectSendCodeEnabled(false);
    await expect(emailStepPage.signInLink).toBeVisible();
  });

  test('TC-C-02 @customer @smoke @regression valid email enables Send code and advances to the code step (mocked auth)', async ({ page, emailStepPage, codeStepPage }) => {
    await mockSignUpToProfileForm(page);
    await emailStepPage.open();
    await emailStepPage.enterEmail(MOCK_EMAIL);
    await emailStepPage.expectSendCodeEnabled(true);
    await emailStepPage.sendCodeButton.click();
    await codeStepPage.expectLoaded();
    await codeStepPage.expectVerifyEnabled(false);
  });

  test('TC-C-03 @customer @smoke @regression @negative empty email keeps Send code disabled', async ({ emailStepPage }) => {
    await emailStepPage.open();
    await emailStepPage.expectSendCodeEnabled(false);
    await emailStepPage.email.focus();
    await emailStepPage.email.blur();
    await emailStepPage.expectSendCodeEnabled(false);
    await expect(emailStepPage.heading).toBeVisible(); // still on the email step
  });

  test('TC-C-08 @customer @smoke @regression @negative empty mandatory profile fields show "Required field" and Continue stays disabled', async ({ page, emailStepPage, codeStepPage, profileFormPage, smsStepPage }) => {
    await reachProfileForm({ page, emailStepPage, codeStepPage, profileFormPage, smsStepPage });
    await profileFormPage.expectEmailPrefilled(MOCK_EMAIL);
    await profileFormPage.expectContinueEnabled(false);
    for (const field of [profileFormPage.firstName, profileFormPage.lastName, profileFormPage.mobilePhone, profileFormPage.password, profileFormPage.confirmPassword]) {
      await profileFormPage.touch(field);
    }
    await expect(profileFormPage.fieldErrors.filter({ hasText: messages.requiredField })).toHaveCount(5);
    await profileFormPage.expectFieldError('firstName', messages.requiredField);
    await profileFormPage.expectFieldError('lastName', messages.requiredField);
    await profileFormPage.expectFieldError('phoneNumber', messages.requiredField);
    await profileFormPage.expectFieldError('confirmPassword', messages.requiredField);
    await profileFormPage.expectContinueEnabled(false);
  });

  test('TC-C-13 @customer @smoke @regression password Show/Hide works independently on both sign-up fields', async ({ page, emailStepPage, codeStepPage, profileFormPage, smsStepPage }) => {
    await reachProfileForm({ page, emailStepPage, codeStepPage, profileFormPage, smsStepPage });
    await profileFormPage.fillProfile({ password: 'Abcdefg1', confirmPassword: 'Abcdefg1' });
    await profileFormPage.expectPasswordMasked(true);
    await profileFormPage.expectConfirmPasswordMasked(true);

    await profileFormPage.showPassword();
    await profileFormPage.expectPasswordMasked(false);
    await profileFormPage.expectConfirmPasswordMasked(true); // independent
    await expect(profileFormPage.hidePasswordButton).toBeVisible();

    await profileFormPage.showConfirmPassword();
    await profileFormPage.expectConfirmPasswordMasked(false);
    await expect(profileFormPage.hideConfirmPasswordButton).toBeVisible();

    await profileFormPage.hidePassword();
    await profileFormPage.expectPasswordMasked(true);
    await profileFormPage.expectConfirmPasswordMasked(false);
    await profileFormPage.hideConfirmPassword();
    await profileFormPage.expectConfirmPasswordMasked(true);
  });
});
