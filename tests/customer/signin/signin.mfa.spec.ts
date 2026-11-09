import type { Page, Route } from '@playwright/test';
import { test, expect } from '../../../fixtures/customer.fixture';
import { MOCK_CREDENTIALS, MOCK_VALID_CODE, SIGNIN_MESSAGES } from '../../../test-data/customer-signin.data';
import { mockSignInFailure, mockSignInToMfa } from '../../../utils/signInMocks';
import {
  AUTH_URL,
  CHALLENGE_URL,
  INITIATE_URL,
  SYNTHETIC_PASSWORD,
  TOKEN_URL,
  captureToastText,
  defect,
  observe,
  reachMfa,
  trackMfaOobCodes,
  trackRequests,
} from './signin.helpers';

// Everything here runs against mocked Entra native-auth responses (utils/signInMocks.ts). Mocks cannot prove the real
// post-login route or any server rule (code expiry, reuse, Resend invalidation); those are server-side and recorded.

const isMfaOob = (route: Route): boolean => (route.request().postData() ?? '').includes('grant_type=mfa_oob');
const oobResponse = (page: Page) =>
  page.waitForResponse((r) => TOKEN_URL.test(r.url()) && (r.request().postData() ?? '').includes('grant_type=mfa_oob'));

test.describe('Customer Sign in - MFA code step (mocked)', () => {
  test('TC-S-42 @customer @signin @regression valid credentials lead to the SMS code step', async ({ page, loginPage, mfaStepPage }) => {
    await reachMfa(page, loginPage, mfaStepPage);
    await expect(mfaStepPage.smsStatement).toBeVisible();
    await expect(page).not.toHaveURL(/\/apply-for-a-loan/);
    await mfaStepPage.expectVerifyEnabled(false);
  });

  test('TC-S-43 @customer @signin @regression @negative opening /apply-for-a-loan before a code is entered shows only the sign-in prompt', async ({ page, loginPage, mfaStepPage, landingPage }) => {
    const oob = trackMfaOobCodes(page);
    await reachMfa(page, loginPage, mfaStepPage);
    await page.goto('/apply-for-a-loan');
    await landingPage.expectLoaded(); // signed-out welcome page, same as TC-S-35
    await expect(mfaStepPage.heading).toHaveCount(0);
    expect(oob.codes(), 'no code was ever submitted').toEqual([]);
  });

  test('TC-S-44 @customer @signin @regression @negative an empty code cannot be submitted', async ({ page, loginPage, mfaStepPage }) => {
    const oob = trackMfaOobCodes(page);
    await reachMfa(page, loginPage, mfaStepPage);
    await mfaStepPage.expectVerifyEnabled(false);
    await mfaStepPage.codeBox.click();
    await mfaStepPage.pressEnterToSubmit();
    await mfaStepPage.expectLoaded();
    await expect(page).not.toHaveURL(/\/apply-for-a-loan/);
    expect(oob.codes()).toEqual([]);
  });

  test('TC-S-45 @customer @signin @regression @negative a wrong 6-digit code is rejected and the user stays on the code step', async ({ page, loginPage, mfaStepPage }) => {
    const oob = trackMfaOobCodes(page);
    await reachMfa(page, loginPage, mfaStepPage, { mfaResult: 'invalid' });
    const response = oobResponse(page);
    await mfaStepPage.verify('000000');
    expect((await response).status()).toBe(400);
    const text = await captureToastText(mfaStepPage.toast);
    expect(text).toContain(SIGNIN_MESSAGES.mfaWrongCode);
    await mfaStepPage.expectLoaded();
    await mfaStepPage.expectCodeCleared();
    await expect(page).toHaveURL(/\/login/);
    expect(oob.codes()).toEqual(['000000']);
  });

  test('TC-S-46 @customer @signin @regression @negative codes of wrong length or format are never accepted', async ({ page, loginPage, mfaStepPage }) => {
    const oob = trackMfaOobCodes(page);
    await mockSignInToMfa(page, { mfaResult: 'invalid' });
    const outcomes: string[] = [];
    for (const value of ['12345', '1234567', '12ab56', 'abcdef', ' 123456 ', '123 456']) {
      await test.step(`code "${value}"`, async () => {
        await loginPage.open();
        await loginPage.signIn(MOCK_CREDENTIALS.email, MOCK_CREDENTIALS.password);
        await mfaStepPage.expectLoaded();
        await mfaStepPage.enterCode(value);
        const entered = await mfaStepPage.enteredCode();
        const enabled = await mfaStepPage.verifyButton.isEnabled();
        if (enabled) {
          const response = oobResponse(page);
          await mfaStepPage.verifyButton.click();
          await response;
        }
        observe(`EDGE-09 recorded: "${value}" -> boxes "${entered}", Verify enabled=${enabled}`);
        await mfaStepPage.expectLoaded();
        await expect(page).not.toHaveURL(/\/apply-for-a-loan/);
        if (entered.length < 6) expect(enabled, `Verify must stay disabled for "${entered}"`).toBe(false);
      });
    }
    expect(oob.codes().filter((c) => !/^\d{6}$/.test(c)), 'malformed codes sent to the server').toEqual([]);
  });

  test('TC-S-47 @customer @signin @regression @negative an expired code is rejected and the user is not signed in', async ({ page, loginPage, mfaStepPage }) => {
    await reachMfa(page, loginPage, mfaStepPage, { mfaResult: 'invalid' });
    const response = oobResponse(page);
    await mfaStepPage.verify('123456');
    expect((await response).status()).toBe(400);
    await captureToastText(mfaStepPage.toast);
    await mfaStepPage.expectLoaded();
    await expect(page).toHaveURL(/\/login/);
    observe('Q-05: Entra returns invalid_oob_value for expired codes too (assumed shape); the validity period itself is server-side and not provable with a mock.');
  });

  test('TC-S-48 @customer @signin @regression a correct code exchanges the token and leaves the MFA step', async ({ page, loginPage, mfaStepPage }) => {
    const oob = trackMfaOobCodes(page);
    await reachMfa(page, loginPage, mfaStepPage, { mfaResult: 'valid' });
    const response = oobResponse(page);
    await mfaStepPage.verify(MOCK_VALID_CODE);
    expect((await response).status()).toBe(200);
    expect(oob.codes()).toEqual([MOCK_VALID_CODE]);
    await expect(mfaStepPage.heading).toBeHidden();
    await expect(page).not.toHaveURL(/\/login/);
    observe('Mocks cannot prove the real post-login route: with mocks the SPA navigated to "/". The /apply-for-a-loan landing (AC-04) is verified only by TC-S-60 (@e2e-full).');
  });

  test('TC-S-49 @customer @signin @regression @negative double-clicking Verify code sends one verification', async ({ page, loginPage, mfaStepPage }) => {
    const oob = trackMfaOobCodes(page);
    await reachMfa(page, loginPage, mfaStepPage, { mfaResult: 'valid' });
    await mfaStepPage.enterCode(MOCK_VALID_CODE);
    await mfaStepPage.verifyButton.dblclick();
    await expect(mfaStepPage.heading).toBeHidden();
    expect(oob.codes()).toEqual([MOCK_VALID_CODE]);
  });

  test('TC-S-41 @customer @signin @regression @negative double-clicking Sign in sends one sign-in and one code', async ({ page, loginPage, mfaStepPage }) => {
    await mockSignInToMfa(page);
    const initiates = trackRequests(page, INITIATE_URL);
    const challenges = trackRequests(page, CHALLENGE_URL);
    await loginPage.open();
    await loginPage.fillCredentials(MOCK_CREDENTIALS.email, MOCK_CREDENTIALS.password);
    await loginPage.signInButton.dblclick();
    await mfaStepPage.expectLoaded();
    expect(initiates.count(), 'initiate calls').toBe(1);
    expect(challenges.count(), 'challenge calls: password + one SMS code').toBe(2);
  });

  test('TC-S-50 @customer @signin @regression pasting a full code into the first box fills all boxes or is rejected, never a partial submit', async ({ context, page, loginPage, mfaStepPage }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const oob = trackMfaOobCodes(page);
    await reachMfa(page, loginPage, mfaStepPage, { mfaResult: 'invalid' });
    await page.evaluate(() => navigator.clipboard.writeText('123456'));
    await mfaStepPage.codeBox.focus();
    await page.keyboard.press('Control+V');
    await expect.poll(() => mfaStepPage.enteredCode()).not.toBeUndefined();
    const entered = await mfaStepPage.enteredCode();
    observe(`EDGE-10 recorded (F-13 on sign-up): after paste the boxes hold "${entered}"`);
    expect(['', '123456'], `boxes after paste: "${entered}"`).toContain(entered);
    expect(oob.codes().filter((c) => c !== '123456'), 'wrong or partial code auto-submitted').toEqual([]);
  });

  test('TC-S-51 @customer @signin @regression @negative @a11y every code box, Verify code and the SMS statement have accessible names (S-F-06)', async ({ page, loginPage, mfaStepPage }) => {
    defect('S-F-06', 'MFA code boxes 2 to 6 have no accessible name (AC-14, REQ-12)');
    await reachMfa(page, loginPage, mfaStepPage);
    await expect(mfaStepPage.smsStatement).toBeVisible();
    await expect(mfaStepPage.verifyButton).toHaveAccessibleName(/.+/);
    await expect(mfaStepPage.cancelButton).toHaveAccessibleName(/.+/);
    await expect(mfaStepPage.resendCountdown).toBeVisible();
    await expect(mfaStepPage.allCodeBoxes).toHaveCount(6);
    // Soft so that every unnamed box is listed in one run; this is the defect-detecting assertion.
    for (let i = 0; i < 6; i++) {
      await expect.soft(mfaStepPage.allCodeBoxes.nth(i), `code box ${i + 1} accessible name`).toHaveAccessibleName(/.+/);
    }
  });

  test('TC-S-52 @customer @signin @regression Resend code requests exactly one new code and restarts the countdown', async ({ page, loginPage, mfaStepPage }) => {
    await page.clock.install(); // fake timers: the ~30 s Resend timer is advanced instead of waited for
    const challenges = trackRequests(page, CHALLENGE_URL);
    await reachMfa(page, loginPage, mfaStepPage);
    expect(challenges.count()).toBe(2); // password + first SMS code
    await page.clock.runFor(31_000);
    await mfaStepPage.expectResendAvailable();
    await mfaStepPage.resendButton.click();
    await expect.poll(() => challenges.count()).toBe(3);
    await mfaStepPage.expectResendCountingDown();
    const toast = await mfaStepPage.toast.alert.filter({ hasText: /\S/ }).first().innerText({ timeout: 2_000 }).catch(() => 'none seen');
    observe(`AC-18 recorded: confirmation after Resend = restarted countdown; toast text: "${toast.trim()}"`);
  });

  test('TC-S-53 @customer @signin @regression the Resend countdown is not clickable until it ends', async ({ page, loginPage, mfaStepPage }) => {
    await page.clock.install();
    const challenges = trackRequests(page, CHALLENGE_URL);
    await reachMfa(page, loginPage, mfaStepPage);
    await mfaStepPage.expectResendCountingDown();
    observe(`Timer start recorded: "${(await mfaStepPage.resendCountdown.innerText()).trim()}" (about 30 s)`);
    await mfaStepPage.resendCountdown.click();
    await page.clock.runFor(15_000);
    await mfaStepPage.expectResendCountingDown();
    expect(challenges.count(), 'early clicks must not request a code').toBe(2);
    await page.clock.runFor(16_000);
    await mfaStepPage.expectResendAvailable();
  });

  test('TC-S-54 @customer @signin @regression a code typed after Resend is submitted unchanged and the server decides (Q-06)', async ({ page, loginPage, mfaStepPage }) => {
    await page.clock.install();
    const oob = trackMfaOobCodes(page);
    await reachMfa(page, loginPage, mfaStepPage, { mfaResult: 'invalid' });
    await page.clock.runFor(31_000);
    await mfaStepPage.expectResendAvailable();
    await mfaStepPage.resendButton.click();
    await mfaStepPage.expectResendCountingDown();
    const response = oobResponse(page);
    await mfaStepPage.verify('111111'); // the "first" code, issued before Resend
    await response;
    expect(oob.codes()).toEqual(['111111']);
    await mfaStepPage.expectLoaded();
    observe('Q-06 recorded: whether the pre-Resend code is still valid is server-side; the mock rejects it, so only the client behaviour (submits as typed, stays on step) is asserted.');
  });

  test('TC-S-68 @customer @signin @regression @negative an already-used code is rejected and the user is not signed in', async ({ page, loginPage, mfaStepPage }) => {
    await reachMfa(page, loginPage, mfaStepPage, { mfaResult: 'invalid' });
    const response = oobResponse(page);
    await mfaStepPage.verify('123456');
    expect((await response).status()).toBe(400);
    await captureToastText(mfaStepPage.toast);
    await mfaStepPage.expectLoaded();
    await expect(page).toHaveURL(/\/login/);
    observe('Code reuse is a server rule; the mock answers invalid_oob_value (assumed shape), so only the client reaction is asserted.');
  });

  test('TC-S-57 @customer @signin @regression refreshing on the code step never signs the user in', async ({ page, loginPage, mfaStepPage }) => {
    const oob = trackMfaOobCodes(page);
    await reachMfa(page, loginPage, mfaStepPage);
    await page.reload();
    await expect(loginPage.signInButton.or(mfaStepPage.heading)).toBeVisible();
    const onMfa = await mfaStepPage.heading.isVisible();
    observe(`Q-15 recorded: after refresh the app shows ${onMfa ? 'the code step' : 'the login form'} at ${new URL(page.url()).pathname}`);
    await expect(page).not.toHaveURL(/\/apply-for-a-loan/);
    expect(oob.codes()).toEqual([]);
  });

  test('TC-S-58 @customer @signin @regression Back then Forward on the code step never signs the user in', async ({ page, landingPage, loginPage, mfaStepPage }) => {
    const oob = trackMfaOobCodes(page);
    await mockSignInToMfa(page);
    await landingPage.open();
    await landingPage.startSignIn();
    await loginPage.signIn(MOCK_CREDENTIALS.email, MOCK_CREDENTIALS.password);
    await mfaStepPage.expectLoaded();
    const anyScreen = loginPage.signInButton.or(mfaStepPage.heading).or(landingPage.createProfileButton);
    await page.goBack();
    await expect(anyScreen.first()).toBeVisible();
    observe(`Q-15 recorded: after Back the path is ${new URL(page.url()).pathname}`);
    await expect(page).not.toHaveURL(/\/apply-for-a-loan/);
    await page.goForward();
    await expect(anyScreen.first()).toBeVisible();
    observe(`Q-15 recorded: after Forward the path is ${new URL(page.url()).pathname}, code step visible=${await mfaStepPage.heading.isVisible()}`);
    await expect(page).not.toHaveURL(/\/apply-for-a-loan/);
    expect(oob.codes()).toEqual([]);
  });

  test('TC-S-67 @customer @signin @regression the verification code is not exposed in any URL and all requests use HTTPS', async ({ page, loginPage, mfaStepPage }) => {
    const code = '830417';
    const requestUrls: string[] = [];
    const navigations: string[] = [];
    page.on('request', (r) => requestUrls.push(r.url()));
    page.on('framenavigated', (f) => {
      if (f === page.mainFrame()) navigations.push(f.url());
    });
    await reachMfa(page, loginPage, mfaStepPage, { validCode: code });
    observe(`REQ-13 recorded: code box type="${await mfaStepPage.codeBox.getAttribute('type')}" (masking per OTP convention, not a password)`);
    const response = oobResponse(page);
    await mfaStepPage.verify(code);
    await response;
    await expect(mfaStepPage.heading).toBeHidden();
    for (const url of [page.url(), ...navigations, ...requestUrls]) {
      expect(url, 'url carries the verification code').not.toContain(code);
    }
    expect(requestUrls.filter((u) => !/^(https:|data:|blob:|about:)/.test(u)), 'non-HTTPS requests').toEqual([]);
    expect(new URL(page.url()).hash).not.toContain(code);
  });

  for (const mode of [{ name: '500', status: 500 }, { name: '503', status: 503 }, { name: 'aborted', status: 0 }]) {
    test(`TC-S-66 @customer @signin @regression @negative verify code with the identity provider ${mode.name} shows an error and Verify code stays usable`, async ({ page, loginPage, mfaStepPage }) => {
      await mockSignInToMfa(page, { mfaResult: 'valid' });
      let verifyCalls = 0;
      await page.route(TOKEN_URL, (route) => {
        if (!isMfaOob(route)) return route.fallback();
        verifyCalls += 1;
        return mode.status === 0
          ? route.abort('failed')
          : route.fulfill({ status: mode.status, contentType: 'application/json', body: JSON.stringify({ error: 'server_error' }) });
      });
      await loginPage.open();
      await loginPage.signIn(MOCK_CREDENTIALS.email, MOCK_CREDENTIALS.password);
      await mfaStepPage.expectLoaded();
      await mfaStepPage.verify(MOCK_VALID_CODE);
      const text = await captureToastText(mfaStepPage.toast);
      observe(`Copy recorded for ${mode.name}: "${text}"`);
      expect(verifyCalls, 'one verify request per click').toBe(1);
      await mfaStepPage.expectLoaded();
      await expect(page).not.toHaveURL(/\/apply-for-a-loan/);
      await mfaStepPage.expectCodeCleared();
      await mfaStepPage.enterCode(MOCK_VALID_CODE);
      await mfaStepPage.expectVerifyEnabled(true);
      await mfaStepPage.verifyButton.click();
      await expect.poll(() => verifyCalls).toBe(2);
    });
  }
});

