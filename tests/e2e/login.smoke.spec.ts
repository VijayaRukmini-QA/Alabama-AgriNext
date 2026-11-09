import { test, expect } from '../../fixtures/pages.fixture';
import { RUN_REAL_LOGIN, getLenderEmail, getLenderPassword } from '../../config/env';
import { messages, nonExistentEmail } from '../../test-data/login.data';
import { openEmailStep, REAL_LOGIN_SKIP_REASON } from './helpers';

test.describe('Lender login - smoke', () => {
  test('TC-01 @smoke @login unauthenticated visit redirects to Microsoft sign-in over HTTPS', async ({ appEntryPage, emailPage, page }) => {
    await appEntryPage.openAndAwaitSignIn();
    await appEntryPage.expectRedirectedToMicrosoft();
    expect(new URL(page.url()).protocol).toBe('https:');
    await emailPage.waitUntilReady();
    await expect(emailPage.heading).toBeVisible();
  });

  test('TC-02 @smoke @login valid login lands in the Lender app', async ({ appEntryPage, emailPage, passwordPage, lenderHomePage }) => {
    test.skip(!RUN_REAL_LOGIN, REAL_LOGIN_SKIP_REASON);
    const email = getLenderEmail();
    await openEmailStep(appEntryPage, emailPage);
    await emailPage.submitEmail(email);
    await passwordPage.waitUntilReady();
    await passwordPage.expectEmailDisplayed(email);
    await expect(passwordPage.backButton).toBeVisible();
    await passwordPage.submitPassword(getLenderPassword());
    await lenderHomePage.dismissStaySignedInIfShown();
    await lenderHomePage.expectLoaded();
  });

  test('TC-03 @smoke @regression @login empty email shows required message', async ({ appEntryPage, emailPage, passwordPage }) => {
    await openEmailStep(appEntryPage, emailPage);
    await emailPage.submitEmptyEmail();
    await emailPage.expectError(messages.emptyEmail);
    await emailPage.expectStillOnEmailStep();
    await expect(passwordPage.heading).toBeHidden();
  });

  test('TC-04 @smoke @regression @login non-existent email is rejected', async ({ appEntryPage, emailPage }) => {
    await openEmailStep(appEntryPage, emailPage);
    await emailPage.submitEmail(nonExistentEmail());
    await emailPage.expectError(messages.accountNotFound);
    await emailPage.expectStillOnEmailStep();
  });

  test('TC-13 @smoke @regression @login email step shows all expected elements', async ({ appEntryPage, emailPage }) => {
    await openEmailStep(appEntryPage, emailPage);
    await emailPage.expectLoaded();
    await expect(emailPage.emailInput).toHaveAttribute('placeholder', 'Email, phone, or Skype');
    await expect(emailPage.termsLink).toBeVisible();
    await expect(emailPage.privacyLink).toBeVisible();
  });

  test('TC-15 @smoke @regression @login form fields have accessible names', async ({ appEntryPage, emailPage, passwordPage }) => {
    await openEmailStep(appEntryPage, emailPage);
    for (const el of [emailPage.emailInput, emailPage.nextButton, emailPage.cantAccessLink, emailPage.signInOptionsButton]) {
      await expect(el).toHaveAccessibleName(/.+/);
    }
    await emailPage.submitEmail(getLenderEmail());
    await passwordPage.waitUntilReady();
    for (const el of [passwordPage.passwordInput, passwordPage.signInButton, passwordPage.backButton, passwordPage.forgotPasswordLink]) {
      await expect(el).toHaveAccessibleName(/.+/);
    }
    await expect(passwordPage.passwordInput).toHaveAccessibleName(/password/i);
  });

  test('TC-18 @smoke @regression @login Enter key submits the email step', async ({ appEntryPage, emailPage, passwordPage }) => {
    await openEmailStep(appEntryPage, emailPage);
    await emailPage.submitEmailWithEnter(getLenderEmail());
    await passwordPage.waitUntilReady();
  });
});
