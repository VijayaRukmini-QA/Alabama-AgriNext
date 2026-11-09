# Exploratory Findings: Customer Sign In

- **App:** customer portal, Dev (`CUSTOMER_BASE_URL`), route `/login`
- **Date:** 2026-11-09
- **Tooling:** Playwright 1.65 library scripts (no MCP)
- **Real sign-in submits:** 1, with no wrong-password attempts against `CUSTOMER_EMAIL`. All other submits used mocked Entra native-auth responses (`page.route`).

## Blockers (stop-and-report; no bypass attempted)

| ID | Observation | Impact |
|---|---|---|
| B-S1 / S-F-01 | A real sign-in with `CUSTOMER_EMAIL`/`CUSTOMER_PASSWORD` fails. `POST /ciam-native-auth/oauth2/v2.0/initiate` returns 400 `user_not_found` (AADSTS50034), and the UI shows "Invalid email or password." Confirmed twice today. | The real happy path and real MFA cannot pass until a valid account exists in this tenant. Creating one is blocked: see the Create Customer Profile findings, B1. |
| B-S2 / F-02 | `SMS_INBOX_URL` (receive-smss.com) still shows a Cloudflare challenge ("Just a moment..."). | SMS codes cannot be read automatically. |

## Flow (from the app bundle and mocked runs)

The calls are `initiate`, then `challenge` (password), then `token` (`grant_type=password`), which returns 400 `mfa_required` (50076). The flow continues with `introspect`, then `challenge` (oob/sms). The MFA step renders inside `/login` (heading "Multi-factor authentication"). Finally `token` (`grant_type=mfa_oob`) runs, the app calls `CurrentUser`, and it navigates to `/`.

A landing on `/apply-for-a-loan` was not observed with mocks. The final route probably depends on the real profile response, so it is unverified.

## Locators (each validated to resolve to exactly one element)

| Screen | Element | Locator |
|---|---|---|
| /login | Email | `getByRole('textbox', { name: 'Email address' })` |
| /login | Password | `getByRole('textbox', { name: 'Password' })` (avoid `getByLabel('Password')`, which is ambiguous) |
| /login | Show/Hide | `getByRole('button', { name: 'Show password' })` / `'Hide password'` |
| /login | Sign in | `getByRole('button', { name: 'Sign in' })`, disabled until both fields are filled |
| /login | Forgot password | `getByRole('button', { name: 'Forgot password?' })` goes to `/forgot-password` and prefills the email |
| /login | Create one | `getByRole('link', { name: 'Create one' })` |
| /login | Error toast | `getByRole('alert')`, auto-dismisses after about 6 s |
| MFA | Heading | `getByRole('heading', { name: 'Multi-factor authentication' })` |
| MFA | Code box 0 | `getByRole('textbox', { name: 'Enter verification code' })`. There are 6 boxes; type the digits after clicking box 0. |
| MFA | Verify | `getByRole('button', { name: 'Verify code' })`, disabled until 6 digits are entered |
| MFA | Cancel | `getByRole('button', { name: 'Cancel' })` returns to the login form (email kept, password cleared) |
| MFA | Resend | the span `Resend code (Ns)`, which becomes `getByRole('button', { name: 'Resend code' })` after about 30 s |
| /forgot-password | Heading / Email / Send / Back | "Reset your password" / textbox "Enter your email address" / button "Send verification code" / button "Sign in" |

## Observed behaviour and messages

- **Sign-in failure:** "Invalid email or password." This is the same message for an unknown account, so it does not enumerate.
- **Lockout:** the code maps AADSTS50053 to "Your account has been locked due to too many failed sign-in attempts. Please try again in 15 minutes." Not triggered.
- **MFA wrong code:** "Code is invalid. Please check the code and re-enter, or click Resend code." The boxes are cleared.
- **Keyboard:**
  - Enter submits from the email or password field and on the MFA step.
  - Tab order: email, password, Show password, Sign in, Forgot password?, Create one.
  - Space toggles the show/hide button.
- **While submitting:** the inputs are disabled and the button reads "Signing in…".
- **After an error:** the email and password are both kept. Typing clears the error.

## Findings

| ID | Severity | Type | Finding |
|---|---|---|---|
| S-F-01 | Blocker (test data) | Data | `CUSTOMER_EMAIL` is not registered in the tenant (`user_not_found`). |
| S-F-02 | Low | Validation | A malformed email (`abc`, `a b@c.com`) enables Sign in and is submitted. The form has `noValidate` and there is no client-side format check. |
| S-F-03 | Low | Security/UX | The password is kept in the field after a failed sign-in. |
| S-F-04 | Low | Validation | Email and password have no maxlength (400+ characters accepted). |
| S-F-05 | Low | UX/Accessibility | The error toast auto-dismisses after about 6 s (same as F-05). |
| S-F-06 | Medium | Accessibility | MFA code boxes 2 to 6 have no accessible name or id. |
| S-F-07 | Low | Accessibility | The MFA "Resend code (Ns)" countdown is a span and is not announced. |
| S-F-08 | Info | Consistency | The login MFA step (button "Verify code", Cancel, Enter submits) differs from the sign-up SMS step (button "Complete Profile", unnamed back icon, Enter does nothing: F-17). |
| S-F-10 | Info | Testability | `getByLabel('Password')` is ambiguous because the toggle's label also matches. |
| S-F-11 | Info | UX | Cancel on MFA clears the password, so the user must retype it. |
| S-F-12 | Info | Security | The lockout message differs from the generic failure, which reveals that the account exists (seen in the code only). |

Note: the "Something went wrong! Service is currently unavailable." toast in `screenshots/customer-signin/mfa-challenge.png` is a mock artefact. The PrivacyPolicy call was aborted during exploration. It is not an app defect.

## Mock recipe (MFA)

Register the routes in this order, because the last one registered wins:
1. `**/*`: abort non-Google fetch/xhr requests.
2. `**/ciam-native-auth/**`: abort.
3. The specific responses:

| Call | Response |
|---|---|
| `oauth2/v2.0/initiate` | 200 `{continuation_token}` |
| `oauth2/v2.0/challenge`, 1st call | 200 `{challenge_type:'password'}` |
| `oauth2/v2.0/challenge`, later calls | 200 `{challenge_type:'oob', challenge_channel:'sms', code_length:6, ...}` |
| `oauth2/v2.0/token`, password | 400 `{error:'invalid_grant', suberror:'mfa_required', error_codes:[50076], continuation_token}` |
| `oauth2/v2.0/introspect` | 200 `{methods:[{id:'sms-1', challenge_type:'oob', challenge_channel:'sms'}]}` |
| `oauth2/v2.0/token`, mfa_oob, wrong code | 400 `{suberror:'invalid_oob_value', error_codes:[50181]}` |
| `oauth2/v2.0/token`, mfa_oob, accepted code | 200 with tokens and an unsigned id_token |

The full working recipe is in the session scratchpad (`mfa4.js`). It is ported into `utils/ciamMocks.ts`.
