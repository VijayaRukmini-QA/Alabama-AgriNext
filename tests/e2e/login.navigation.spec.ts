import { test, expect } from '../../fixtures/pages.fixture';
import { BASE_URL } from '../../config/env';
import { urls } from '../../test-data/login.data';
import { openEmailStep, openPasswordStep } from './helpers';

test.describe('Lender login - navigation', () => {
  test('TC-10 @regression @login Forgot my password navigates to password reset', async ({ appEntryPage, emailPage, passwordPage, passwordResetPage }) => {
    await openPasswordStep(appEntryPage, emailPage, passwordPage);
    await expect(passwordPage.forgotPasswordLink).toBeVisible();
    await passwordPage.startPasswordRecovery();
    await passwordResetPage.expectLoaded();
  });

  test('TC-11 @regression @login Cant access your account link is present on the email step', async ({ appEntryPage, emailPage }) => {
    await openEmailStep(appEntryPage, emailPage);
    await expect(emailPage.cantAccessLink).toBeVisible();
    await expect(emailPage.cantAccessLink).toBeEnabled();
  });

  test('TC-12 @regression @login Back returns to the email step', async ({ appEntryPage, emailPage, passwordPage }) => {
    await openPasswordStep(appEntryPage, emailPage, passwordPage);
    await passwordPage.goBackToEmailStep();
    await expect(emailPage.heading).toBeVisible();
    await expect(emailPage.emailInput).toBeEnabled();
  });

  // F-06: /dashboard is not a real route (404, identical to any random path), so it cannot prove route guarding.
  // A genuinely protected route must be supplied before this can assert an Entra redirect for it.
  test('TC-25 @regression @login unauthenticated unknown deep link exposes no app content and home leads to sign-in', async ({ page, appEntryPage }) => {
    await page.goto(new URL('dashboard', BASE_URL).toString());
    await expect(page.getByText('Page Not found')).toBeVisible();
    await expect(page.getByRole('main')).not.toContainText(/logout|sign out/i);
    await page.getByRole('button', { name: 'home page' }).click();
    await appEntryPage.expectRedirectedToMicrosoft();
  });

  test('TC-27 @regression @login refresh on the password step does not break the flow', async ({ appEntryPage, emailPage, passwordPage, page }) => {
    await openPasswordStep(appEntryPage, emailPage, passwordPage);
    await page.reload();
    await expect(emailPage.emailInput.or(passwordPage.passwordInput)).toBeVisible({ timeout: 30_000 });
  });
});
