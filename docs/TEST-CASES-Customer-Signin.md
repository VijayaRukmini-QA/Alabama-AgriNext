# Test Cases: Customer Sign in

Source: `docs/ACCEPTANCE-CRITERIA-Customer-Signin.md` (REQ-01..16, BR-01..12, AC-01..47, EDGE-01..28, Q-01..16). Locators and messages: `docs/EXPLORATORY-FINDINGS-Create-Customer-Profile.md`. Style: `docs/TEST-PLAN-Create-Customer-Profile.md`.
App: `CUSTOMER_BASE_URL`. Secrets are referenced by env var name only: `CUSTOMER_EMAIL`, `CUSTOMER_PASSWORD`, `SMS_INBOX_URL`, `CUSTOMER_BASE_URL`. Literals below (`unknown.user@example.test`, `Aa1!wrongPass`) are non-secret test inputs for non-existent accounts.
Every TC carries `@customer @signin`. Priority: P0 blocks release, P1 high, P2 medium, P3 cosmetic or recording only.
Status: automatable = live against `/login` or `/forgot-password`, no real account. mocked = needs `page.route` mocks of Entra native-auth responses. manual = human only. blocked = needs the real account (Q-01) and/or SMS inbox past Cloudflare (Q-02).
Real-account wrong-password budget: at most 1 wrong attempt per day across TC-S-14, TC-S-56 and any manual session, until the lockout threshold (Q-07) is known. TC-S-56 runs only on a dedicated account.

## Summary

Totals: 11 scenarios (TS-S-01..11), 69 test cases (TC-S-01..69), 2 decision tables (DT-S-01, DT-S-02).

| By priority | P0 | P1 | P2 | P3 |
|---|---|---|---|---|
| TCs | 11 | 19 | 29 | 10 |

| By status | automatable | mocked | manual | blocked |
|---|---|---|---|---|
| TCs | 35 | 23 | 7 | 4 |

| By tag | @customer | @signin | @smoke | @regression | @negative | @a11y | @e2e-full | @mobile |
|---|---|---|---|---|---|---|---|---|
| TCs | 69 | 69 | 6 | 65 | 23 | 8 | 2 | 1 |

Main risks: the MFA step is unobserved, so every MFA TC is skeletal (Q-03) and its mock shapes are [TBC]. The account does not exist (Q-01, `user_not_found`). The SMS inbox is behind Cloudflare (Q-02).

## Precondition blocks

| ID | Block |
|---|---|
| PC-1 | Anonymous browser context, fresh storage, page open at `CUSTOMER_BASE_URL` + `/login`. No account needed. |
| PC-2 | PC-1 plus Entra native-auth mocks under `**/ciam-native-auth/**` and `**/oauth2/v2.0/token`. Register the catch-all abort first (last registered route wins). Sign-in endpoint names and response shapes are [TBC, Q-03]; base them on the sign-up recipe (challenge `{challenge_type:'oob', challenge_channel:'sms', code_length:6, continuation_token}`; wrong code `400 {error:'invalid_grant', suberror:'invalid_oob_value', continuation_token}`). Mock variant "valid credentials" makes the app reach the code step. |
| PC-3 | Real account behind `CUSTOMER_EMAIL` exists, password equals `CUSTOMER_PASSWORD`, MFA-registered to the shared number (P1, P2; Q-01). `SMS_INBOX_URL` reachable (P3; Q-02). Runs serialised, never in parallel on the shared number (EDGE-14). |
| PC-4 | PC-3 plus an already signed-in session. |
| PC-5 | PC-2 plus: mocked Entra native-auth sign-in responses that bring an unknown synthetic user to the SMS code step [mock shapes TBC Q-03]. Setup steps: type `registered.mock@example.test` in "Email address", type `Aa1!mockPass` in "Password", click "Sign in", wait for the code step. No real account, no SMS. |

## Scenarios

| ID | Scenario | TCs |
|---|---|---|
| TS-S-01 | Open sign in and the Sign in enable rule | TC-S-01..07 |
| TS-S-02 | Credential errors and input robustness | TC-S-08..15 |
| TS-S-03 | Navigation: Forgot password, Create one | TC-S-16..19 |
| TS-S-04 | Password Show/Hide | TC-S-20..23 |
| TS-S-05 | UI and responsive | TC-S-24..26 |
| TS-S-06 | Accessibility | TC-S-27..32 |
| TS-S-07 | Security | TC-S-33..36, 67, 69 |
| TS-S-08 | Third-party SMS inbox and identity-provider errors | TC-S-37..41, 66 |
| TS-S-09 | MFA code step and Resend | TC-S-42..54, 68 |
| TS-S-10 | Lockout and session | TC-S-55..59 |
| TS-S-11 | End-to-end and exploratory charters | TC-S-60..65 |

## Test cases

The test design technique for each TC is given as a bracketed prefix in its Title, e.g. `[BVA]`. Techniques: EP (equivalence partitioning), BVA (boundary value analysis), DT (decision table), ST (state transition), EG (error guessing), UC (use case), PW (pairwise).

### TS-S-01 Open sign in and enable rule

