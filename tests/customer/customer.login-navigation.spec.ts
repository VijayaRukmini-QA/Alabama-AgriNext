import { test, expect } from '../../fixtures/customer.fixture';
import { defect } from './helpers';
import { uniqueYopmailEmail } from '../../utils/customerEmail';
import { messages, syntheticValidPassword } from '../../test-data/customer.data';

test.describe('Customer - sign in, forgot password and navigation', () => {
  test('TC-C-13 @customer @smoke @regression password Show/Hide on /login toggles the field type and the button name', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.password.fill('Abcdefg1');
    await loginPage.expectPasswordMasked(true);
    await loginPage.showPassword();
    await loginPage.expectPasswordMasked(false);
    await expect(loginPage.hidePasswordButton).toBeVisible();
    await loginPage.hidePassword();
    await loginPage.expectPasswordMasked(true);
    await expect(loginPage.showPasswordButton).toBeVisible();
  });

  test('TC-C-07 @customer @regression Sign in is disabled until both fields are filled', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.expectSignInEnabled(false);
    await loginPage.email.fill('someone@yopmail.com');
    await loginPage.expectSignInEnabled(false);
    await loginPage.password.fill('Abcdefg1');
    await loginPage.expectSignInEnabled(true);
  });

  test('TC-C-07 @customer @regression @negative sign in with an unknown account shows a generic "Invalid email or password." toast', async ({ loginPage, page }) => {
    await loginPage.open();
    await loginPage.signIn(uniqueYopmailEmail(), syntheticValidPassword());
    await loginPage.toast.expectMessage(messages.invalidLogin);
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC-C-07 @customer @regression Forgot password? on /login navigates to the reset page, and Sign in goes back', async ({ loginPage, forgotPasswordPage, page }) => {
    await loginPage.open();
    await loginPage.goToForgotPassword();
    await expect(page).toHaveURL(/\/forgot-password/);
    await forgotPasswordPage.expectLoaded();
    await forgotPasswordPage.backToSignIn();
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.signInButton).toBeVisible();
  });

  test('TC-C-07 @customer @regression Create one on /login navigates to the create-profile email step', async ({ loginPage, emailStepPage, page }) => {
    await loginPage.open();
    await loginPage.goToCreateProfile();
    await expect(page).toHaveURL(/\/create-profile/);
    await emailStepPage.expectLoaded();
  });

  test('TC-C-02 @customer @regression landing page buttons lead to sign in and create profile', async ({ landingPage, loginPage, emailStepPage, page }) => {
    await landingPage.open();
    await landingPage.expectLoaded();
    await landingPage.startSignIn();
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.signInButton).toBeVisible();
    await landingPage.open();
    await landingPage.startCreateProfile();
    await expect(page).toHaveURL(/\/create-profile/);
    await emailStepPage.expectLoaded();
  });

  test('TC-C-02 @customer @regression the Sign in link on the email step leads to /login', async ({ emailStepPage, loginPage, page }) => {
    await emailStepPage.open();
    await emailStepPage.goToSignIn();
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.signInButton).toBeVisible();
  });

  test('TC-C-07 @customer @regression forgot password page shows heading and email field; Send is disabled while empty', async ({ forgotPasswordPage }) => {
    await forgotPasswordPage.open();
    await forgotPasswordPage.expectLoaded();
    await expect(forgotPasswordPage.sendCodeButton).toBeDisabled();
    await forgotPasswordPage.email.fill('someone@yopmail.com');
    await expect(forgotPasswordPage.sendCodeButton).toBeEnabled();
  });

  test('TC-C-07 @customer @regression @negative F-10 a malformed email on forgot password is rejected client-side with no request', async ({ page, forgotPasswordPage }) => {
    defect('F-10', 'forgot password has no client-side email validation ("bad" enables Send and calls the network)');
    let authCalls = 0;
    await page.route('**/ciam-native-auth/**', (route) => {
      authCalls += 1;
      return route.abort(); // never reaches the real tenant
    });
    await forgotPasswordPage.open();
    await forgotPasswordPage.email.fill('bad');
    await forgotPasswordPage.email.blur();
    const sendDisabled = await forgotPasswordPage.sendCodeButton.isDisabled();
    if (!sendDisabled) await forgotPasswordPage.sendCodeButton.click();
    // Correct behaviour: either Send is disabled or an inline validation error shows, and nothing is sent.
    const inlineError = await page.getByTestId('error_text').filter({ hasText: /invalid email/i }).count();
    expect(sendDisabled || inlineError > 0).toBe(true);
    expect(authCalls).toBe(0);
  });

  // Real call, but an unknown throwaway address: no code is sent and CUSTOMER_EMAIL is not used.
  test('TC-C-X1 @customer @regression @negative F-09 forgot password does not reveal whether an account exists', async ({ page, forgotPasswordPage }) => {
    defect('F-09', 'forgot password says "We couldn\'t find an account with this email address." (account enumeration, AC-40)');
    await forgotPasswordPage.open();
    const response = page.waitForResponse((r) => /resetpassword\/v1\.0\/start/.test(r.url()) && r.request().method() === 'POST');
    await forgotPasswordPage.requestCode(uniqueYopmailEmail());
    await response; // the server has answered; now observe what the UI says about it
    // Wait for the outcome to render: a toast WITH TEXT or the code step (not an empty live region).
    const codeStep = page.getByRole('textbox', { name: /verification code/i });
    const toastWithText = forgotPasswordPage.toast.alert.filter({ hasText: /\S/ });
    await expect(toastWithText.or(codeStep).first()).toBeVisible();
    // Capture the text once. Never assert absence with toHaveCount(0): the toast auto-dismisses (F-05), so that
    // retrying assertion would pass as soon as the toast disappears (this was a false pass).
    const shown = (await toastWithText.allInnerTexts()).join(' | ');
    // Correct behaviour: nothing may disclose that no account exists (fails today: defect F-09).
    expect(shown, 'forgot-password UI message').not.toMatch(/couldn.t find an account|no account|not found|does not exist/i);
  });
});
