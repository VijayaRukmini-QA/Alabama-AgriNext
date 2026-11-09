import type { Page, Request } from '@playwright/test';
import { test, expect } from '../../../fixtures/customer.fixture';
import type { CustomerLoginPage } from '../../../pages/customer/CustomerLoginPage';
import type { SignInMfaStepPage } from '../../../pages/customer/SignInMfaStepPage';
import type { Toast } from '../../../pages/customer/Toast';
import { MOCK_CREDENTIALS } from '../../../test-data/customer-signin.data';
import { mockSignInToMfa, type SignInMfaMockOptions } from '../../../utils/signInMocks';

/** Non-secret synthetic input for accounts that do not exist (TEST-CASES doc, TD data). */
export const SYNTHETIC_PASSWORD = 'Aa1!wrongPass';

export const AUTH_URL = /\/ciam-native-auth\//;
export const INITIATE_URL = /\/ciam-native-auth\/oauth2\/v2\.0\/initiate/;
export const CHALLENGE_URL = /\/ciam-native-auth\/oauth2\/v2\.0\/challenge/;
export const TOKEN_URL = /\/ciam-native-auth\/oauth2\/v2\.0\/token/;

/** Unique, unregistered synthetic address on a non-existent domain (never CUSTOMER_EMAIL). */
export function uniqueUnknownEmail(): string {
  return `qa.signin.${Date.now()}${Math.floor(Math.random() * 1000)}@agrinextqa-nodomain-test.com`;
}

/** Records a known defect on the test; the assertion that follows still encodes the correct behaviour. */
export function defect(id: string, description: string): void {
  test.info().annotations.push({ type: 'defect', description: `${id} ${description}` });
}

/** Records an observation (behaviour the ACs leave open, or something a mock cannot prove). */
export function observe(description: string): void {
  test.info().annotations.push({ type: 'observation', description });
}

/** Counts requests whose URL matches `pattern` (listener only, does not intercept). */
export function trackRequests(page: Page, pattern: RegExp): { count: () => number; urls: () => string[] } {
  const urls: string[] = [];
  page.on('request', (r: Request) => {
    if (pattern.test(r.url())) urls.push(r.url());
  });
  return { count: () => urls.length, urls: () => [...urls] };
}

/** The `oob` codes posted to the token endpoint with grant_type=mfa_oob. */
export function trackMfaOobCodes(page: Page): { codes: () => string[] } {
  const codes: string[] = [];
  page.on('request', (r: Request) => {
    if (!TOKEN_URL.test(r.url())) return;
    const body = r.postData() ?? '';
    if (!body.includes('grant_type=mfa_oob')) return;
    codes.push(decodeURIComponent(/oob=([^&]*)/.exec(body)?.[1] ?? ''));
  });
  return { codes: () => [...codes] };
}

/** Mocked sign-in up to the SMS code step. */
export async function reachMfa(
  page: Page,
  loginPage: CustomerLoginPage,
  mfaStepPage: SignInMfaStepPage,
  opts: SignInMfaMockOptions = {},
): Promise<void> {
  await mockSignInToMfa(page, opts);
  await loginPage.open();
  await loginPage.signIn(MOCK_CREDENTIALS.email, MOCK_CREDENTIALS.password);
  await mfaStepPage.expectLoaded();
}

/** Waits for an alert WITH text, then captures that text once (toasts auto-dismiss, S-F-05). */
export async function captureToastText(toast: Toast): Promise<string> {
  const withText = toast.alert.filter({ hasText: /\S/ }).first();
  await expect(withText).toBeVisible();
  return (await withText.innerText()).trim();
}

/**
 * Clicks Sign in, waits for the identity-provider response, then expects the generic error toast.
 * Waiting for the response first matters when an older toast is still on screen (auto-dismiss ~6 s).
 */
export async function submitAndExpectGeneric(page: Page, loginPage: CustomerLoginPage, message: string): Promise<void> {
  const response = page.waitForResponse((r) => INITIATE_URL.test(r.url()));
  await loginPage.signInButton.click();
  await response;
  await expect(loginPage.toast.alert.filter({ hasText: message }).last()).toBeVisible();
}