| ID | Title | Preconditions | Steps | Test data | Expected result | Pri | Traceability | Tags | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-S-01 | [UC] Sign in button on landing opens the sign-in form | Anonymous, at `CUSTOMER_BASE_URL` + `/` | 1. Click button "Sign in" | none | URL path is `/login`. Textboxes "Email address" and "Password" and button "Sign in" are visible. | P0 | AC-01, REQ-01 | @customer @signin @smoke @regression | automatable |
| TC-S-02 | [EP] Sign in disabled when both fields empty | PC-1 | 1. Observe "Sign in" without typing | email empty, password empty | "Sign in" is disabled. | P0 | AC-21, BR-01, REQ-02 | @customer @signin @smoke @regression | automatable |
| TC-S-03 | [DT] Sign in disabled when only email is filled | PC-1 | 1. Type email 2. Observe "Sign in" | email `unknown.user@example.test`, password empty | "Sign in" stays disabled (DT-S-01 R2). | P1 | AC-22, BR-01 | @customer @signin @regression | automatable |
| TC-S-04 | [DT] Sign in disabled when only password is filled | PC-1 | 1. Type password 2. Observe "Sign in" | email empty, password `Aa1!wrongPass` | "Sign in" stays disabled (DT-S-01 R5). | P1 | AC-22, BR-01 | @customer @signin @regression | automatable |
| TC-S-05 | [DT] Sign in enabled when both filled and disabled again when one is cleared | PC-1 | 1. Type email 2. Type password 3. Observe 4. Clear email 5. Observe 6. Retype email, clear password 7. Observe | `unknown.user@example.test` / `Aa1!wrongPass` | Step 3 enabled (R6). Step 5 disabled. Step 7 disabled. | P1 | AC-23, BR-01 | @customer @signin @regression | automatable |
| TC-S-06 | [BVA] Whitespace-only field and enable rule recorded | PC-1 | 1. Type 3 spaces in email, leave password empty 2. Record state of "Sign in" (R4) 3. Type `Aa1!wrongPass` in password 4. Record state of "Sign in" (R3) 5. Clear both fields, type `unknown.user@example.test` in email and 3 spaces in password 6. Record state of "Sign in" | spaces `"   "`; email `unknown.user@example.test`; password empty, `Aa1!wrongPass` | Step 2: "Sign in" disabled (DT-S-01 R4) [or, if enabled, record per Q-09]. Steps 4 and 6: enabled or disabled state recorded as observation (DT-S-01 R3 [TBC Q-09]). No crash or console error. | P3 | AC-24, BR-01, EDGE-02 | @customer @signin @regression | automatable |
| TC-S-07 | [EG] Enter in email with empty password does not submit | PC-1; capture network | 1. Type email 2. Press Enter in email field | email `unknown.user@example.test`, password empty | No request to `ciam-native-auth`, no toast, URL stays `/login`. | P2 | EDGE-21, REQ-02, BR-01 | @customer @signin @regression @negative | automatable |

### TS-S-02 Credential errors and input robustness

| ID | Title | Preconditions | Steps | Test data | Expected result | Pri | Traceability | Tags | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-S-08 | [EP] Unknown email shows generic error and stays on login | PC-1 | 1. Type email 2. Type password 3. Click "Sign in" 4. Wait for the response of the token or start call | `unknown.user@example.test` / `Aa1!wrongPass` | Alert toast text "Invalid email or password." URL stays `/login`. No code step. Wait for server response before asserting (toast auto-dismisses, F-05). | P0 | AC-05, BR-02, REQ-03 | @customer @signin @smoke @regression @negative | automatable |
| TC-S-09 | [EP] Malformed emails are rejected or get the generic error | PC-1 | For each value: 1. Type email 2. Type password 3. Click "Sign in" | `notanemail`, `user@`, `@domain.com`, `a b@c.com`; password `Aa1!wrongPass` | Either a client validation message or "Invalid email or password." No code step, URL `/login`. Which one is recorded [TBC Q-08]. | P2 | AC-25, BR-10, REQ-03 | @customer @signin @regression @negative | automatable |
| TC-S-10 | [BVA] Password below sign-up policy for unknown email | PC-1 | 1. Type email 2. Type 7-char password 3. Click "Sign in" | `unknown.user@example.test` / `Ab1!xyz` (7 chars) | Outcome recorded: client message or generic error; no crash [TBC Q-10]. No code step. | P3 | AC-26, BR-10 | @customer @signin @regression @negative | automatable |
| TC-S-11 | [ST] Form keeps email and stays usable after the error toast dismisses | PC-1 | 1. Submit unknown-email credentials 2. Wait for toast to disappear 3. Read Email field 4. Edit password | `unknown.user@example.test` / `Aa1!wrongPass` | Email field still holds the value. "Sign in" is enabled and a second submit works. Auto-dismiss itself is known defect F-05. | P2 | AC-08, REQ-03 | @customer @signin @regression | automatable |
| TC-S-12 | [BVA] Very long and unicode passwords give generic error, no server error | PC-1 | For each value: 1. Type email 2. Paste password 3. Click "Sign in" | password: 1000 x `a`; `Pässwörd😀1!`; `пароль1!` (non-Latin); email `unknown.user@example.test` | Generic "Invalid email or password." or a validation message. No 500 page, no stack trace, no crash. | P2 | EDGE-06, EDGE-26, REQ-03 | @customer @signin @regression @negative | automatable |
| TC-S-13 | [EP] Wrong password for registered email shows generic error (mocked) | PC-2, variant: start/challenge succeeds, token returns invalid credentials [shape TBC Q-03] | 1. Type email 2. Type password 3. Click "Sign in" | `registered.mock@example.test` / `Aa1!wrongPass` | Toast "Invalid email or password." URL `/login`. No code step. Text equals TC-S-08. | P1 | AC-06, BR-02 | @customer @signin @regression @negative | mocked |
| TC-S-14 | [EP] Wrong password against the REAL account (max 1 attempt per run) | PC-3. Blocked until the account exists (Q-01). Uses the whole daily real-account wrong-password budget (see note above); prefer the live unknown-email and mocked wrong-password cases. | 1. Type `CUSTOMER_EMAIL` 2. Type a wrong literal password 3. Click "Sign in" once 4. Do not retry | email `CUSTOMER_EMAIL`, password `Aa1!wrongPass` | "Invalid email or password." URL `/login`, no code step. Exactly 1 attempt, never looped (BR-11). | P1 | AC-06, BR-02, BR-11 | @customer @signin @regression @negative | blocked |
| TC-S-15 | [EP] Unknown email and wrong password are indistinguishable | PC-1 for the live unknown-email submit; PC-2 for the mocked submit, variant: start/challenge succeeds, token returns invalid credentials [shape TBC Q-03] | 1. Submit unknown email, record toast text, role, URL 2. Submit mocked wrong password, record same 3. Compare | live: `unknown.user@example.test` / `Aa1!wrongPass`; mocked: `registered.mock@example.test` / `Aa1!wrongPass` | Text, role, URL and UI state identical. Timing class compared as observation [TBC]. | P1 | AC-07, BR-02, REQ-13 | @customer @signin @regression @negative | mocked |

