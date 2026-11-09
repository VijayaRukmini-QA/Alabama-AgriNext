import { test, expect } from '../../fixtures/pages.fixture';
import { RUN_REAL_LOGIN, getLenderPassword } from '../../config/env';
import { openEmailStep, openPasswordStep, REAL_LOGIN_SKIP_REASON } from './helpers';

test.describe('Lender login - UI and accessibility', () => {
  test('TC-08 @regression @login password input is masked', async ({ appEntryPage, emailPage, passwordPage }) => {
    await openPasswordStep(appEntryPage, emailPage, passwordPage);
    await passwordPage.enterPassword('typed-text');
    await passwordPage.expectPasswordMasked();
  });

  test('TC-09 @regression @login password show/hide toggle (conditional)', async ({ appEntryPage, emailPage, passwordPage }) => {
    await openPasswordStep(appEntryPage, emailPage, passwordPage);
    const has = await passwordPage.hasPasswordToggle();
    test.skip(!has, 'N/A: no show/hide toggle on Entra page for this tenant (F-08)');
    await passwordPage.enterPassword('typed-text');
    await passwordPage.passwordToggle.check();
    expect(await passwordPage.passwordInputType()).toBe('text');
    await passwordPage.passwordToggle.uncheck();
    expect(await passwordPage.passwordInputType()).toBe('password');
  });

  test('TC-14 @regression @login password step shows all expected elements', async ({ appEntryPage, emailPage, passwordPage }) => {
    const email = await openPasswordStep(appEntryPage, emailPage, passwordPage);
    await passwordPage.expectLoaded();
    await passwordPage.expectEmailDisplayed(email);
    await expect(passwordPage.passwordInput).toHaveAttribute('placeholder', 'Password');
    await expect(passwordPage.passwordInput).toHaveAccessibleName(/Enter the password for/);
  });

  test('TC-16 @regression @login Tab order on the email step', async ({ appEntryPage, emailPage }) => {
    await openEmailStep(appEntryPage, emailPage);
    await emailPage.emailInput.focus();
    await expect(emailPage.emailInput).toBeFocused();
    await emailPage.emailInput.press('Tab');
    await expect(emailPage.cantAccessLink).toBeFocused();
    await emailPage.cantAccessLink.press('Tab');
    await expect(emailPage.nextButton).toBeFocused();
  });

  test('TC-17 @regression @login Tab order on the password step', async ({ appEntryPage, emailPage, passwordPage }) => {
    await openPasswordStep(appEntryPage, emailPage, passwordPage);
    await passwordPage.passwordInput.focus();
    await passwordPage.passwordInput.press('Tab');
    await expect(passwordPage.forgotPasswordLink).toBeFocused();
    await passwordPage.forgotPasswordLink.press('Tab');
    await expect(passwordPage.signInButton).toBeFocused();
  });

  test('TC-19 @regression @login Enter key submits the password step (valid)', async ({ appEntryPage, emailPage, passwordPage, lenderHomePage }) => {
    test.skip(!RUN_REAL_LOGIN, REAL_LOGIN_SKIP_REASON);
    await openPasswordStep(appEntryPage, emailPage, passwordPage);
    await passwordPage.submitPasswordWithEnter(getLenderPassword());
    await lenderHomePage.dismissStaySignedInIfShown();
    await lenderHomePage.expectLoaded();
  });

  test('TC-26 @regression @login @mobile email step renders on mobile', async ({ appEntryPage, emailPage, page }) => {
    await openEmailStep(appEntryPage, emailPage);
    await expect(emailPage.emailInput).toBeInViewport();
    await expect(emailPage.nextButton).toBeVisible();
    await expect(emailPage.termsLink).toBeVisible();
    await expect(emailPage.privacyLink).toBeVisible();
    const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(noHScroll).toBe(true);
  });
});
