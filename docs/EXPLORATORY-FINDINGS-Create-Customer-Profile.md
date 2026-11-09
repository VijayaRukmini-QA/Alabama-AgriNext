# Exploratory Findings: Create Customer Profile

- **App:** customer portal, Dev (`CUSTOMER_BASE_URL`)
- **Date:** 2026-11-09
- **Tooling:** Playwright 1.65 library scripts and `npx playwright` (no MCP)
- **Sessions:** two charters
  - Live app: landing, login, create-profile email/code steps, forgot password, resend.
  - Profile form and SMS step reached by mocking the app's own Entra native-auth responses (`page.route`). No account was created.
- **Data used:** throwaway `agcustomer<timestamp>@yopmail.com` addresses only. `CUSTOMER_EMAIL` was used for one code send and one sign-in probe.
- **Real code sends:** 5 in total.

## Blockers (stop-and-report, no bypass attempted)

| ID | Site | Observation | Impact |
|---|---|---|---|
| B1 / F-01 | yopmail.com inbox (`/en/wm`) | Interactive Cloudflare Turnstile overlay "Please confirm you are human to continue". Not cleared after 15 s. The home page `/en/` loads without a challenge. | Cannot read the email verification code automatically. |
| B2 / F-02 | receive-smss.com (`SMS_INBOX_URL`) | Cloudflare managed challenge "Just a moment... / Performing security verification". Not cleared after 25 s. Evidence: `screenshots/customer/receive-smss-page.png`. | Cannot read the SMS code automatically. |

Consequences:
- The full real end-to-end registration (to `/apply-for-a-loan`) could not be executed.
- Whether the phone number must be unique, and the real "already registered" behaviour, remain unverified.

Options for the team, which need a human or product-owner decision:
- a Cloudflare-allowlisted runner, or a test mail/SMS provider with an API (e.g. Mailosaur, Twilio test numbers);
- an Entra test-tenant OTP bypass;
- manual code entry.

## Routes

| Step | Route |
|---|---|
| Landing | `/` (buttons "Sign in", "Create profile") |
| Sign in | `/login` |
| Forgot password | `/forgot-password` |
| Create profile: email step and email-code step | `/create-profile` |
| Profile form and SMS (MFA) step | `/sign-up` (in-memory state; same page) |
| Expected end | `/apply-for-a-loan` (not reached; blocked) |

Auth is Microsoft Entra External ID native auth (`/ciam-native-auth/signup|resetpassword|register/v1.0/*`, `/oauth2/v2.0/token`).

## Locators (each validated to resolve to exactly one element)

### Landing `/`
- `getByRole('button', { name: 'Sign in' })`
- `getByRole('button', { name: 'Create profile' })`

### Create profile: email step
- **Heading:** `getByRole('heading', { name: 'Welcome to the Alabama Ag Credit Customer Portal' })`
- **Email:** `getByRole('textbox', { name: 'To create a profile, enter your email address.' })`
  - `type=email`, maxlength 255
- **Send code:** `getByRole('button', { name: 'Send verification code' })`
  - disabled until the email is valid
- **Sign in link:** `getByRole('link', { name: 'Sign in' })`

### Create profile: email-code step
- **Heading:** `getByRole('heading', { name: 'Check your email' })`
- **Code input:** 8 OTP boxes.
  - Only the first is named: `getByRole('textbox', { name: 'Enter verification code' })`.
  - Click the first box and type 8 digits; focus auto-advances.
- **Verify:** `getByRole('button', { name: 'Verify' })`
  - disabled until 8 digits are entered
- **Change:** `getByRole('button', { name: 'Change' })`
  - returns to the email step with the email preserved
- **Resend:**
  - shows the span `Resend code (30s)` while the timer runs;
  - after 30 s it becomes `getByRole('button', { name: 'Resend code' })`;
  - a click calls `signup/challenge`, clears the boxes and restarts the timer, with no toast.
- **Error toast:** `getByRole('alert')`
  - auto-dismisses (notification timer)