### TS-S-03 Navigation

| ID | Title | Preconditions | Steps | Test data | Expected result | Pri | Traceability | Tags | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-S-16 | [UC] Forgot password navigates to reset page without sending a request | PC-1; capture network | 1. Click button "Forgot password?" | none | URL `/forgot-password`. Heading "Reset your password", textbox "Enter your email address", buttons "Send verification code" and "Sign in" visible. No request to `ciam-native-auth`. | P1 | AC-15, BR-08, REQ-08 | @customer @signin @smoke @regression | automatable |
| TC-S-17 | [UC] Sign in on reset page returns to login with empty fields | At `/forgot-password` | 1. Click button "Sign in" | none | URL `/login`. Email and Password empty. "Sign in" disabled. | P2 | AC-16, REQ-08 | @customer @signin @regression | automatable |
| TC-S-18 | [EP] Reset page with unknown email shows the known enumeration message (recorded) | At `/forgot-password`, one attempt | 1. Type email 2. Click "Send verification code" 3. Wait for server response | `unknown.user@example.test` | Toast "We couldn't find an account with this email address." Recorded, not re-raised (F-09, F-10; Q-16). | P3 | AC-20, REQ-08 | @customer @signin @regression | automatable |
| TC-S-19 | [UC] Create one navigates to create profile without submitting | PC-1; capture network | 1. Click link "Create one" | none | URL `/create-profile`. No request to `ciam-native-auth`. | P1 | AC-17, BR-08, REQ-09 | @customer @signin @smoke @regression | automatable |

### TS-S-04 Show / Hide password

| ID | Title | Preconditions | Steps | Test data | Expected result | Pri | Traceability | Tags | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-S-20 | [EP] Password masked and toggle named "Show password" on load | PC-1 | 1. Read Password input type and toggle name | none | Input type is `password`. Button "Show password" present. | P1 | AC-27, BR-09, REQ-10 | @customer @signin @smoke @regression | automatable |
| TC-S-21 | [ST] Show password reveals text and renames toggle | PC-1 | 1. Type password 2. Click "Show password" | `Aa1!wrongPass` | Input type is `text`, value visible. Button now "Hide password". | P1 | AC-28, BR-09 | @customer @signin @regression | automatable |
| TC-S-22 | [ST] Hide password masks again and keeps value | PC-1, password visible | 1. Click "Hide password" | `Aa1!wrongPass` | Input type `password`. Value unchanged. Button "Show password". | P2 | AC-29, REQ-10 | @customer @signin @regression | automatable |
| TC-S-23 | [EP] Toggle works with Space and Enter and keeps focus | PC-1 | 1. Tab to toggle 2. Press Space 3. Press Enter | none | Each press toggles state. Focus stays on the toggle. | P2 | AC-30, REQ-10, REQ-12 | @customer @signin @regression @a11y | automatable |

### TS-S-05 UI and responsive

| ID | Title | Preconditions | Steps | Test data | Expected result | Pri | Traceability | Tags | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-S-24 | [EP] All controls visible at 1280 px without horizontal scroll | PC-1, viewport 1280 wide | 1. Check visibility of email, password, Show password, Sign in, Forgot password?, Create one 2. Compare scrollWidth with clientWidth | 1280 px | All visible, no horizontal scroll, no overlap. | P2 | AC-31, REQ-11 | @customer @signin @regression | automatable |
| TC-S-25 | [BVA] All controls visible at 375 px without horizontal scroll | PC-1, viewport 375 wide | Same as TC-S-24 | 375 px | All visible, no horizontal scroll, no overlap. | P2 | AC-31, REQ-11, EDGE-27 | @customer @signin @regression @mobile | automatable |
| TC-S-26 | [EG] Visual states, spelling and placeholder text review | PC-1 | 1. View empty, filled and error states 2. Review page title and labels | none | Disabled, enabled and error styles are distinct. No spelling errors or placeholder text. Findings logged as observations (no design reference). | P3 | AC-32, REQ-11 | @customer @signin @regression | manual |

### TS-S-06 Accessibility

