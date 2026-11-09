# Acceptance Criteria: Customer Sign in

App: Customer app, `CUSTOMER_BASE_URL` (dev: https://alabama-dev-customer.agrinextcloud.ai/). Separate from the Lender app.
Status: DRAFT. Story/brief plus exploratory findings of 2026-11-09. The sign-in MFA screen has NOT been observed.
Legend: **[B]** = stated in the story/brief, **[O]** = observed live today (exploratory), **[I]** = inferred / assumed, **[TBC]** = to be confirmed.
Secrets: `CUSTOMER_EMAIL`, `CUSTOMER_PASSWORD`, `SMS_INBOX_URL`, `CUSTOMER_BASE_URL` live in `.env`. No value appears in this document.
Related: `docs/ACCEPTANCE-CRITERIA-Create-Customer-Profile.md`, `docs/EXPLORATORY-FINDINGS-Create-Customer-Profile.md` (defects F-xx and blockers B1/B2 are referenced, not re-raised).

---

## 0. PRECONDITION (read first)

| # | Precondition | Status today |
|---|---|---|
| P1 | The account behind `CUSTOMER_EMAIL` exists and its password equals `CUSTOMER_PASSWORD`. | **NOT MET [O]**. A sign-in attempt returned `user_not_found`. The account is not registered. |
| P2 | That account is MFA-registered to the shared public SMS number (the number in `SMS_INBOX_URL`, i.e. `CUSTOMER_PHONE`), so the sign-in code lands in the inbox at `SMS_INBOX_URL`. | **NOT MET [O]**. Follows from P1. |
| P3 | `SMS_INBOX_URL` (receive-smss.com) is reachable by automation. | **BLOCKED [O]**. Cloudflare managed challenge (B2 / F-02). Automation must stop and report "BLOCKED"; it must never bypass the challenge. |
| P4 | Creating the account (the way to satisfy P1/P2) is itself blocked: yopmail Turnstile (B1 / F-01) and B2. | **BLOCKED [O]** |

Consequences:
- AC-01, AC-14 to AC-19 (the happy path and every MFA step needing a real code) cannot be executed until P1 to P3 are met.
- Credential-negative, navigation, validation, Show/Hide, UI and accessibility ACs on `/login` and `/forgot-password` need no account and are executable now.
- **Manual fallback**: a human (a) creates or restores the account and registers the shared number, (b) opens `SMS_INBOX_URL` in a normal browser, passes the challenge, clicks "update message" until a message from "Alabama Ag Credit" newer than the request time appears, and (c) types the code into the app. The tester records the code timestamp and result. No automated bypass.
- Lockout: wrong-password attempts against a real account must be limited (threshold unknown, Q-07). Negative tests should use an unregistered email where the check does not need a real account.

---

## 1. User story

As a **registered customer** of Alabama Ag Credit, I want to **sign in with my email and password and verify my identity with an SMS code**, so that I can **continue to apply for a loan** at `/apply-for-a-loan`. [B]

Story steps [B]: (1) open `CUSTOMER_BASE_URL`, sign in with `CUSTOMER_EMAIL` / `CUSTOMER_PASSWORD`; (2) open `SMS_INBOX_URL` in a new tab, click "update message" until the "Alabama Ag Credit" message appears, copy the code into the verification-code section, click "verify code"; (3) the app navigates to `/apply-for-a-loan`.

## 2. Requirements

| ID | Requirement | Basis |
|---|---|---|
| REQ-01 | The landing page `/` offers "Sign in" and "Create profile" buttons; "Sign in" opens the sign-in form at `/login`. | [B] brief, [O] route and buttons |
| REQ-02 | The sign-in form has "Email address" and "Password" textboxes and a "Sign in" button. "Sign in" is disabled until both fields are filled. | [O] |
| REQ-03 | Credentials are validated by the identity provider (Entra External ID native auth). Invalid credentials show a generic, non-enumerating error ("Invalid email or password.") and keep the user on `/login`. | [O] message; unknown-account case only |
| REQ-04 | After valid credentials, an SMS MFA step asks for a verification code sent by "Alabama Ag Credit" to the registered phone. Code length is 6 digits. | [B] step; [O] 6 digits on sign-up only; sign-in screen [TBC] |
| REQ-05 | Entering the correct code and clicking "verify code" navigates to `/apply-for-a-loan`. | [B] |
| REQ-06 | A wrong, empty, expired or already-used code is rejected with a message; the user stays on the MFA step and is not signed in. | [I]; messages [TBC] |
| REQ-07 | A "Resend code" control requests a new code. Timer, label and invalidation of the old code are [TBC]. | [B] brief; [O] sign-up has span with 30 s timer; sign-in [TBC] |
| REQ-08 | "Forgot password?" navigates to `/forgot-password` (heading "Reset your password"), which has "Enter your email address", "Send verification code", and "Sign in" back to `/login`. | [O] |
| REQ-09 | The link "Create one" navigates to `/create-profile`. | [O] |
| REQ-10 | The password field is masked by default. The "Show password" button reveals it and becomes "Hide password"; toggling back masks it again. | [B], [O] labels |
| REQ-11 | The UI is consistent and readable: labels, placeholders, error and disabled states, responsive layout. | [B]; details [TBC] |
| REQ-12 | The sign-in flow is usable by keyboard and assistive technology: accessible names, focus order, Enter to submit, errors announced. | [B]; see F-05, F-06, F-13, F-17 |
| REQ-13 | Security: password and code are masked and never appear in the URL, logs or storage visible to the user; all traffic is HTTPS; error messages do not enumerate accounts. | [I]; HTTPS [O] |
| REQ-14 | Repeated failed attempts are throttled or lock the account (threshold, duration and message unknown). | [I]; [TBC] |
| REQ-15 | Third-party dependency handling: the SMS inbox (receive-smss.com) is shared, public and behind Cloudflare. Only a message newer than the code request time is used; if the inbox cannot be reached the run stops and reports "BLOCKED". | [B] shared inbox, [O] B2 |
| REQ-16 | Session behaviour: already-signed-in visit to `/login`, refresh or Back on the MFA step, session timeout, multiple tabs, sign-out. | [TBC] |

## 3. Business rules

| ID | Rule | Valid example | Invalid example | REQ | Basis |
|---|---|---|---|---|---|
| BR-01 | "Sign in" is enabled only when Email address and Password are both non-empty. | both filled: enabled | either empty: disabled | REQ-02 | [O]; whitespace-only handling [TBC] |
| BR-02 | Failed credential check shows one generic message regardless of whether the account exists. | unknown email: "Invalid email or password." | message that says "account not found" | REQ-03, REQ-13 | [O] |
| BR-03 | Correct credentials for an MFA-enabled account always lead to the SMS code step before access is granted. | valid creds then code step | direct access to `/apply-for-a-loan` without code | REQ-04, REQ-05 | [B], [I] |
| BR-04 | MFA code is 6 digits. | 6 digits | 5 or 7 digits, letters | REQ-04, REQ-06 | [O] sign-up; sign-in [TBC] |
| BR-05 | Only the code from the newest "Alabama Ag Credit" message received after the request (or Resend) time is accepted by the test. | newer message | older message, other sender, other user's message on the shared number | REQ-15, REQ-07 | [B], [I] |
| BR-06 | A correct code leads to `/apply-for-a-loan`; no other destination. | path `/apply-for-a-loan` | stays on MFA, or goes to `/login` | REQ-05 | [B] |
| BR-07 | A wrong or expired code does not authenticate; the user remains on the MFA step. Code validity period and attempt limit unknown. | n/a | expired code accepted | REQ-06 | [I]; [TBC] |
| BR-08 | "Forgot password?" goes to `/forgot-password`; "Create one" goes to `/create-profile`; no data is submitted by navigating. | click then route | form submitted on click | REQ-08, REQ-09 | [O] |
| BR-09 | Password is masked unless "Show password" is active; toggle label alternates "Show password" / "Hide password". | masked at load | visible at load | REQ-10, REQ-13 | [O] |
| BR-10 | Password policy (>= 8 chars, upper, lower, number) applies on sign-up. Whether sign-in validates it client-side is unknown. | n/a | n/a | REQ-02, REQ-03 | [O] sign-up; sign-in [TBC] |
| BR-11 | Failed-attempt limit exists at the identity provider; automation must keep wrong-password attempts against a real account to a minimum. | 1 to 2 attempts | loops of wrong attempts | REQ-14 | [I]; threshold [TBC] |
| BR-12 | If the SMS inbox shows a security challenge, the run stops with "BLOCKED"; no bypass. | report BLOCKED | solve or evade challenge | REQ-15 | [B] policy, [O] B2 |

Precedence: BR-02 over any field-level hint (a credential error never reveals which field is wrong). BR-03 over BR-06 (the code step is mandatory before the redirect). BR-12 over BR-05 (if the inbox cannot be read, no code is used at all). Precedence between BR-11 (lockout) and BR-02 (generic message) is not stated: Q-07.

## 4. Acceptance criteria (Given / When / Then)

### 4.1 Functional happy path (requires preconditions P1 to P3)

**AC-01** (REQ-01) Given I am on `/`, When I click "Sign in", Then the browser navigates to `/login` and the form with "Email address", "Password" and "Sign in" is shown. [executable now]

**AC-02** (REQ-02, REQ-03, REQ-04, BR-03) Given the account behind `CUSTOMER_EMAIL` exists and is MFA-registered, When I enter `CUSTOMER_EMAIL` and `CUSTOMER_PASSWORD` and click "Sign in", Then the verification-code step is shown and a code is sent by SMS. [BLOCKED by P1/P2]

**AC-03** (REQ-04, REQ-15, BR-05) Given the code step is shown and I recorded the request time, When I open `SMS_INBOX_URL` in a new tab and click "update message" until an "Alabama Ag Credit" message newer than the request time appears, Then I can read a 6-digit code from that message. [BLOCKED by P3; manual fallback]

**AC-04** (REQ-05, BR-06) Given I have the code from AC-03, When I enter it in the verification-code section and click "verify code", Then the browser navigates to a URL whose path is `/apply-for-a-loan`. [BLOCKED by P1 to P3]

### 4.2 Credentials negative

**AC-05** (REQ-03, BR-02) Given I am on `/login`, When I enter an unregistered email and any password and click "Sign in", Then the toast "Invalid email or password." appears and I stay on `/login`. [executable now, [O]]

**AC-06** (REQ-03, BR-02) Given a registered email, When I enter a wrong password and click "Sign in", Then the same message "Invalid email or password." appears (identical to AC-05), no code step is shown, and I stay on `/login`. [TBC; limit attempts, BR-11]

**AC-07** (REQ-03, REQ-13) Given AC-05 and AC-06 were run, When I compare the visible message, status and timing class, Then nothing distinguishes an unknown email from a wrong password. [TBC]

**AC-08** (REQ-03, REQ-06) Given an error toast is shown, When the toast auto-dismisses, Then the form keeps the email value and remains usable (see F-05 for dismissal-time defect). [TBC]

### 4.3 MFA code step

**AC-09** (REQ-06) Given the code step is shown, When I click "verify code" with an empty code, Then an error or disabled state prevents submission and I remain on the step. [TBC; screen unobserved]

**AC-10** (REQ-06, BR-04, BR-07) Given the code step, When I enter an incorrect 6-digit code and click "verify code", Then an error message is shown, I remain on the step and am not signed in. [BLOCKED by P1/P2]

**AC-11** (REQ-06, BR-04) Given the code step, When I enter non-digits or fewer than 6 digits, Then the code is rejected or the control stays disabled; message [TBC]. [BLOCKED by P1/P2]

**AC-12** (REQ-06, BR-07) Given a code older than its validity period (period [TBC], Q-05), When I submit it, Then it is rejected and I remain on the step. [BLOCKED]

**AC-13** (REQ-06, BR-05) Given I clicked Resend and received a second code, When I submit the first (older) code, Then behaviour matches the rule in Q-06 (rejected, or both accepted). [BLOCKED; rule TBC]

**AC-14** (REQ-04, REQ-12) Given the code step, When I look at the screen, Then the code inputs, "verify code" and Resend each have an accessible name and the screen states the code was sent by SMS (masking of phone [TBC]). [BLOCKED; relates to F-13]

### 4.4 Navigation (Forgot password, Create one, Resend)

**AC-15** (REQ-08, BR-08) Given I am on `/login`, When I click "Forgot password?", Then the browser navigates to `/forgot-password` showing heading "Reset your password", "Enter your email address", "Send verification code" and "Sign in". No request is sent. [executable now; control is a button, F-06]

**AC-16** (REQ-08) Given I am on `/forgot-password`, When I click "Sign in", Then I return to `/login` with empty fields. [executable now]

**AC-17** (REQ-09, BR-08) Given I am on `/login`, When I click "Create one", Then the browser navigates to `/create-profile`. [executable now]

**AC-18** (REQ-07) Given the code step is shown, When I click "Resend code" (control name and any timer [TBC]), Then a confirmation is shown, a new SMS is requested, and only a message newer than the resend time is used by the test. [BLOCKED by P1/P2/P3]

**AC-19** (REQ-07) Given Resend has a countdown (30 s on sign-up email step [O]; sign-in [TBC]), When I click it before it ends, Then it is disabled or ignored; after it ends it is enabled. [BLOCKED; timer TBC]

**AC-20** (REQ-08) Given I am on `/forgot-password`, When I enter an unknown email and click "Send verification code", Then I see "We couldn't find an account with this email address." (existing defect F-09; no email format validation, F-10). [executable now; recorded, not re-raised]

### 4.5 Validation and mandatory fields

**AC-21** (REQ-02, BR-01) Given `/login` is freshly loaded, When no field is filled, Then "Sign in" is disabled. [executable now]

**AC-22** (REQ-02, BR-01) Given `/login`, When only Email address is filled, Then "Sign in" stays disabled; When only Password is filled, Then "Sign in" stays disabled. [executable now]

**AC-23** (REQ-02, BR-01) Given `/login`, When both fields are filled, Then "Sign in" becomes enabled; When one is cleared again, Then it becomes disabled again. [executable now]

**AC-24** (REQ-02, BR-01) Given `/login`, When a field contains only spaces, Then behaviour is recorded (enabled or disabled) and no crash occurs. [TBC, Q-09]

**AC-25** (REQ-02, REQ-03, BR-10) Given `/login`, When I enter a malformed email (`notanemail`, `user@`, `@domain.com`, `a b@c.com`) with any password and click "Sign in", Then either a client validation message is shown or the generic "Invalid email or password." appears; no code step is shown. [TBC, Q-08]

**AC-26** (REQ-02, BR-10) Given `/login`, When I enter a password that breaks the sign-up policy (for example fewer than 8 characters) for a non-existent email, Then the outcome (client message or generic error) is recorded. [TBC, Q-10]

### 4.6 Show / Hide password

**AC-27** (REQ-10, BR-09) Given `/login`, When it loads, Then the Password field is masked (type password) and the toggle is named "Show password". [executable now]

**AC-28** (REQ-10, BR-09) Given text is typed in Password, When I click "Show password", Then the text is visible and the button is named "Hide password". [executable now]

**AC-29** (REQ-10) Given the password is visible, When I click "Hide password", Then it is masked again and the typed value is unchanged. [executable now]

**AC-30** (REQ-10, REQ-12) Given the toggle is focused, When I press Space or Enter, Then it toggles like a click, and focus stays on the toggle. [executable now]

### 4.7 UI

**AC-31** (REQ-11) Given `/login`, When it loads at desktop (1280 px) and mobile (375 px) widths, Then all controls (email, password, Show password, Sign in, Forgot password?, Create one) are visible without horizontal scroll and nothing overlaps. [executable now]

**AC-32** (REQ-11) Given `/login`, When fields are empty, filled and in error, Then the disabled, enabled and error styles are visually distinct, and the page title and labels contain no spelling errors or placeholder text. [executable now; subjective checks logged as observations]

### 4.8 Accessibility

**AC-33** (REQ-12) Given `/login`, When I navigate by Tab only, Then focus order is email, password, Show password, Sign in (when enabled), Forgot password?, Create one; every focus is visible. [executable now]

**AC-34** (REQ-12, REQ-02) Given both fields are filled, When I press Enter in the Password field, Then the form submits as if "Sign in" was clicked. [executable now; compare F-17 on the SMS step]

**AC-35** (REQ-12) Given the sign-in fails, When the error toast appears, Then it is exposed as `role=alert` and announced [O role=alert]; its auto-dismissal (F-05) is recorded as the known defect. [executable now]

**AC-36** (REQ-12) Given `/login`, When scanned with an automated accessibility check (axe), Then there are no critical violations other than the already-known ones (F-06 button instead of link; F-13 unnamed OTP boxes on the code step). [executable now]

**AC-37** (REQ-12) Given `/login`, When I inspect inputs, Then Email address and Password each have an accessible name and the email input has an appropriate `autocomplete` value [TBC, Q-11]. [executable now]

### 4.9 Security

**AC-38** (REQ-13, BR-09) Given I submit credentials, When I inspect the URL, history, and requests, Then neither password nor code appears in the URL or query string, and all requests use HTTPS. [executable now with unknown account; full for real account]

**AC-39** (REQ-13) Given `/login`, When I view the DOM, Then the password input has type password unless "Show password" is active, and the typed value is not echoed anywhere else (toast, title). [executable now]

**AC-40** (REQ-13, BR-03) Given I am not signed in, When I open `/apply-for-a-loan` directly, Then I am redirected to sign-in (or denied); the page is not shown. [TBC, Q-12]

**AC-41** (REQ-14, BR-11) Given a real account, When wrong passwords are submitted repeatedly up to a small agreed number of attempts, Then the lockout or throttle message and threshold are recorded and the correct password behaviour after lock is confirmed. [TBC; do not run until Q-07 is answered]

**AC-42** (REQ-13, REQ-03) Given `/login`, When I enter injection-like input (`' OR 1=1 --`, `<script>alert(1)</script>`) in both fields, Then the app shows the generic error, no script runs and no stack trace is shown. [executable now]

### 4.10 Third-party dependencies

**AC-43** (REQ-15, BR-12) Given `SMS_INBOX_URL` shows a Cloudflare challenge ("Just a moment..."), When automation opens it, Then the run stops, reports "BLOCKED: SMS inbox behind Cloudflare challenge (B2)", takes no bypass action, and marks dependent tests as blocked, not failed. [executable now]

**AC-44** (REQ-15, BR-05) Given the shared number shows messages from other senders or older "Alabama Ag Credit" messages, When selecting a code, Then only the newest "Alabama Ag Credit" message with a timestamp after the request time is used; otherwise polling continues until a stated timeout (timeout [TBC], Q-13) and then reports "no message". [BLOCKED by P3]

**AC-45** (REQ-15, REQ-16) Given the identity provider is slow or returns an error (5xx, timeout), When I click "Sign in" or "verify code", Then the user sees an error message, controls become usable again, and no duplicate request is made. [TBC; needs request interception]

### 4.11 Session behaviour

**AC-46** (REQ-16) Given I am already signed in, When I open `/login`, Then behaviour (redirect to `/apply-for-a-loan` or show form) is recorded. [TBC, Q-14]

**AC-47** (REQ-16) Given I am on the code step, When I refresh or use the Back button, Then behaviour (stay, return to `/login`, or error) is recorded and the user is never signed in without a valid code. [TBC, Q-15]

## 5. Edge cases

| ID | Edge case | Category | Covered by | Notes |
|---|---|---|---|---|
| EDGE-01 | Email in upper or mixed case, e.g. `CUSTOMER_EMAIL` uppercased | Boundary/locale | none | Is sign-in case-insensitive? Q-08 |
| EDGE-02 | Email with leading or trailing whitespace | Boundary | AC-24 partly | Trimmed or rejected? |
| EDGE-03 | Email at max length (255 on create-profile; `/login` [TBC]) and 256 | Boundary | none | Q-08 |
| EDGE-04 | Paste into email and password fields | Input | none | Paste allowed? Trailing newline? |
| EDGE-05 | Password with leading/trailing spaces or inner spaces | Boundary | none | Trimmed? |
| EDGE-06 | Password with unicode or emoji, very long password (1000 chars) | Boundary | none | Must give generic error, not 500 |
| EDGE-07 | Double click on "Sign in" | Concurrency | AC-45 partly | Must send one request, not two codes |
| EDGE-08 | Double click on "verify code" | Concurrency | none | One verification |
| EDGE-09 | Code with leading/trailing spaces or pasted as "123 456" | Boundary | AC-11 partly | Accept or reject? |
| EDGE-10 | Paste full 6-digit code into first OTP box | Input | none | Does it spread across boxes? (F-13 six boxes on sign-up) |
| EDGE-11 | Expired code | State | AC-12 | Validity period unknown, Q-05 |
| EDGE-12 | Code from an earlier Resend | State | AC-13 | Q-06 |
| EDGE-13 | SMS inbox shows messages from other senders or other runs | Integration | AC-44 | Shared number |
| EDGE-14 | Two parallel runs against the same number | Concurrency | none | Codes collide; serialise runs |
| EDGE-15 | Refresh on the code step | State | AC-47 | Q-15 |
| EDGE-16 | Back button on code step, then Forward | State | AC-47 | |
| EDGE-17 | Session or sign-in timeout while polling the inbox | State | none | Code step may expire before code is read |
| EDGE-18 | Multiple tabs: sign in in tab 1, open `/login` in tab 2 | Concurrency | AC-46 partly | |
| EDGE-19 | Caps Lock on while typing the password | Input | none | Warning shown? |
| EDGE-20 | Browser autofill / password manager fills both fields | Input | AC-37 partly | Is "Sign in" enabled after autofill? |
| EDGE-21 | Enter key in Email field with empty password | Data | none | Must not submit |
| EDGE-22 | Network offline or timeout on Sign in | Integration | AC-45 | |
| EDGE-23 | Duplicate SMS callbacks or two SMS for one request | Integration | none | Which code is valid? |
| EDGE-24 | Inbox "update message" never shows a message (delivery failure) | Integration | AC-44 | Timeout rule |
| EDGE-25 | Unregistered or unverified phone, or account with no MFA | Data | none | Q-04 |
| EDGE-26 | Non-Latin or RTL text in email and password | Locale | none | |
| EDGE-27 | Browser zoom 200 percent and small viewport | UI | AC-31 partly | |
| EDGE-28 | Rate limit: many rapid failed attempts with unknown email | Access | AC-41 partly | Q-07 |

Not covered by any AC: EDGE-01, 03, 04, 05, 06, 08, 10, 14, 17, 19, 21, 23, 25, 26, 28 (28 only by AC-41, deferred). Recommended to add AC after Q-08, Q-07 and Q-05 are answered.

## 6. Testability score

| Area | Score /10 | Rationale |
|---|---|---|
| Sign-in form and enable rule | 9 | Fully observed, stable locators |
| Credentials negative | 7 | Unknown-account message observed; wrong-password case needs a real account and lockout is unknown |
| MFA code entry and verify | 2 | Screen unobserved, labels, timer and messages TBC, and blocked by P1 to P3 |
| Navigation (Forgot password, Create one) | 9 | Observed. Resend sub-case is 2 (unobserved) |
| Validation | 6 | Enable rule clear; client validation for email and password at sign-in is TBC |
| Show/Hide | 10 | Observed labels and states |
| UI | 6 | Observable, but no design reference to compare against |
| Accessibility | 7 | Observable; known defects F-05, F-06, F-13, F-17 |
| Security | 5 | Masking, HTTPS observable; lockout, throttling and session rules unknown |
| Third-party dependencies | 3 | B2 blocks the inbox; behaviour only describable |
| Session behaviour | 2 | Entirely TBC |

Overall: **5 / 10** (about 50 / 100). Rationale: the pre-login screens are very testable, but the story's core outcome (sign in, code, redirect) cannot be demonstrated: the account does not exist (user_not_found) and the SMS inbox is behind Cloudflare. The happy path alone scores **1 / 10** until P1 to P3 are met.
Requirements clarity (REQ with no open question / all REQ): REQ-01, 02, 08, 09, 10 = 5 of 16 = **31 %**. This is below the 70 % threshold; AC for the TBC areas are therefore skeletons and are flagged [TBC] and BLOCKED; they must be finalised after the questions below are answered.

## 7. Implicit rules (with reasoning)

| # | Rule | Reasoning |
|---|---|---|
| I-1 | Code step cannot be skipped. | Story places the code step between sign in and redirect; Entra MFA observed on sign-up. [I] |
| I-2 | MFA code is 6 digits on sign-in. | Observed on sign-up, same tenant. [I] |
| I-3 | Auth uses Entra native auth endpoints (`/ciam-native-auth/*`, `/oauth2/v2.0/token`). | Observed in network. Lockout and throttling therefore follow the tenant's policy. [O/I] |
| I-4 | Account must be registered before sign-in. | `user_not_found` observed. [O] |
| I-5 | The shared SMS number carries other parties' messages. | Public number. [B] |

## 8. Ambiguities and open questions

| ID | Question | Linked | Suggested resolution | Owner |
|---|---|---|---|---|
| Q-01 | Who creates or restores the account behind `CUSTOMER_EMAIL` and registers the shared number for MFA (currently `user_not_found`)? | P1, P2, AC-02 to AC-04 | Provide a registered test account or a pre-seeded customer | Product owner / Dev |
| Q-02 | How is the receive-smss Cloudflare challenge handled for automation (B2)? Is a whitelisted inbox, an API or an alternative SMS provider available? | P3, REQ-15, AC-03, AC-43 | Agree an allowed route; until then manual fallback | Dev / DevOps |
| Q-03 | What are the exact labels and states on the sign-in MFA screen (code input, "verify code", Resend, timer)? | REQ-04, REQ-07, AC-09 to AC-19 | Observe once the account exists | QA (after Q-01) |
| Q-04 | What happens for an account without an MFA phone, or with a different phone? | REQ-04, EDGE-25 | Product to confirm | Product owner |
| Q-05 | What is the validity period of the SMS code and the attempt limit? | REQ-06, BR-07, AC-12 | Product / identity tenant configuration | Dev |
| Q-06 | Does Resend invalidate the previous code? | REQ-07, AC-13, EDGE-12 | Product to confirm | Product owner |
| Q-07 | What is the lockout / throttling threshold, duration, and message? May QA test it on a real account? | REQ-14, BR-11, AC-41, EDGE-28 | Provide threshold; use a dedicated lock-test account | Dev / Security |
| Q-08 | Does `/login` validate email format, trim whitespace, treat case, and apply a max length (create-profile uses type=email, maxlength 255)? | REQ-02, REQ-03, AC-25, EDGE-01 to 03 | Observe field attributes and confirm with product | QA / Dev |
| Q-09 | Is a whitespace-only value treated as filled for the "Sign in" enable rule? | BR-01, AC-24 | Observe and confirm | QA / Dev |
| Q-10 | Is the sign-up password policy applied on sign-in? | BR-10, AC-26 | Product to confirm | Product owner |
| Q-11 | Expected `autocomplete` values and password-manager behaviour for sign-in fields? | AC-37, EDGE-20 | Dev to confirm | Dev |
| Q-12 | What happens when an unauthenticated user opens `/apply-for-a-loan` directly? | REQ-13, AC-40 | Redirect to `/login` expected; confirm | Dev |
| Q-13 | What polling timeout is acceptable when waiting for the SMS message? | REQ-15, AC-44 | Agree a number (not set in this document) | QA / Product owner |
| Q-14 | What happens when a signed-in user opens `/login` again? Is there a sign-out control? | REQ-16, AC-46 | Product to confirm | Product owner |
| Q-15 | What do refresh and Back do on the MFA step? | REQ-16, AC-47, EDGE-15, 16 | Observe once the account exists | QA |
| Q-16 | Should the unknown-email message on `/forgot-password` (F-09) be aligned with the non-enumerating sign-in message? | REQ-03, REQ-13, AC-20 | Already raised as F-09; track the decision | Product owner / Security |

## 9. Traceability

| REQ | BR | AC | EDGE |
|---|---|---|---|
| REQ-01 | n/a | AC-01 | none |
| REQ-02 | BR-01, BR-10 | AC-21 to AC-26, AC-34 | EDGE-02, 21 |
| REQ-03 | BR-02, BR-10 | AC-05 to AC-08, AC-25, AC-42 | EDGE-01, 05, 06 |
| REQ-04 | BR-03, BR-04 | AC-02, AC-03, AC-14 | EDGE-25 |
| REQ-05 | BR-03, BR-06 | AC-04 | EDGE-08 |
| REQ-06 | BR-04, BR-07 | AC-09 to AC-13 | EDGE-09, 10, 11, 12 |
| REQ-07 | BR-05 | AC-13, AC-18, AC-19 | EDGE-12, 23 |
| REQ-08 | BR-08 | AC-15, AC-16, AC-20 | none |
| REQ-09 | BR-08 | AC-17 | none |
| REQ-10 | BR-09 | AC-27 to AC-30 | EDGE-19 |
| REQ-11 | n/a | AC-31, AC-32 | EDGE-27 |
| REQ-12 | n/a | AC-14, AC-30, AC-33 to AC-37 | EDGE-19, 20, 21 |
| REQ-13 | BR-02, BR-09 | AC-07, AC-38 to AC-40, AC-42 | EDGE-04, 06 |
| REQ-14 | BR-11 | AC-41 | EDGE-28 |
| REQ-15 | BR-05, BR-12 | AC-03, AC-43 to AC-45 | EDGE-13, 14, 17, 22, 23, 24 |
| REQ-16 | n/a | AC-45 to AC-47 | EDGE-15, 16, 17, 18 |

Known defects referenced (not re-raised): F-05 (toasts auto-dismiss), F-06 (Forgot password is a button), F-09 (forgot password enumeration), F-10 (no client email validation on forgot password), F-13 (unnamed OTP boxes, Resend is a span), F-17 (Enter does not submit on SMS step). Blockers: B1/F-01 (yopmail Turnstile), B2/F-02 (receive-smss Cloudflare).
