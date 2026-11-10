import { test, expect } from '../../../fixtures/customer.fixture';
import { CUSTOMER_BASE_URL, getCustomerEmail, getCustomerPassword } from '../../../config/env';
import { INITIATE_URL, observe } from '../signin/signin.helpers';

// Module: Customer Loan Application (Land & Home), signed-out access. TS-L-01 / TC-L-01..06.
// Post-sign-in loan screens are NOT covered: no customer account exists (B-L1), so their locators are unobserved.

const APPLY = '/apply-for-a-loan';
const LOAN_INFO = '/loan-application-creation/loan-information';

test.describe('Customer Loan Application - signed-out access', () => {
  test('TC-L-01 @customer @loan @smoke @regression @negative signed-out /apply-for-a-loan shows the public page, no redirect, no form', async ({ page, publicLoanGatePage: gate }) => {
    await gate.open(APPLY);
    expect(new URL(page.url()).pathname).toBe(APPLY);
    await gate.expectPublicGate();
    await gate.expectNoLoanForm();
  });

  test('TC-L-02 @customer @loan @smoke @regression @negative signed-out loan-information route shows the public page, no form', async ({ page, publicLoanGatePage: gate }) => {
    await gate.open(LOAN_INFO);
    expect(new URL(page.url()).pathname).toBe(LOAN_INFO);
    await gate.expectPublicGate();
    await gate.expectNoLoanForm();
  });

  // Destinations are observations (Q-L-02: whether login returns to the loan route cannot be shown without an account).
  test('TC-L-03 @customer @loan @regression SIGN IN and CREATE PROFILE on the signed-out loan route go to /login and /create-profile', async ({ page, publicLoanGatePage: gate }) => {
    await gate.open(LOAN_INFO);
    await gate.goToSignIn();
    await expect(page).toHaveURL(/\/login/);
    observe(`SIGN IN from ${LOAN_INFO} -> ${gate.currentPathAndQuery()} (loan route remembered in URL: ${/loan/i.test(page.url())})`);

    await gate.open(LOAN_INFO);
    await gate.goToCreateProfile();
    await expect(page).toHaveURL(/\/create-profile/);
    observe(`CREATE PROFILE from ${LOAN_INFO} -> ${gate.currentPathAndQuery()}`);
  });

  // No axe-core in this repo (and none may be added): role/name + keyboard focus only. axe part of the TC stays manual.
  for (const route of [APPLY, LOAN_INFO]) {
    test(`TC-L-04 @customer @loan @regression @a11y ${route} SIGN IN and CREATE PROFILE are named and keyboard reachable`, async ({ publicLoanGatePage: gate }) => {
      await gate.open(route);
      // Named: located by role + accessible name, exactly one each.
      await expect(gate.signInButton).toHaveCount(1);
      await expect(gate.createProfileButton).toHaveCount(1);
      await expect(gate.signInButton).toHaveAccessibleName(/^sign in$/i);
      await expect(gate.createProfileButton).toHaveAccessibleName(/^create profile$/i);
      // Reachable: Tab reaches each in turn.
      await gate.tabUntilFocused(gate.signInButton);
      await expect(gate.signInButton).toBeFocused();
      await gate.tabUntilFocused(gate.createProfileButton);
      await expect(gate.createProfileButton).toBeFocused();
    });
  }

  // TC-L-05 route variants. Final URL is recorded; the assertion is public page + no form.
  const variants: { name: string; suffix: (p: string) => string }[] = [
    { name: 'query string', suffix: (p) => `${p}?ref=test` },
    { name: 'trailing slash', suffix: (p) => `${p}/` },
    { name: 'uppercase path', suffix: (p) => p.toUpperCase() },
  ];
  for (const route of [APPLY, LOAN_INFO]) {
    for (const v of variants) {
      test(`TC-L-05 @customer @loan @regression @negative ${route} variant (${v.name}) still shows the public page`, async ({ page, publicLoanGatePage: gate }) => {
        await gate.open(v.suffix(route));
        observe(`${v.name}: final URL ${gate.currentPathAndQuery()}`);
        await gate.expectPublicGate();
        await gate.expectNoLoanForm();
        await expect(page.locator('body')).not.toContainText(/stack trace|exception|at \w+\.\w+ \(/i);
      });
    }
    test(`TC-L-05 @customer @loan @regression @negative ${route} variant (stale session cookie) still shows the public page`, async ({ page, context, publicLoanGatePage: gate }) => {
      const host = new URL(CUSTOMER_BASE_URL).hostname;
      await context.addCookies(
        ['session', 'sessionid', '.AspNetCore.Cookies', 'access_token'].map((name) => ({ name, value: 'stale-garbage-value', domain: host, path: '/' })),
      );
      await gate.open(route);
      observe(`stale cookie: final URL ${gate.currentPathAndQuery()}`);
      await gate.expectPublicGate();
      await gate.expectNoLoanForm();
      expect(page.url()).not.toMatch(/error/i);
    });
  }

  // BLOCKER-EVIDENCE CHECK (B-L1). It asserts that CUSTOMER_EMAIL is NOT a usable account: the identity provider
  // answers 400 user_not_found. It is expected to FAIL once the account is registered; that failure is the signal to
  // unblock TC-L-07..66 (build the post-login page objects from the live page), then retire or invert this test.
  // Exactly one real sign-in attempt, never looped. Tagged @loan-signin so customer-chromium skips it.
  test('TC-L-06 @customer @loan @loan-signin @regression @negative blocker evidence B-L1: CUSTOMER_EMAIL is not a registered account, so no loan route is reachable', async ({
    page,
    loginPage,
    publicLoanGatePage: gate,
  }) => {
    const email = getCustomerEmail();
    const password = getCustomerPassword();
    test.info().annotations.push({
      type: 'blocker',
      description: 'B-L1: asserts the account is NOT usable. A failure here means the account now exists: unblock TC-L-07..66.',
    });

    await loginPage.open();
    const initiate = page.waitForResponse((r) => INITIATE_URL.test(r.url()) && r.request().method() === 'POST');
    await loginPage.signIn(email, password);
    const response = await initiate; // single attempt
    const status = response.status();
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    observe(`initiate -> HTTP ${status}, error=${body.error ?? '(none)'}`);

    expect(status, 'B-L1 evidence: initiate status (not 400 means the account may now exist)').toBe(400);
    expect(body.error, 'B-L1 evidence: error code').toBe('user_not_found');

    // UI evidence: still on /login, no code step. Positive checks only (the toast auto-dismisses).
    await expect(page).toHaveURL(/\/login/);
    await loginPage.expectOnLoginForm();

    // No loan route is reachable as a customer: the public page is shown.
    await gate.open(APPLY);
    await gate.expectPublicGate();
    await gate.expectNoLoanForm();
  });
});