### Sign in `/login`
- **Email:** `getByRole('textbox', { name: 'Email address' })`
- **Password:** `getByRole('textbox', { name: 'Password' })`
- **Show/hide:** `getByRole('button', { name: 'Show password' })`, which becomes "Hide password"
- **Sign in:** `getByRole('button', { name: 'Sign in' })`
  - disabled until both fields are filled
- **Forgot password?:** `getByRole('button', { name: 'Forgot password?' })`
  - navigates to `/forgot-password`
- **Create one:** `getByRole('link', { name: 'Create one' })`
  - navigates to `/create-profile`

### Forgot password `/forgot-password`
- **Heading:** `getByRole('heading', { name: 'Reset your password' })`
- **Email:** `getByRole('textbox', { name: 'Enter your email address' })`
- **Send:** `getByRole('button', { name: 'Send verification code' })`
- **Back:** `getByRole('button', { name: 'Sign in' })`
  - navigates to `/login`

### Profile form `/sign-up`
- **Text fields (role textbox):**
  - Required: First Name, Last Name, Street 1, City, State, Zip Code, Mobile Phone Number, Create password, Confirm password.
  - Optional: Middle Name, Suffix, Street 2.
  - County: disabled until an address is selected.
  - Email: `exact: true`; disabled and prefilled.
- **Password toggles:**
  - `getByRole('button', { name: 'Show password', exact: true })`, which becomes "Hide password"
  - `getByRole('button', { name: 'Show confirm password' })`, which becomes "Hide confirm password"
- **Consent checkboxes** have no accessible name, so locate them by id:
  - `#ConsentToDoBusinessElectronically-checkbox` (required)
  - `#TermsOfUse-checkbox` (required)
  - `#OptInForTextMessaging-checkbox` (required)
  - `#MarketingMessaging-checkbox` (optional)
- **Continue:** `getByRole('button', { name: 'Continue' })`
- **Street 1 autocomplete (Google Places):**
  - Suggestions: `locator('li[id="address-suggestion-item"]')` in `[data-testid="suggestions_list"]`. They have no listbox/option roles.
  - "Alabama" returned 5 suggestions. The last one, "Alabama State University, Montgomery, AL", autofills City, State, Zip and County.
- **Errors:** `[data-testid="error_text"]`, shown on blur.

### SMS (MFA) step `/sign-up`
- **Code input:** 6 OTP boxes.
  - The first is `getByRole('textbox', { name: 'Enter Verification Code below:' })`.
- **Submit:** `getByRole('button', { name: 'Complete Profile' })`
  - The brief calls this "Complete verification".
- **Resend:** the span `getByText('Resend code')`
- **Back:** the unnamed icon button `#go-back-button`

## Observed messages

| Trigger | Message |
|---|---|
| Malformed email on create profile (`abc`, `abc@`, `a@b`, `a b@c.com`) | "Invalid email" (inline, on blur); Send stays disabled |
| Wrong 8-digit email code | Toast: "Code is invalid. Please check the verification code and re-enter or click Resend Code." |
| Sign in with unknown account | Toast "Invalid email or password." (no enumeration; good) |
| Forgot password with unknown email | Toast "We couldn't find an account with this email address." (enumeration; F-09) |
| Empty required profile field (blur) | "Required field" |
| Password failing policy | "Password does not meet requirements." Live checklist: at least 8 characters, an uppercase letter, a lowercase letter, a number |
| Confirm password mismatch | "Passwords do not match." |
| Phone `123` | "Enter a valid 10-digit phone number." |
| Wrong 6-digit SMS code | Toast: "Code is invalid. Please check the code and re-enter, or click Resend code." |

Continue is enabled only when all of these hold:
- every required field is valid;
- an address suggestion was selected;
- password and confirm are valid and match;
- the 3 required consents are checked.

## Defects and findings

