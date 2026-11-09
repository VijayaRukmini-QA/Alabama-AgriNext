import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../../../fixtures/customer.fixture';
import { CustomerLoginPage } from '../../../pages/customer/CustomerLoginPage';
import { SIGNIN_MESSAGES } from '../../../test-data/customer-signin.data';
import { mockSignInFailure } from '../../../utils/signInMocks';
import {
  AUTH_URL,
  INITIATE_URL,
  SYNTHETIC_PASSWORD,
  captureToastText,
  observe,
  submitAndExpectGeneric,
  trackRequests,
  uniqueUnknownEmail,
} from './signin.helpers';

// Spec: docs/TEST-CASES-Customer-Signin.md (TS-S-01, 02, 04, 05, 06).
// Already covered by existing tests (title-tagged, not duplicated): TC-S-01, 02, 03, 08, 16, 17, 19, 20, 21, 23
// in tests/customer/customer.login-navigation.spec.ts and customer.a11y.spec.ts.

const FAKE_EMAIL = 'unknown.user@example.test';
const GENERIC = SIGNIN_MESSAGES.invalidCredentials;

/** Flushes pending event handlers deterministically (two animation frames), instead of a timed wait. */
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
}

async function expectNoOverlap(locators: Locator[]): Promise<void> {
  const boxes = [];
  for (const l of locators) {
    const b = await l.boundingBox();
    expect(b, 'control has a bounding box').not.toBeNull();
    boxes.push(b!);
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      const overlap = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
      expect(overlap, `controls ${i} and ${j} overlap`).toBe(false);
    }
  }
}

async function expectAllControlsFit(page: Page, loginPage: CustomerLoginPage): Promise<void> {
  await loginPage.password.fill(SYNTHETIC_PASSWORD);
  for (const control of [
    loginPage.email,
    loginPage.password,
    loginPage.showPasswordButton,
    loginPage.signInButton,
    loginPage.forgotPasswordButton,
    loginPage.createOneLink,
  ]) {
    await control.scrollIntoViewIfNeeded();
    await expect(control).toBeVisible();
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(1);
  await expectNoOverlap([loginPage.email, loginPage.password, loginPage.signInButton, loginPage.forgotPasswordButton, loginPage.createOneLink]);
}

test.describe('Customer Sign in - enable rule and input handling', () => {
  test('TC-S-04 @customer @signin @regression only password filled keeps Sign in disabled', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.password.fill(SYNTHETIC_PASSWORD);
    await loginPage.expectSignInEnabled(false);
  });

  test('TC-S-05 @customer @signin @regression Sign in enables with both fields and disables again when one is cleared', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.email.fill(FAKE_EMAIL);
    await loginPage.password.fill(SYNTHETIC_PASSWORD);
    await loginPage.expectSignInEnabled(true);
    await loginPage.email.clear();
    await loginPage.expectSignInEnabled(false);
    await loginPage.email.fill(FAKE_EMAIL);
    await loginPage.expectSignInEnabled(true);
    await loginPage.password.clear();
    await loginPage.expectSignInEnabled(false);
  });

  test('TC-S-06 @customer @signin @regression whitespace-only fields: enable state is recorded and the page does not crash', async ({ loginPage, page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await loginPage.open();

    await loginPage.email.fill('   ');
    await loginPage.expectSignInEnabled(false); // DT-S-01 R4: password empty
    await loginPage.password.fill(SYNTHETIC_PASSWORD);
    observe(`DT-S-01 R3 whitespace email + password: Sign in enabled=${await loginPage.signInButton.isEnabled()} (Q-09, recorded)`);

    await loginPage.email.fill(FAKE_EMAIL);
    await loginPage.password.fill('   ');
    observe(`email + whitespace password: Sign in enabled=${await loginPage.signInButton.isEnabled()} (Q-09, recorded)`);
    await expect(loginPage.email).toBeVisible();
    expect(errors, 'uncaught page errors').toEqual([]);
  });

  test('TC-S-07 @customer @signin @regression @negative Enter in Email with an empty password does not submit', async ({ loginPage, page }) => {
    let authCalls = 0;
    await page.route(AUTH_URL, (route) => {
      authCalls += 1;
      return route.abort(); // never reaches the real tenant, even if the app wrongly submits
    });
    await loginPage.open();
    await loginPage.email.fill(FAKE_EMAIL);
    await loginPage.email.press('Enter');
    await settle(page);
    expect(authCalls, 'requests to ciam-native-auth').toBe(0);
    await expect(page).toHaveURL(/\/login/);
    await loginPage.expectSignInEnabled(false);
  });

  test('TC-S-22 @customer @signin @regression Hide password masks the field again and keeps the typed value', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.password.fill(SYNTHETIC_PASSWORD);
    await loginPage.showPassword();
    await loginPage.expectPasswordMasked(false);
    await loginPage.hidePassword();
    await loginPage.expectPasswordMasked(true);
    await loginPage.expectPasswordValue(SYNTHETIC_PASSWORD);
    await expect(loginPage.showPasswordButton).toBeVisible();
  });
});