| ID | Title | Preconditions | Steps | Test data | Expected result | Pri | Traceability | Tags | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-S-27 | [EP] Tab order and visible focus | PC-1, both fields filled | 1. Press Tab repeatedly from page start | `unknown.user@example.test` / `Aa1!wrongPass` | Order: email, password, Show password, Sign in, Forgot password?, Create one. Each focus visible. | P2 | AC-33, REQ-12 | @customer @signin @regression @a11y | automatable |
| TC-S-28 | [UC] Enter in the Password field submits the form | PC-1; capture network | 1. Type email 2. Type password 3. Press Enter in Password | `unknown.user@example.test` / `Aa1!wrongPass` | Same outcome as clicking "Sign in": one request, toast "Invalid email or password." | P1 | AC-34, REQ-12, REQ-02 | @customer @signin @regression @a11y | automatable |
| TC-S-29 | [EP] Error toast is exposed as role alert | PC-1 | 1. Submit unknown-email credentials 2. Locate `getByRole('alert')` after the server response | `unknown.user@example.test` / `Aa1!wrongPass` | Element with role `alert` contains "Invalid email or password." Auto-dismiss recorded as F-05. | P2 | AC-35, REQ-12 | @customer @signin @regression @a11y | automatable |
| TC-S-30 | [EP] axe scan of /login has no new critical violations | PC-1 | 1. Run axe on `/login` | none | No critical violations except known F-06 (button instead of link). | P2 | AC-36, REQ-12 | @customer @signin @regression @a11y | automatable |
| TC-S-31 | [EP] Inputs have accessible names; autocomplete value recorded | PC-1 | 1. Read accessible names of both inputs 2. Read `autocomplete` attribute of each | none | Names "Email address" and "Password". Autocomplete values recorded [TBC Q-11]. | P2 | AC-37, REQ-12, EDGE-20 | @customer @signin @regression @a11y | automatable |
| TC-S-32 | [EG] Screen reader walkthrough of sign in and error | PC-1, NVDA or VoiceOver | 1. Navigate form with screen reader 2. Trigger error 3. Listen | `unknown.user@example.test` / `Aa1!wrongPass` | Labels, button states (disabled, Show/Hide) and toast are announced. Defects recorded. | P2 | REQ-12, AC-35 | @customer @signin @a11y | manual |

### TS-S-07 Security

| ID | Title | Preconditions | Steps | Test data | Expected result | Pri | Traceability | Tags | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-S-33 | [EP] No password in URL or history and all requests use HTTPS | PC-1; record URL, history and requests | 1. Submit unknown-email credentials 2. Inspect URL, query, history entries 3. List request URLs | `unknown.user@example.test` / `Aa1!wrongPass` | Password absent from URL and query. All requests `https://`. | P0 | AC-38, REQ-13 | @customer @signin @regression | automatable |
| TC-S-34 | [EP] Password masked in DOM and not echoed in toast or title | PC-1 | 1. Type password 2. Submit 3. Search DOM, toast and `document.title` for the password string | `Aa1!wrongPass` | Input type `password` until toggled. Value not found outside the input. | P1 | AC-39, BR-09, REQ-13 | @customer @signin @regression | automatable |
| TC-S-35 | [EP] Unauthenticated direct access to /apply-for-a-loan is refused | Anonymous, fresh context | 1. Open `/apply-for-a-loan` directly | none | Redirected to sign in or denied; loan page content not shown [TBC Q-12 exact behaviour]. | P0 | AC-40, BR-03, REQ-13 | @customer @signin @regression @negative | automatable |
| TC-S-36 | [EG] Injection-like input is handled safely | PC-1; listen for dialogs and console errors | For each pair: 1. Type email 2. Type password 3. Click "Sign in" | `' OR 1=1 --` and `<script>alert(1)</script>` in both fields | Generic error or validation message. No dialog, no script execution, no stack trace. | P1 | AC-42, REQ-13, REQ-03 | @customer @signin @regression @negative | automatable |
| TC-S-67 | [EP] Verification code is not exposed in the URL or requests and travels over HTTPS | PC-5 plus verify mock that returns success [shape TBC Q-03]; record URLs, history and requests | 1. Enter the synthetic code 2. Record the code input type and masking 3. Click "verify code" [label TBC Q-03] 4. Capture every page URL (path, query, hash), history entry and request URL | `000000` (synthetic, from the wrong-codes dataset TD-S-06) | The code is absent from every URL, query string and hash. All requests are `https://`. Code input masking matches REQ-13 [TBC whether OTP boxes are masked; record it]. | P1 | AC-38, REQ-13 | @customer @signin @regression | mocked |
| TC-S-69 | [EG] Password not persisted in storage, cookies or console | PC-1; capture console messages from page load | 1. Type email 2. Type password 3. Click "Sign in" 4. Wait for the toast 5. Read `localStorage`, `sessionStorage`, `document.cookie` 6. Search them and the captured console messages for the password string | `unknown.user@example.test` / `Aa1!wrongPass` (synthetic, unknown account) | The password string appears in none of `localStorage`, `sessionStorage`, `document.cookie` or the console messages. | P1 | AC-39, REQ-13 | @customer @signin @regression | automatable |

### TS-S-08 Third-party and identity-provider errors

