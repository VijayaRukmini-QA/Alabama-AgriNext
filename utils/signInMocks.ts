import type { Page, Route } from '@playwright/test';
import { MOCK_VALID_CODE } from '../test-data/customer-signin.data';

const b64 = (o: unknown): string => Buffer.from(JSON.stringify(o)).toString('base64url');
const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

/** Registered first so everything registered later wins. Aborts non-Google fetch/xhr so nothing hits the real backend. */
async function abortUnmocked(page: Page): Promise<void> {
  await page.route('**/*', (route) => {
    const req = route.request();
    const t = req.resourceType();
    if ((t === 'fetch' || t === 'xhr') && !/google|gstatic/.test(req.url())) return route.abort();
    return route.continue();
  });
  await page.route('**/ciam-native-auth/**', (route) => route.abort());
}

export interface SignInMfaMockOptions {
  /** 'invalid': every mfa_oob attempt is rejected (wrong code). 'valid' (default): `validCode` is accepted. */
  mfaResult?: 'invalid' | 'valid';
  validCode?: string;
}

/**
 * Mocks the Entra native-auth sign-in up to and including MFA, with no real tenant calls.
 * Call before navigating to /login.
 */
export async function mockSignInToMfa(page: Page, opts: SignInMfaMockOptions = {}): Promise<void> {
  const { mfaResult = 'valid', validCode = MOCK_VALID_CODE } = opts;
  let challengeCount = 0;
  let clientId = 'mock-client-id';

  await abortUnmocked(page);

  await page.route('**/ciam-native-auth/oauth2/v2.0/initiate', (route) => {
    const m = /client_id=([^&]+)/.exec(route.request().postData() ?? '');
    if (m) clientId = decodeURIComponent(m[1]);
    challengeCount = 0;
    return json(route, 200, { continuation_token: 'ct-0' });
  });
  await page.route('**/ciam-native-auth/oauth2/v2.0/challenge', (route) => {
    challengeCount++;
    if (challengeCount === 1) return json(route, 200, { challenge_type: 'password', continuation_token: 'ct-1' });
    return json(route, 200, {
      challenge_type: 'oob',
      binding_method: 'prompt',
      challenge_channel: 'sms',
      challenge_target_label: '+1 *** *** **89',
      code_length: 6,
      continuation_token: 'ct-3',
    });
  });
  await page.route('**/ciam-native-auth/oauth2/v2.0/introspect', (route) =>
    json(route, 200, {
      continuation_token: 'ct-2b',
      methods: [{ id: 'sms-1', challenge_type: 'oob', challenge_channel: 'sms', login_hint: '+1 *** *** **89' }],
    }),
  );
  await page.route('**/ciam-native-auth/oauth2/v2.0/token', (route) => {
    const body = route.request().postData() ?? '';
    const grantType = /grant_type=([^&]+)/.exec(body)?.[1];
    if (grantType === 'password') {
      return json(route, 400, {
        error: 'invalid_grant',
        suberror: 'mfa_required',
        error_description: 'AADSTS50076: mock',
        error_codes: [50076],
        continuation_token: 'ct-2',
      });
    }
    if (grantType === 'mfa_oob') {
      const accepted = mfaResult === 'valid' && body.includes(`oob=${validCode}`);
      if (!accepted) {
        return json(route, 400, {
          error: 'invalid_grant',
          suberror: 'invalid_oob_value',
          error_description: 'AADSTS50181: mock',
          error_codes: [50181],
          continuation_token: 'ct-3',
        });
      }
      const now = Math.floor(Date.now() / 1000);
      const idToken = [
        b64({ alg: 'none', typ: 'JWT' }),
        b64({
          iss: 'https://mock.ciamlogin.com/mock-tid/v2.0',
          aud: clientId,
          sub: 'mock-sub',
          oid: 'mock-oid',
          tid: 'mock-tid',
          iat: now,
          nbf: now,
          exp: now + 3600,
          name: 'Mock User',
          preferred_username: 'mock@example.com',
          emails: ['mock@example.com'],
          ver: '2.0',
        }),
        'sig',
      ].join('.');
      return json(route, 200, {
        token_type: 'Bearer',
        scope: 'openid profile offline_access',
        expires_in: 3600,
        access_token: 'mock-at',
        refresh_token: 'mock-rt',
        id_token: idToken,
        client_info: b64({ uid: 'mock-oid', utid: 'mock-tid' }),
      });
    }
    return json(route, 400, { error: 'invalid_request' });
  });

  // Backend calls the SPA makes around sign-in; mocked so no spurious "Service is currently unavailable" toast.
  // CurrentUser shape verified in the exploratory run. PrivacyPolicy: the bundle shows a bare GET on /PrivacyPolicy
  // returning response.data with no visible shape, so an empty array (harmless 200) is a documented assumption.
  await page.route('**/Agrinext.UserManager/api/CurrentUser', (route) =>
    json(route, 200, { id: '1', email: 'mock@example.com' }),
  );
  await page.route(/\/PrivacyPolicy(\?.*)?$/, (route) => json(route, 200, []));
}

export type SignInFailure = 'user_not_found' | 'invalid_grant' | 'locked';

/** Mocks a failed sign-in: user_not_found at `initiate` (50034); wrong password (50126) or lockout (50053) at `token`. */
export async function mockSignInFailure(page: Page, errorCode: SignInFailure): Promise<void> {
  await abortUnmocked(page);
  // Same harmless backend mocks as the MFA recipe, so an aborted PrivacyPolicy call does not add a stray
  // "Something went wrong!" toast next to the sign-in error (mock artefact, not an app defect).
  await page.route(/\/PrivacyPolicy(\?.*)?$/, (route) => json(route, 200, []));

  const failure = {
    user_not_found: { error: 'user_not_found', error_description: 'AADSTS50034: mock user not found', error_codes: [50034] },
    invalid_grant: { error: 'invalid_grant', error_description: 'AADSTS50126: mock invalid credentials', error_codes: [50126] },
    locked: { error: 'invalid_grant', error_description: 'AADSTS50053: mock account locked', error_codes: [50053] },
  }[errorCode];

  if (errorCode === 'user_not_found') {
    await page.route('**/ciam-native-auth/oauth2/v2.0/initiate', (route) => json(route, 400, failure));
    return;
  }
  await page.route('**/ciam-native-auth/oauth2/v2.0/initiate', (route) =>
    json(route, 200, { continuation_token: 'ct-0' }),
  );
  await page.route('**/ciam-native-auth/oauth2/v2.0/challenge', (route) =>
    json(route, 200, { challenge_type: 'password', continuation_token: 'ct-1' }),
  );
  await page.route('**/ciam-native-auth/oauth2/v2.0/token', (route) =>
    json(route, 400, { ...failure, continuation_token: 'ct-2' }),
  );
}