test.describe('Customer Sign in - credential errors (mocked identity provider)', () => {
  test('TC-S-09 @customer @signin @regression @negative malformed emails get a validation message or the generic error and never reach the code step', async ({ page, loginPage, mfaStepPage }) => {
    await mockSignInFailure(page, 'user_not_found');
    await loginPage.open();
    const outcomes: string[] = [];
    for (const email of ['notanemail', 'user@', '@domain.com', 'a b@c.com']) {
      await test.step(`email "${email}"`, async () => {
        await loginPage.email.fill(email);
        await loginPage.password.fill(SYNTHETIC_PASSWORD);
        if (await loginPage.signInButton.isDisabled()) {
          outcomes.push(`${email}: Sign in disabled`);
          return;
        }
        await loginPage.signInButton.click();
        const message = page.getByRole('alert').filter({ hasText: /invalid email|valid email/i }).first();
        await expect(message).toBeVisible();
        const text = (await message.innerText()).trim();
        outcomes.push(`${email} -> "${text}"`);
        await expect(page).toHaveURL(/\/login/);
        await expect(mfaStepPage.heading).toHaveCount(0);
      });
    }
    observe(`Q-08 recorded: ${outcomes.join('; ')}`);
    observe('S-F-02: /login has no client-side email format check (form is noValidate). AC-25 allows the generic server error, so this is a recorded observation, not a failed assertion.');
  });

  test('TC-S-10 @customer @signin @regression @negative a 7-character password for an unknown email gives a message and no code step', async ({ page, loginPage, mfaStepPage }) => {
    await mockSignInFailure(page, 'user_not_found');
    await loginPage.open();
    await loginPage.signIn(FAKE_EMAIL, 'Ab1!xyz');
    const text = await captureToastText(loginPage.toast);
    observe(`Q-10 recorded: 7-char password outcome "${text}"`);
    await expect(page).toHaveURL(/\/login/);
    await expect(mfaStepPage.heading).toHaveCount(0);
  });

  test('TC-S-11 @customer @signin @regression the form keeps the email and a second submit works after the error toast dismisses', async ({ page, loginPage }) => {
    await mockSignInFailure(page, 'user_not_found');
    const initiates = trackRequests(page, INITIATE_URL);
    await loginPage.open();
    await loginPage.signIn(FAKE_EMAIL, SYNTHETIC_PASSWORD);
    await loginPage.toast.expectMessage(GENERIC);
    // Waiting for the dismissal is the precondition of this case (S-F-05, auto-dismiss ~6 s), not a proof of absence.
    await expect(loginPage.toast.alert.filter({ hasText: GENERIC })).toBeHidden({ timeout: 15_000 });
    await loginPage.expectEmailValue(FAKE_EMAIL);
    await loginPage.password.fill(`${SYNTHETIC_PASSWORD}2`);
    await loginPage.expectSignInEnabled(true);
    await loginPage.signInButton.click();
    await loginPage.toast.expectMessage(GENERIC);
    expect(initiates.count()).toBe(2);
  });

  test('TC-S-12 @customer @signin @regression @negative very long and unicode passwords get the generic error, no crash', async ({ page, loginPage }) => {
    await mockSignInFailure(page, 'user_not_found');
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await loginPage.open();
    for (const password of ['a'.repeat(1000), 'Pässwörd😀1!', 'пароль1!']) {
      await test.step(`password of ${password.length} chars`, async () => {
        await loginPage.email.fill(FAKE_EMAIL);
        await loginPage.password.fill(password);
        await submitAndExpectGeneric(page, loginPage, GENERIC);
        await expect(page).toHaveURL(/\/login/);
        const body = await page.locator('body').innerText();
        expect(body).not.toMatch(/stack trace|TypeError|ReferenceError|Unhandled/i);
      });
    }
    expect(errors, 'uncaught page errors').toEqual([]);
  });

  test('TC-S-13 @customer @signin @regression @negative wrong password for a registered email shows the generic error (mocked)', async ({ page, loginPage, mfaStepPage }) => {
    await mockSignInFailure(page, 'invalid_grant');
    await loginPage.open();
    await loginPage.signIn('registered.mock@example.test', SYNTHETIC_PASSWORD);
    await loginPage.toast.expectMessage(GENERIC);
    await expect(page).toHaveURL(/\/login/);
    await expect(mfaStepPage.heading).toHaveCount(0);
  });

  test('TC-S-15 @customer @signin @regression @negative unknown email and wrong password are indistinguishable (both mocked)', async ({ context, page, loginPage }) => {
    const capture = async (p: Page, lp: CustomerLoginPage, mode: 'user_not_found' | 'invalid_grant') => {
      await mockSignInFailure(p, mode);
      await lp.open();
      await lp.signIn(mode === 'user_not_found' ? FAKE_EMAIL : 'registered.mock@example.test', SYNTHETIC_PASSWORD);
      const generic = lp.toast.alert.filter({ hasText: GENERIC }).first();
      await expect(generic).toBeVisible();
      const text = (await generic.innerText()).trim();
      const role = await generic.getAttribute('role');
      const enabled = await lp.signInButton.isEnabled();
      return { text, role, path: new URL(p.url()).pathname, enabled };
    };
    const unknown = await capture(page, loginPage, 'user_not_found');
    const secondPage = await context.newPage();
    const wrong = await capture(secondPage, new CustomerLoginPage(secondPage), 'invalid_grant');
    expect(wrong).toEqual(unknown);
    expect(unknown.text).toContain(GENERIC);
    observe('The live unknown-email side is TC-S-08 (tagged existing test); timing class not compared.');
  });
});