| ID | Title | Preconditions | Steps | Test data | Expected result | Pri | Traceability | Tags | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-S-37 | [UC] Cloudflare challenge on SMS inbox stops the run as BLOCKED | `SMS_INBOX_URL` set | 1. Open `SMS_INBOX_URL` in a new tab of the same context 2. Detect challenge ("Just a moment...") 3. Take no bypass action | `SMS_INBOX_URL` | If a challenge is detected: the guard throws an error whose message starts with "BLOCKED:" (e.g. "BLOCKED: SMS inbox behind Cloudflare challenge (B2)"), the test is reported skipped/blocked (not passed), dependent tests are marked blocked, not failed, and no further interaction with the SMS site occurs (no solve or evade attempt). If no challenge appears, the guard returns normally and the test continues to the inbox read. | P1 | AC-43, BR-12, REQ-15 | @customer @signin @regression | automatable |
| TC-S-38 | [DT] Code selection picks newest Alabama Ag Credit message after request time (unit, HTML fixtures) | Saved HTML fixtures of inbox, no network | 1. Feed fixture with older and newer "Alabama Ag Credit" messages 2. Feed fixture with two messages after requestedAt 3. Run selector with requestedAt | requestedAt between messages; messages are 6-digit codes in fixture | Newest message after requestedAt chosen. Older ones ignored. With two after request the newest wins (EDGE-23). Code extracted as 6 digits. | P1 | AC-44, BR-05, EDGE-23, REQ-15 | @customer @signin @regression | automatable |
| TC-S-39 | [EG] Selector ignores other senders and older messages, reports no message on timeout (unit) | Fixtures, fake clock | 1. Fixture with only other senders 2. Fixture with only messages older than requestedAt 3. Empty fixture 4. Run bounded poll to timeout | timeout value [TBC Q-13] | Returns "no message", never a wrong code. Poll stops at the timeout. | P2 | AC-44, BR-05, EDGE-13, EDGE-24 | @customer @signin @regression @negative | automatable |
| TC-S-40 | [EP] Identity-provider failure on Sign in shows error and recovers | PC-1 plus route: respond with 500, 503, abort, or delay beyond timeout | 1. Type email and password 2. Click "Sign in" 3. Observe 4. Remove failing route and click "Sign in" again | `unknown.user@example.test` / `Aa1!wrongPass`; modes 500, 503, abort, timeout | User-visible error message. "Sign in" usable again. Exactly one request per click. Exact copy [TBC]. | P2 | AC-45, EDGE-22, REQ-15, REQ-16 | @customer @signin @regression @negative | mocked |
| TC-S-41 | [EG] Double click on Sign in sends one request | PC-2 with counter on the sign-in request | 1. Fill valid mock credentials 2. Double-click "Sign in" | `registered.mock@example.test` / `Aa1!mockPass` | One sign-in request; one code step; not two codes. | P2 | EDGE-07, AC-45 | @customer @signin @regression @negative | mocked |
| TC-S-66 | [EG] Verify code when the identity provider returns 5xx, abort or timeout | PC-5 plus route on the verify/continue call of the code step | For each mode: 1. Route the verify/continue call to the mode (500, then 503, then abort, then a delayed response beyond the client timeout [TBC]) 2. Enter code 3. Click "verify code" [label TBC Q-03] 4. Observe | `123456` (mock); modes 500, 503, abort, timeout [TBC] | An error message is shown. "verify code" [label TBC Q-03] is usable again. Exactly one verify request per click. No navigation to `/apply-for-a-loan`. Exact copy [TBC]. | P1 | AC-45, REQ-15, REQ-16 | @customer @signin @regression @negative | mocked |

### TS-S-09 MFA code step and Resend (all unobserved; labels [TBC Q-03])