test.describe('Customer Sign in - identity-provider failures and lockout on the credentials step (mocked)', () => {
  for (const mode of [{ name: '500', status: 500 }, { name: '503', status: 503 }, { name: 'aborted', status: 0 }]) {
    test(`TC-S-40 @customer @signin @regression @negative Sign in with the identity provider ${mode.name} shows an error and the form stays usable`, async ({ page, loginPage, mfaStepPage }) => {
      let calls = 0;
      await page.route(AUTH_URL, (route) => {
        calls += 1;
        return mode.status === 0
          ? route.abort('failed')
          : route.fulfill({ status: mode.status, contentType: 'application/json', body: JSON.stringify({ error: 'server_error' }) });
      });
      await loginPage.open();
      await loginPage.signIn('unknown.user@example.test', SYNTHETIC_PASSWORD);
      const text = await captureToastText(loginPage.toast);
      observe(`Copy recorded for ${mode.name}: "${text}" (delayed/timeout mode not automated: client timeout unknown)`);
      expect(calls, 'one request per click').toBe(1);
      await loginPage.expectOnLoginForm();
      await expect(loginPage.email).toBeEnabled();
      await loginPage.expectSignInEnabled(true);
      await expect(mfaStepPage.heading).toHaveCount(0);
      await loginPage.signInButton.click();
      await expect.poll(() => calls).toBe(2);
    });
  }

  test('TC-S-55 @customer @signin @regression @negative a lockout response from the identity provider shows the lockout message and no code step', async ({ page, loginPage, mfaStepPage }) => {
    await mockSignInFailure(page, 'locked');
    await loginPage.open();
    await loginPage.signIn('registered.mock@example.test', SYNTHETIC_PASSWORD);
    await loginPage.toast.expectMessage(SIGNIN_MESSAGES.lockout);
    await expect(page).toHaveURL(/\/login/);
    await expect(mfaStepPage.heading).toHaveCount(0);
    observe('Q-07: threshold N and duration are server-side; one mocked lockout (AADSTS50053) is submitted. S-F-12: this message differs from the generic failure and reveals that the account exists.');
  });
});
