import type { Page, Route } from '@playwright/test';

/**
 * Mock recipe for the app's own Microsoft Entra native-auth API
 * (docs/EXPLORATORY-FINDINGS-Create-Customer-Profile.md, "Mock recipe").
 * Only responses of the app's `ciam-native-auth` calls are faked in the test browser; no account is created
 * and Google Places stays real. Playwright runs the LAST registered matching route first, so the catch-all
 * abort is registered first: any unmocked auth call fails loudly instead of reaching the real tenant.
 */

const ids = { timestamp: '2026-11-09 00:00:00Z', trace_id: '0', correlation_id: '1' };

function json(route: Route, status: number, body: object): Promise<void> {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

/** Create-profile email step, then code step (any 8 digits accepted), then the /sign-up profile form. */
export async function mockSignUpToProfileForm(page: Page): Promise<void> {
  await page.route('**/ciam-native-auth/**', (route) => route.abort()); // catch-all FIRST
  let challengeCalls = 0;
  await page.route('**/signup/v1.0/start', (r) => json(r, 200, { continuation_token: 'mock-ct-0' }));
  await page.route('**/signup/v1.0/challenge', (r) => {
    challengeCalls += 1;
    if (challengeCalls === 1) {
      return json(r, 200, {
        challenge_type: 'oob',
        binding_method: 'prompt',
        challenge_channel: 'email',
        challenge_target_label: 'a***@y***.com',
        code_length: 8,
        interval: 300,
        continuation_token: 'mock-ct-1',
      });
    }
    return json(r, 200, { continuation_token: 'mock-ct-3', challenge_type: 'password' });
  });
  await page.route('**/signup/v1.0/continue', (r) => {
    const body = r.request().postData() ?? '';
    if (/grant_type=password/.test(body)) return json(r, 200, { continuation_token: 'mock-ct-4' });
    return json(r, 400, {
      error: 'credential_required',
      error_description: 'AADSTS55103: Mock',
      error_codes: [55103],
      ...ids,
      continuation_token: 'mock-ct-2',
    });
  });
}

export type MockSmsOptions = { smsVerify: 'invalid' | 'valid' };

/**
 * Profile form Continue, then the SMS code step. Call AFTER mockSignUpToProfileForm (routes stack on top).
 * smsVerify 'invalid': every SMS code is rejected (invalid_oob_value), as observed.
 * smsVerify 'valid': every SMS code is accepted (200). UNVERIFIED: the app's behaviour after a valid code
 * (token issue / redirect) was never explored, so do not assert on what follows.
 */
export async function mockProfileSubmitToSms(page: Page, { smsVerify }: MockSmsOptions): Promise<void> {
  await page.route('**/oauth2/v2.0/token', (r) =>
    json(r, 400, {
      error: 'invalid_grant',
      suberror: 'registration_required',
      error_description: 'AADSTS500222: mock',
      error_codes: [500222],
      ...ids,
      continuation_token: 'mock-ct-5',
    }),
  );
  await page.route('**/register/v1.0/introspect', (r) =>
    json(r, 200, {
      continuation_token: 'mock-ct-6',
      methods: [{ id: 'sms', challenge_type: 'oob', challenge_channel: 'sms', login_hint: 'mock' }],
    }),
  );
  await page.route('**/register/v1.0/challenge', (r) =>
    json(r, 200, {
      continuation_token: 'mock-ct-7',
      challenge_type: 'oob',
      challenge_channel: 'sms',
      challenge_target_label: '(***) ***-0100',
      code_length: 6,
      interval: 300,
      binding_method: 'prompt',
    }),
  );
  await page.route('**/register/v1.0/continue', (r) => {
    if (smsVerify === 'valid') return json(r, 200, { continuation_token: 'mock-ct-9' });
    return json(r, 400, {
      error: 'invalid_grant',
      suberror: 'invalid_oob_value',
      error_description: 'AADSTS50181: mock invalid code',
      error_codes: [50181],
      ...ids,
      continuation_token: 'mock-ct-8',
    });
  });
}