| ID | Title | Preconditions | Steps | Test data | Expected result | Pri | Traceability | Tags | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-S-42 | [UC] Valid credentials lead to the SMS code step | PC-2, valid-credentials variant | 1. Type email 2. Type password 3. Click "Sign in" | `registered.mock@example.test` / `Aa1!mockPass` | Verification-code step shown; text states a code was sent by SMS (phone masking [TBC]). URL is not `/apply-for-a-loan`. | P0 | AC-02, BR-03, REQ-04 | @customer @signin @regression | mocked |
| TC-S-43 | [ST] No access to /apply-for-a-loan before a code is entered | PC-5 | 1. On code step, navigate directly to `/apply-for-a-loan` | none | Loan page not shown; user is sent to sign in or denied. | P0 | BR-03, BR-06, AC-40 | @customer @signin @regression @negative | mocked |
| TC-S-44 | [EP] Empty code cannot be submitted | PC-5 | 1. Leave code empty 2. Click "verify code" [label TBC] | empty | Control disabled or error shown; step remains; no navigation. | P2 | AC-09, REQ-06 | @customer @signin @regression @negative | mocked |
| TC-S-45 | [EP] Wrong 6-digit code is rejected | PC-5, verify returns invalid code (`invalid_grant`, `invalid_oob_value` [shape TBC]) | 1. Type 6-digit code 2. Click "verify code" | `000000` | Error message shown; stays on code step; URL not `/apply-for-a-loan`; not signed in. Copy [TBC]. | P0 | AC-10, BR-04, BR-07, REQ-06 | @customer @signin @regression @negative | mocked |
| TC-S-46 | [BVA] Codes of wrong length or format are rejected | PC-5 | For each value: 1. Enter value 2. Click "verify code" | `12345` (5), `1234567` (7), `12ab56`, `abcdef`, ` 123456 `, `123 456` | Rejected or control disabled; no success; message [TBC]. Space handling recorded (EDGE-09). | P2 | AC-11, BR-04, EDGE-09 | @customer @signin @regression @negative | mocked |
| TC-S-47 | [ST] Expired code is rejected | PC-5, verify returns expired code [shape TBC Q-03] | 1. Enter code 2. Click "verify code" [label TBC Q-03] | `123456` (mock), answered by the mock as expired. Validity period [TBC Q-05] | Rejected, stays on step, not signed in; URL not `/apply-for-a-loan` (DT-S-02 R4). | P2 | AC-12, BR-07, EDGE-11, REQ-06 | @customer @signin @regression @negative | mocked |
| TC-S-48 | [UC] Correct code navigates to /apply-for-a-loan | PC-5, verify returns success with tokens [shape TBC] | 1. Type 6-digit code 2. Click "verify code" | `123456` (mock) | URL path is `/apply-for-a-loan` and no other destination. | P0 | AC-04, BR-06, REQ-05 | @customer @signin @regression | mocked |
| TC-S-49 | [EG] Double click on verify code sends one verification | PC-5, request counter | 1. Enter code 2. Double-click "verify code" | `123456` (mock) | One verification request. | P2 | EDGE-08, REQ-05 | @customer @signin @regression | mocked |
| TC-S-50 | [EG] Pasting a full code into the first box | PC-5 | 1. Paste 6-digit code into first box | `123456` | Pass if, after the paste, either all 6 boxes hold the digits in order, or the paste is rejected with no partial submission. Fail if a wrong or partial value is ever auto-submitted. Which branch occurs is recorded (F-13: six boxes on sign-up). | P3 | EDGE-10, REQ-06 | @customer @signin @regression | mocked |
| TC-S-51 | [EP] Code step controls have accessible names | PC-5 | 1. Read accessible names of each code input, "verify code" and Resend | none | Each has a name; SMS statement present. Known F-13 (unnamed OTP boxes) reported if seen. | P2 | AC-14, REQ-12, REQ-04 | @customer @signin @regression @a11y | mocked |
| TC-S-52 | [UC] Resend code requests a new code and shows confirmation | PC-5, resend challenge mock with request counter | 1. Click Resend [label TBC] | none | Confirmation shown; a new code is requested once. Test would only use messages newer than the resend time. | P2 | AC-18, REQ-07, BR-05 | @customer @signin @regression | mocked |
| TC-S-53 | [ST] Resend countdown disables the control until it ends | PC-5, fake timers | 1. Click Resend 2. Click again before countdown ends 3. Advance clock to end 4. Click again | timer length [TBC] (30 s on sign-up email step) | Early click ignored or disabled; after the countdown it is enabled. | P3 | AC-19, REQ-07 | @customer @signin @regression | mocked |
| TC-S-54 | [ST] Code from before Resend after a new code was issued | PC-5, mock: second challenge issued, old code rule [TBC Q-06] | 1. Request Resend 2. Submit first code | first code `111111`, second `222222` (mock) | Behaviour matches Q-06 (rejected or both accepted). Recorded. | P2 | AC-13, BR-05, EDGE-12 | @customer @signin @regression | mocked |
| TC-S-68 | [ST] Already-used code rejected | PC-5, verify returns code already used [shape TBC Q-03] | 1. Enter code 2. Click "verify code" [label TBC Q-03] | `123456` (mock), answered by the mock as already used once | Rejected, stays on step, not signed in; URL not `/apply-for-a-loan` (DT-S-02 R6). | P2 | BR-07, REQ-06 | @customer @signin @regression @negative | mocked |

### TS-S-10 Lockout and session

| ID | Title | Preconditions | Steps | Test data | Expected result | Pri | Traceability | Tags | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-S-55 | [ST] Lockout response is shown after repeated failures (mocked) | PC-2, token mock returns lockout after N failures (error shape, N and message [TBC Q-07]) | 1. Submit wrong credentials N times (N from mock) 2. Observe message 3. Submit correct mocked credentials | N [TBC] | Throttle or lockout message shown; correct password behaviour after lock as per Q-07. Never run against a real account. | P1 | AC-41, BR-11, EDGE-28, REQ-14 | @customer @signin @regression @negative | mocked |
| TC-S-56 | [ST] Lockout on a dedicated lock-test account (manual, after Q-07) | Dedicated lock-test account and agreed threshold from Q-07. Not `CUSTOMER_EMAIL`. | 1. Submit wrong password up to the agreed small number 2. Record message, threshold, duration 3. Try correct password | agreed number [TBC Q-07] | Threshold and message recorded. Do not run until Q-07 answered. | P2 | AC-41, BR-11, REQ-14 | @customer @signin @negative | blocked |
| TC-S-57 | [ST] Refresh on the code step never signs the user in | PC-5 | 1. Reload the page 2. Observe | none | Behaviour recorded (stay, back to `/login`, error) [TBC Q-15]. URL never `/apply-for-a-loan`. | P2 | AC-47, EDGE-15, REQ-16 | @customer @signin @regression | mocked |
| TC-S-58 | [ST] Back then Forward on the code step never signs the user in | PC-5 | 1. Click browser Back 2. Click Forward 3. Observe | none | Behaviour recorded [TBC Q-15]. Never signed in without a valid code. | P2 | AC-47, EDGE-16, REQ-16 | @customer @signin @regression | mocked |
| TC-S-59 | [ST] Signed-in user opening /login | PC-4 | 1. Open `/login` | none | No error page or stack trace, and the user is not shown the login form as unauthenticated while a valid session exists. Exact behaviour (redirect to `/apply-for-a-loan` or a signed-in state) recorded [TBC Q-14]. | P3 | AC-46, REQ-16 | @customer @signin @regression | blocked |

### TS-S-11 End to end and exploratory charters