| ID | Severity | Type | Finding |
|---|---|---|---|
| F-01 | Blocker (test env) | Third party | Cloudflare Turnstile on the yopmail inbox blocks automated email-code retrieval. |
| F-02 | Blocker (test env) | Third party | Cloudflare challenge on receive-smss blocks automated SMS-code retrieval. |
| F-03 | Medium | Accessibility | 7 of the 8 email OTP boxes have no accessible name. |
| F-04 | Low | Accessibility | "Invalid email" is not announced: no role=alert and no aria-describedby. |
| F-05 | Low | UX/Accessibility | Error toasts auto-dismiss, so users have limited time to read them. |
| F-06 | Low | Testability | "Forgot password?" is a button, not a link. The show/hide toggle makes `getByLabel('Password')` ambiguous. |
| F-07 | Low | UX | The email step gives no early signal that an account exists. Not verified end to end because of B1. |
| F-09 | Medium | Security | Forgot password reveals whether an account exists, which allows account enumeration. |
| F-10 | Low | Validation | Forgot password has no client-side email validation. "bad" enables Send and still makes a network call. |
| F-11 | Low | Validation | Phone `0000000000` is accepted; only the length is validated. |
| F-12 | Low | UX | Street 1, City and State show no error. Continue stays disabled with no explanation until a Google suggestion is chosen. |
| F-13 | Medium | Accessibility | Consent checkboxes have no accessible name. Address suggestions have no listbox/option roles and duplicate ids. 5 of the 6 SMS OTP boxes and the Back icon button are unnamed. "Resend code" and "Contact support" are spans, not buttons or links. |
| F-14 | Info | Consistency | The code length is 8 on the email step and 6 on the SMS step. |
| F-15 | Info | Security | The Google Maps browser key is visible in requests. Confirm it is restricted by referrer. |
| F-16 | Info | UX | "View terms" and "Privacy Policy" open new tabs. Some "View terms" elements are spans, not links. |

## Mock recipe (form-level tests; no account is created)

All tests mock under `**/ciam-native-auth/**`. Register a catch-all abort first, because the last route registered wins.

| Call | Response |
|---|---|
| signup/start | 200 `{continuation_token}` |
| signup/challenge, 1st call | 200 `{challenge_type:'oob', challenge_channel:'email', code_length:8, interval:300, continuation_token}` |
| signup/challenge, 2nd call | 200 `{challenge_type:'password', continuation_token}` |
| signup/continue (`grant_type=oob`) | 400 `{error:'credential_required', error_codes:[55103], continuation_token}` |
| signup/continue (`grant_type=password`) | 200 `{continuation_token}` |
| oauth2/v2.0/token | 400 `{error:'invalid_grant', suberror:'registration_required', error_codes:[500222], continuation_token}` |
| register/introspect | 200 `{continuation_token, methods:[{id:'sms', challenge_type:'oob', challenge_channel:'sms', login_hint:'mock'}]}` |
| register/challenge | 200 `{challenge_type:'oob', challenge_channel:'sms', code_length:6, continuation_token, ...}` |
| register/continue, wrong code | 400 `{error:'invalid_grant', suberror:'invalid_oob_value', continuation_token}` |

Google Places requests go to the real network. They are read-only.

## Not covered (needs unblocking)
- A real end-to-end registration and the `/apply-for-a-loan` landing.
- Real email and SMS timings.
- The duplicate-email response.
- Phone uniqueness.
- The reset-password code step (needs an existing account).
- The SMS resend click.

## Additions from automation and healing (2026-11-09)

| ID | Severity | Type | Finding |
|---|---|---|---|
| F-17 | Low | Accessibility/Keyboard | On the SMS (MFA) step, pressing Enter with all 6 digits entered does nothing: no request and no toast. Clicking "Complete Profile" in the same state submits. Enter does submit the email and email-code steps (AC-35). Test: `tests/customer/customer.a11y.spec.ts` TC-C-21. |
| F-09 (re-confirmed) | Medium | Security | Re-verified during healing. `resetpassword/v1.0/start` returns 400 `user_not_found`, and the UI shows "We couldn't find an account with this email address." The first automated check was a false pass: an absence assertion retried until the auto-dismissing toast (F-05) disappeared. The test now waits for the server response first. |
