import { test, expect } from '../../../fixtures/customer.fixture';
import { AUTH_URL, observe, uniqueUnknownEmail } from './signin.helpers';

// TC-S-01, 16, 17, 19 are already covered by tagged tests in tests/customer/customer.login-navigation.spec.ts.
// Those tests do not check BR-08 ("no request is sent by navigating") or that /login is empty after returning,
// so the residual checks live here in one journey.

test.describe('Customer Sign in - navigation', () => {
  test('TC-S-16 TC-S-17 TC-S-19 @customer @signin @smoke @regression Forgot password? and Create one navigate without sending an auth request, and returning shows an empty form', async ({
    page,
    loginPage,
    forgotPasswordPage,
    emailStepPage,
  }) => {
    let authCalls = 0;
    await page.route(AUTH_URL, (route) => {
      authCalls += 1;
      return route.abort(); // nothing may reach the real tenant
    });

    await loginPage.open();
    await loginPage.goToForgotPassword();
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(forgotPasswordPage.heading).toBeVisible();
    await expect(forgotPasswordPage.email).toBeVisible();
    await expect(forgotPasswordPage.sendCodeButton).toBeVisible();
    await expect(forgotPasswordPage.backToSignInButton).toBeVisible();

    await forgotPasswordPage.backToSignIn();
    await expect(page).toHaveURL(/\/login/);
    await loginPage.expectEmailValue('');
    await loginPage.expectPasswordValue('');
    await loginPage.expectSignInEnabled(false);

    await loginPage.goToCreateProfile();
    await expect(page).toHaveURL(/\/create-profile/);
    await emailStepPage.expectLoaded();

    expect(authCalls, 'requests to ciam-native-auth while navigating').toBe(0);
  });

  // One real call to the reset-password start endpoint with an unknown synthetic address (no code is sent).
  test('TC-S-18 @customer @signin @regression Forgot password with an unknown email shows the known enumeration message (recorded, F-09)', async ({ page, forgotPasswordPage }) => {
    await forgotPasswordPage.open();
    const response = page.waitForResponse((r) => /resetpassword\/v1\.0\/start/.test(r.url()) && r.request().method() === 'POST');
    await forgotPasswordPage.requestCode(uniqueUnknownEmail());
    await response; // server answered; now read the UI (toast auto-dismisses)
    const toast = forgotPasswordPage.toast.alert.filter({ hasText: /\S/ }).first();
    await expect(toast).toBeVisible();
    const text = (await toast.innerText()).trim();
    observe(`F-09 recorded, not re-raised (Q-16): reset page says "${text}"`);
    expect(text).toContain("We couldn't find an account with this email address.");
  });
});