| ID | Title | Preconditions | Steps | Test data | Expected result | Pri | Traceability | Tags | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-S-60 | [UC] Full sign in with real SMS code reaches /apply-for-a-loan | PC-3 (account currently `user_not_found`, Q-01; inbox behind Cloudflare, Q-02) | 1. Open `CUSTOMER_BASE_URL` 2. Click "Sign in" 3. Fill Email address with `CUSTOMER_EMAIL` 4. Fill Password with `CUSTOMER_PASSWORD` 5. Click "Sign in" 6. Record `requestedAt` 7. Open `SMS_INBOX_URL` in a new tab of the same context 8. If Cloudflare challenge: stop with "BLOCKED", no bypass 9. Click "update message" in a bounded poll (timeout [TBC Q-13]) 10. Pick the newest "Alabama Ag Credit" message after `requestedAt` 11. Extract the 6-digit code 12. Switch to the app tab, enter code in the verification-code section 13. Click "verify code" [label TBC Q-03] 14. Assert URL path `/apply-for-a-loan` | env `CUSTOMER_EMAIL`, `CUSTOMER_PASSWORD`, `SMS_INBOX_URL`, `CUSTOMER_BASE_URL` | Code step shown after step 5. A message after `requestedAt` is found. Final path is `/apply-for-a-loan`. | P0 | AC-02, AC-03, AC-04, BR-03, BR-05, BR-06, BR-12, REQ-05 | @customer @signin @e2e-full | blocked |
| TC-S-61 | [UC] Manual fallback: sign in with human-read SMS | Human tester; account exists and number registered (Q-01) | 1. Open `CUSTOMER_BASE_URL` in browser 2. Sign in with `CUSTOMER_EMAIL` / `CUSTOMER_PASSWORD` 3. Note request time 4. Open `SMS_INBOX_URL` in a new tab and pass the challenge as a human 5. Click "update message" until an "Alabama Ag Credit" message newer than request time appears 6. Type code into the app 7. Click "verify code" 8. Record code timestamp and result | env secrets, not written in notes | Path `/apply-for-a-loan`. Tester records code timestamp and pass or fail. | P0 | AC-02, AC-03, AC-04, BR-05, BR-06, REQ-15 | @customer @signin @e2e-full | manual |
| TC-S-62 | [EG] Charter: observe and document the MFA screen | After Q-01, human | 1. Reach the code step 2. Record labels, inputs, timer, Resend, phone masking, error copy 3. Update Q-03 and TC-S-42..54 | none | Observations recorded; TBC items in TC-S-42..54 resolved. Time-box 30 min. | P2 | AC-09..AC-19, REQ-04, REQ-06, REQ-07 | @customer @signin @regression | manual |
| TC-S-63 | [EG] Charter: account with no MFA phone or a different phone | Dedicated accounts [TBC Q-04] | 1. Sign in with each account 2. Record flow and messages | accounts per Q-04 | Behaviour recorded; no access without a valid second factor if MFA is required. | P3 | EDGE-25, BR-03 | @customer @signin @regression @negative | manual |
| TC-S-64 | [EG] Charter: timeouts and multiple tabs | After Q-01, human | 1. Wait on the code step beyond a plausible expiry while reading the inbox 2. Sign in in tab 1, open `/login` in tab 2 3. Record | none | Session or code expiry and tab behaviour recorded (EDGE-17, EDGE-18). | P3 | EDGE-17, EDGE-18, REQ-16 | @customer @signin @regression | manual |
| TC-S-65 | [EG] Charter: input edge cases on the sign-in form | PC-1, human. Uses unknown synthetic emails only (`unknown.user@example.test` and generated `example.test` addresses); never `CUSTOMER_EMAIL`, so it uses none of the real-account wrong-password budget | 1. Paste into fields with trailing newline 2. Uppercase email 3. Email of 255 and 256 chars 4. Spaces around password 5. Caps Lock on 6. Browser autofill or password manager 7. Zoom 200 percent | as listed; unknown synthetic emails only | Behaviour recorded for case, trim, max length, paste, Caps Lock warning, autofill enable state, zoom layout [TBC Q-08, Q-11]. | P3 | EDGE-01, EDGE-03, EDGE-04, EDGE-05, EDGE-19, EDGE-20, EDGE-27 | @customer @signin @regression | manual |

## Decision tables

### DT-S-01 Sign in enable rule (BR-01)

1. Conditions: C1 Email in {empty, whitespace-only, filled}; C2 Password in {empty, filled}. 2. Action: "Sign in" enabled or disabled. 3. Full matrix: 3 x 2 = 6 combinations (no elimination, each reachable).

| Rule | C1 Email | C2 Password | Action | TC |
|---|---|---|---|---|
| R1 | empty | empty | disabled | TC-S-02 |
| R2 | filled | empty | disabled | TC-S-03 |
| R3 | whitespace | filled | [TBC Q-09] record | TC-S-06 |
| R4 | whitespace | empty | disabled (expected, password empty); [TBC Q-09] | TC-S-06 |
| R5 | empty | filled | disabled | TC-S-04 |
| R6 | filled | filled | enabled | TC-S-05 |

Elimination log: none. Password whitespace-only is covered as a data row in TC-S-06 (value domain simplified, [TBC Q-09]).

### DT-S-02 MFA code acceptance (BR-04, BR-05, BR-07; labels and rules [TBC])

Conditions: C1 Format in {6 digits, other}; C2 Age in {within validity, expired [Q-05]}; C3 Issue in {latest, superseded by Resend [Q-06]}; C4 Use in {unused, already used}. Full matrix 2 x 2 x 2 x 2 = 16 (below 32, no pairwise).