test.describe('Customer Sign in - real unknown-account submit (rate-limited)', () => {
  test('TC-S-28 TC-S-29 @customer @signin @regression @a11y Enter in Password submits once and the error is exposed as role alert', async ({ page, loginPage }) => {
    const initiates = trackRequests(page, INITIATE_URL);
    await loginPage.open();
    await loginPage.fillCredentials(uniqueUnknownEmail(), SYNTHETIC_PASSWORD);
    const response = page.waitForResponse((r) => INITIATE_URL.test(r.url()));
    await loginPage.password.press('Enter');
    await response; // the server has answered; only then look at the toast (it auto-dismisses, S-F-05)
    const text = await captureToastText(loginPage.toast); // Toast.alert is getByRole('alert'): AC-35
    expect(text).toContain(GENERIC); // the toast also carries a title ("Error")
    expect(initiates.count(), 'sign-in requests for one Enter').toBe(1);
    await expect(page).toHaveURL(/\/login/);
    observe('Real submit: synthetic unknown email, never CUSTOMER_EMAIL.');
  });
});

test.describe('Customer Sign in - layout and accessibility', () => {
  test('TC-S-24 @customer @signin @regression all controls are visible at 1280 px without horizontal scroll', async ({ page, loginPage }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginPage.open();
    await expectAllControlsFit(page, loginPage);
  });

  test('TC-S-25 @customer @signin @regression @mobile all controls are visible at 375 px without horizontal scroll', async ({ page, loginPage }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginPage.open();
    await expectAllControlsFit(page, loginPage);
  });

  test('TC-S-27 @customer @signin @regression @a11y Tab order is email, password, Show password, Sign in, Forgot password?, Create one with visible focus', async ({ page, loginPage }) => {
    await loginPage.open();
    await loginPage.fillCredentials(FAKE_EMAIL, SYNTHETIC_PASSWORD);
    await loginPage.email.focus();
    const order = [
      loginPage.email,
      loginPage.password,
      loginPage.showPasswordButton,
      loginPage.signInButton,
      loginPage.forgotPasswordButton,
      loginPage.createOneLink,
    ];
    for (const [i, control] of order.entries()) {
      if (i > 0) await page.keyboard.press('Tab');
      await expect(control).toBeFocused();
      expect(await control.evaluate((el) => el.matches(':focus-visible')), `control ${i} shows keyboard focus`).toBe(true);
    }
  });

  test('TC-S-31 @customer @signin @regression @a11y inputs have accessible names; autocomplete values are recorded', async ({ loginPage }) => {
    await loginPage.open();
    await expect(loginPage.email).toHaveAccessibleName('Email address');
    await expect(loginPage.password).toHaveAccessibleName(/^Password$/);
    const emailAuto = await loginPage.email.getAttribute('autocomplete');
    const passwordAuto = await loginPage.password.getAttribute('autocomplete');
    observe(`Q-11 recorded: autocomplete email="${emailAuto}", password="${passwordAuto}"`);
  });
});
