import { test, expect } from '../../fixtures/customer.fixture';
import { reachProfileForm } from './helpers';
import { invalidPasswords, messages, syntheticValidPassword } from '../../test-data/customer.data';

test.describe('Customer - sign-up password rules (mocked auth)', () => {
  test.beforeEach(async ({ page, emailStepPage, codeStepPage, profileFormPage, smsStepPage }) => {
    await reachProfileForm({ page, emailStepPage, codeStepPage, profileFormPage, smsStepPage });
  });

  test('TC-C-11 @customer @regression the password policy checklist lists all four rules', async ({ page }) => {
    for (const rule of ['At least 8 characters', 'At least one uppercase letter', 'At least one lowercase letter', 'At least one number']) {
      await expect(page.getByText(rule)).toBeVisible();
    }
  });

  for (const [name, value] of Object.entries(invalidPasswords)) {
    test(`TC-C-11 @customer @regression @negative password violating policy (${name}) shows the policy error`, async ({ profileFormPage }) => {
      await profileFormPage.password.fill(value);
      await profileFormPage.touch(profileFormPage.password);
      await profileFormPage.expectFieldError('password', messages.passwordPolicy);
      await profileFormPage.expectContinueEnabled(false);
    });
  }

  test('TC-C-11 @customer @regression a policy-compliant password shows no policy error', async ({ profileFormPage }) => {
    await profileFormPage.password.fill(syntheticValidPassword());
    await profileFormPage.touch(profileFormPage.password);
    await expect(profileFormPage.fieldError('password')).toHaveCount(0);
  });

  test('TC-C-12 @customer @regression @negative confirm password mismatch shows "Passwords do not match." and clears when fixed', async ({ profileFormPage }) => {
    const password = syntheticValidPassword();
    await profileFormPage.fillProfile({ password, confirmPassword: `${password}x` });
    await profileFormPage.touch(profileFormPage.confirmPassword);
    await profileFormPage.expectFieldError('confirmPassword', messages.passwordMismatch);
    await profileFormPage.expectContinueEnabled(false);
    await profileFormPage.confirmPassword.fill(password);
    await expect(profileFormPage.fieldError('confirmPassword')).toHaveCount(0);
  });

  test('TC-C-26 @customer @regression passwords are masked by default and never appear in the URL', async ({ page, profileFormPage }) => {
    const password = syntheticValidPassword();
    await profileFormPage.fillProfile({ password, confirmPassword: password });
    await profileFormPage.expectPasswordMasked(true);
    await profileFormPage.expectConfirmPasswordMasked(true);
    expect(page.url().startsWith('https://')).toBe(true);
    expect(decodeURIComponent(page.url())).not.toContain(password);
  });
});