| Combination | Result | Rule / reason |
|---|---|---|
| C1=other (8 combos) | Eliminated as separate rules: collapsed to R1 because format is rejected before age, issue or use are evaluated (assumption [I], confirm in Q-03) | R1: rejected (TC-S-44, TC-S-46) |
| 6 digits, within, latest, unused | R2: accepted, `/apply-for-a-loan` | TC-S-48 |
| 6 digits, within, latest, unused but wrong digits | R3: rejected (value-mismatch, cannot be expressed in the 4 conditions; added as condition C5 correct value) | TC-S-45 |
| 6 digits, expired, latest, unused | R4: rejected | TC-S-47 |
| 6 digits, within, superseded, unused | R5: [TBC Q-06] | TC-S-54 |
| 6 digits, within, latest, used | R6: rejected | TC-S-68 |
| 6 digits, expired and (superseded or used) combos (3) | Collapsed into R4 and R6 since one failing reason is enough to reject; individual priority between reasons not asserted | TC-S-47, TC-S-68 |
| 6 digits, within, superseded, used (1) | Collapsed into R6 | TC-S-68 |

Coverage trade-off: reason precedence among multiple failing conditions is not tested (message text [TBC]).

## Coverage matrix

### AC to TC

| AC | TCs | AC | TCs | AC | TCs |
|---|---|---|---|---|---|
| AC-01 | 01 | AC-17 | 19 | AC-33 | 27 |
| AC-02 | 42, 60, 61 | AC-18 | 52 | AC-34 | 28 |
| AC-03 | 60, 61 | AC-19 | 53 | AC-35 | 29, 32 |
| AC-04 | 48, 60, 61 | AC-20 | 18 | AC-36 | 30 |
| AC-05 | 08 | AC-21 | 02 | AC-37 | 31 |
| AC-06 | 13, 14 | AC-22 | 03, 04 | AC-38 | 33, 67 |
| AC-07 | 15 | AC-23 | 05 | AC-39 | 34, 69 |
| AC-08 | 11 | AC-24 | 06 | AC-40 | 35, 43 |
| AC-09 | 44, 62 | AC-25 | 09 | AC-41 | 55, 56 |
| AC-10 | 45 | AC-26 | 10 | AC-42 | 36 |
| AC-11 | 46 | AC-27 | 20 | AC-43 | 37 |
| AC-12 | 47 | AC-28 | 21 | AC-44 | 38, 39 |
| AC-13 | 54 | AC-29 | 22 | AC-45 | 40, 41, 66 |
| AC-14 | 51 | AC-30 | 23 | AC-46 | 59 |
| AC-15 | 16 | AC-31 | 24, 25 | AC-47 | 57, 58 |
| AC-16 | 17 | AC-32 | 26 | | |

All AC-01..AC-47 covered.

### BR to TC

| BR | TCs |
|---|---|
| BR-01 | 02, 03, 04, 05, 06, 07 |
| BR-02 | 08, 13, 14, 15 |
| BR-03 | 35, 42, 43, 63, 60 |
| BR-04 | 45, 46 |
| BR-05 | 38, 39, 52, 54, 60, 61 |
| BR-06 | 43, 48, 60, 61 |
| BR-07 | 45, 47, 68 |
| BR-08 | 16, 19 |
| BR-09 | 20, 21, 34 |
| BR-10 | 09, 10 |
| BR-11 | 14, 55, 56 |
| BR-12 | 37, 60 |

All BR-01..BR-12 covered.

### REQ to TC (summary)

REQ-01: 01. REQ-02: 02-07, 28. REQ-03: 08-13, 36. REQ-04: 42, 51, 60. REQ-05: 48, 49, 60. REQ-06: 44-47, 50, 62, 68. REQ-07: 52, 53, 62. REQ-08: 16-18. REQ-09: 19. REQ-10: 20-23. REQ-11: 24-26. REQ-12: 23, 27-32, 51. REQ-13: 15, 33-36, 67, 69. REQ-14: 55, 56. REQ-15: 37-40, 61, 66. REQ-16: 40, 57-59, 64, 66.

### EDGE coverage

Covered: EDGE-01 (65), 02 (06), 03 (65), 04 (65), 05 (65), 06 (12), 07 (41), 08 (49), 09 (46), 10 (50), 11 (47), 12 (54), 13 (39), 15 (57), 16 (58), 17 (64), 18 (64), 19 (65), 20 (31, 65), 21 (07), 22 (40), 23 (38), 24 (39), 25 (63), 26 (12), 27 (25, 65), 28 (55).
Not covered: EDGE-14 (two parallel runs on the same number). Reason: it is a test-execution constraint, handled by serialising runs (PC-3), not a testable product behaviour.
EDGE-01, 03, 04, 05 and 19 are only covered by a manual charter (TC-S-65) until Q-08 is answered.

## Validation findings

- Medium: TC-S-42..54, 57, 58, 66..68 depend on unobserved screens and mock shapes [TBC Q-03]; rework after observation.
- Medium: TC-S-14, 56, 59, 60 stay blocked until Q-01 (account), Q-02 (Cloudflare) and Q-07 (lockout) are answered.
- Low: TC-S-06, 09, 10, 46, 50, 54, 57, 58 assert recorded behaviour, not a fixed result, because the rule is unknown (Q-08, Q-09, Q-10, Q-06, Q-15).
- Low: DT-S-02 elimination rule R1 (format checked first) is an assumption [I].

## Gaps / questions

Open questions that gate TCs: Q-01 (account), Q-02 (inbox access), Q-03 (MFA labels), Q-04 (no-MFA account), Q-05 (code validity), Q-06 (Resend invalidation), Q-07 (lockout), Q-08 (email validation), Q-09 (whitespace), Q-10 (password policy), Q-11 (autocomplete), Q-12 (unauthenticated redirect), Q-13 (poll timeout), Q-14 (signed-in /login), Q-15 (refresh/back), Q-16 (forgot-password message).
