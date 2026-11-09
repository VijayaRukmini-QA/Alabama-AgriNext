# Test Plan: Customer Sign in (Customer app)

Runner: Playwright Test (TypeScript, Page Object Model) | App: `CUSTOMER_BASE_URL` (dev host as in the AC doc) | Date: 2026-11-09
Companions: `docs/ACCEPTANCE-CRITERIA-Customer-Signin.md` (REQ-01..16, BR-01..12, AC-01..47, EDGE-01..28, Q-01..16), `docs/TEST-CASES-Customer-Signin.md` (TC-S-01..69, TS-S-01..11, DT-S-01..02), `docs/EXPLORATORY-FINDINGS-Create-Customer-Profile.md` (F-xx, B1/B2). House style: `docs/TEST-PLAN-Create-Customer-Profile.md`.

Legend: **[TBC]** = unknown, owned by a Q- item in the AC doc. No number in this plan (lockout threshold, code validity, poll timeout, resend timer) is invented; each is [TBC] with its Q- ID. No secret value appears here. Secrets are referenced by env var name only: `CUSTOMER_EMAIL`, `CUSTOMER_PASSWORD`, `SMS_INBOX_URL`, `CUSTOMER_BASE_URL`.

Status today (2026-11-09): the account behind `CUSTOMER_EMAIL` returns `user_not_found` (Q-01). Its creation is blocked by B1 and B2. The SMS inbox is behind a Cloudflare managed challenge (B2/F-02, Q-02). The sign-in MFA screen has never been observed (Q-03). The happy path (TC-S-60) is therefore **BLOCKED**.

---

## 1. Objectives
- Prove the pre-login behaviour of `/login` and `/forgot-password` now, with no real account: enable rule, generic credential error, navigation, Show/Hide, UI, accessibility, security basics (35 automatable TCs).
- Cover the MFA code step, Resend, lockout, IdP errors and session edge cases with mocked Entra native-auth responses (23 mocked TCs), without touching the shared SMS number or a real account.
- Prove the real outcome once (sign in, SMS code, `/apply-for-a-loan`) as `@e2e-full` (TC-S-60) when Q-01 and Q-02 are resolved; until then give a human fallback (TC-S-61).
- Keep the SMS inbox isolated, bounded by a timeout, and incapable of returning a stale or foreign code. Stop and report BLOCKED on a challenge, never bypass (BR-12).
- Never lock the real account. Leave the Lender and Create Customer Profile suites untouched.

## 2. Scope

| In scope | Out of scope |
|---|---|
| Landing "Sign in" to `/login`, email and password form, Sign in enable rule (REQ-01, 02) | Content and behaviour of the loan application at `/apply-for-a-loan` beyond the URL path |
| Generic credential error, non-enumeration (REQ-03, 13) | Completing a password reset (only navigation and one recorded message, TC-S-16..18) |
| MFA SMS code step, wrong/empty/expired code, Resend, newest-message selection (REQ-04..07, 15), mocked | SMS delivery infrastructure, content design of the SMS |
| Forgot password and Create one navigation (REQ-08, 09) | Creating an account (belongs to the Create Customer Profile plan; currently blocked B1/B2) |
| Show/Hide password (REQ-10) | Address, consents, profile form |
| UI, responsive 375/1280, accessibility, axe (REQ-11, 12) | Full WCAG audit, visual design sign-off (no design reference) |
| Security basics: URL/DOM/HTTPS, unauthenticated access to `/apply-for-a-loan`, injection-like input (REQ-13) | Penetration testing, load testing |
| Lockout behaviour, mocked only; real lockout only on a dedicated account after Q-07 (REQ-14) | Lockout against `CUSTOMER_EMAIL` |
| Session on the code step: refresh, Back, signed-in `/login`, tabs (REQ-16) | Sign-out, token lifetime internals (no Q- answer yet) |
| Third-party handling: Cloudflare detection, code selection logic (unit) | Bypassing Cloudflare, solving challenges, evading bot detection |
| Chromium primary, Pixel 5 emulation for `@mobile` | Firefox/WebKit, production |

## 3. Environment
- App: `CUSTOMER_BASE_URL` (all paths relative: `/`, `/login`, `/forgot-password`, `/create-profile`, `/apply-for-a-loan`). Lender `BASE_URL` is not used.
- Third party: `SMS_INBOX_URL` (receive-smss.com, shared public number, behind Cloudflare). Needs outbound internet; used only by TC-S-37, TC-S-60, TC-S-61.
- Identity provider: Entra External ID native auth (`**/ciam-native-auth/**`, `**/oauth2/v2.0/token`). Real in unmocked TCs, intercepted in mocked TCs.
- Browsers and viewports: Chromium desktop 1280x720 (primary); Pixel 5 emulation and 375 px width for `@mobile` (TC-S-25); 1280 px for TC-S-24; 200 percent zoom manual (TC-S-65).
- Playwright projects (already defined in `playwright.config.ts`, verified): `customer-chromium` (testDir `tests/customer`, `grepInvert /@e2e-full|@mobile/`), `customer-mobile` (`grep /@mobile/`), `customer-e2e` (`grep /@e2e-full/`, retries 0). Sign-in specs are collected by these projects automatically; select with `--grep @signin`. No new project is required. There is no `playwright.customer.config.ts` in the repo today (the earlier proposal was not adopted); do not create one for this plan.
- `.env` keys (presence only, never values): `CUSTOMER_BASE_URL`, `CUSTOMER_EMAIL`, `CUSTOMER_PASSWORD` (quote if it contains `#`), `SMS_INBOX_URL`. Getters `getCustomerEmail`, `getCustomerPassword`, `getSmsInboxUrl` already exist in `config/env.ts`. Add placeholders only to `.env.example`. A missing key skips dependent TCs with a reason, it does not fail them.

## 4. Test data and data lineage

| Need | Lineage | How | TCs | Cleanup |
|---|---|---|---|---|
| Real account email | ENV-SECRET | `CUSTOMER_EMAIL`, at most 1 wrong-password attempt per day across TC-S-14, TC-S-56 and any manual session until Q-07 is known (TC-S-14); never in lockout tests | TC-S-14, 60, 61 | None (read-only use). Never log. |
| Real account password | ENV-SECRET | `CUSTOMER_PASSWORD`; masked logging, no `video`/trace with typed secrets | TC-S-60, 61 | None |
| Unknown-email credentials | SYNTHETIC-LITERAL | TD-S-01. Rule: every unknown-email literal is a synthetic non-real address on a reserved domain (`example.test`), never a real or guessable mailbox, never derived from `CUSTOMER_EMAIL` | TC-S-03..12, 15, 18, 27..29, 33, 34, 36, 40, 69 | None |
| Wrong/invalid password, malformed email, boundary, injection inputs | SYNTHETIC-LITERAL | TD-S-02..08 in `test-data/signin.data.ts` (non-secret strings only; invalid passwords never derived from the real one) | see dataset table | None |
| Mock "registered" credentials | SYNTHETIC-LITERAL + SYNTHETIC-NETWORK | TD-S-09, answered by route fulfilments | TC-S-13, 15, 41..55, 57, 58, 66..68 | Per-test route, discarded |
| Entra native-auth responses (valid creds, invalid creds, invalid code, expired, already-used, resend, lockout, 5xx, abort, delay) | SYNTHETIC-NETWORK | `page.route` per PC-2 / PC-5; catch-all abort registered first (last registered route wins); shapes [TBC Q-03], base on the sign-up recipe (`oob` / `sms` / `code_length 6`; wrong code `400 invalid_grant / invalid_oob_value`) | TC-S-13, 15, 40..55, 57, 58, 66..68 | Per-test route |
| SMS code from shared inbox | THIRD-PARTY-LIVE | Newest "Alabama Ag Credit" message after `requestedAt`, bounded poll [TBC Q-13]; stop on challenge | TC-S-37 (page open only), 60, 61 | Message left in public inbox |
| Inbox HTML fixtures | UNIT-FIXTURE | Saved HTML, code values redacted or synthetic, fake clock, no network | TC-S-38, 39 | None |
| Dedicated lock-test account / no-MFA account | ENV-SECRET (new keys, names [TBC]) | Provided by Q-07 and Q-04; not `CUSTOMER_EMAIL` | TC-S-56, 63 | Owner resets lock |

Rules: no test depends on another's data; mocked TCs never use `CUSTOMER_EMAIL`; the real phone number and shared inbox are used only by TC-S-60/61 (serialised, workers 1, EDGE-14).

### Named datasets (non-secret)

| ID | Set | Values | Used by |
|---|---|---|---|
| TD-S-01 | Positive-negative baseline (unknown account) | email `unknown.user@example.test`, password `Aa1!wrongPass` | TC-S-03..05, 07, 08, 11, 18 (email only), 27..29, 33, 34, 40, 69 |
| TD-S-02 | Malformed emails (negative) | `notanemail`, `user@`, `@domain.com`, `a b@c.com`; password `Aa1!wrongPass` | TC-S-09 |
| TD-S-03 | Password boundary and robustness | 7 chars `Ab1!xyz` (below sign-up policy); 1000 x `a`; `Pässwörd😀1!`; `пароль1!`; email `unknown.user@example.test` | TC-S-10, 12 |
| TD-S-04 | Whitespace | 3 spaces in email (with empty, then filled password), then 3 spaces in password with `unknown.user@example.test` | TC-S-06 |
| TD-S-05 | Injection-like strings | `' OR 1=1 --`, `<script>alert(1)</script>` in both fields | TC-S-36 |
| TD-S-06 | Wrong or malformed codes (mocked step) | empty; `000000`; `12345`, `1234567`, `12ab56`, `abcdef`, ` 123456 `, `123 456` | TC-S-44..46, 67 (`000000` as the synthetic code checked for exposure) |
| TD-S-07 | Mock success and sequencing codes | `123456` (accept; also the code the mock answers as expired, already used or failed), `111111` then `222222` (resend ordering) | TC-S-47..50, 54, 66, 68 |
| TD-S-08 | Edge input charter values (manual) | upper-cased email, 255 and 256 char emails (generated at run time), trailing newline paste, spaces around password | TC-S-65 |
| TD-S-09 | Mock registered account | `registered.mock@example.test` with `Aa1!mockPass` (wrong-password case uses `Aa1!wrongPass`) | TC-S-13, 15, 41..55, 57, 58, 66..68 |
| TD-S-10 | IdP failure modes | respond 500, 503, abort, delay beyond timeout [timeout TBC] | TC-S-40 (Sign in), 66 (verify code) |
| TD-S-11 | Viewports | 1280 px, 375 px | TC-S-24, 25 |
| TD-S-12 | Inbox fixtures | older and newer "Alabama Ag Credit" messages, two after `requestedAt`, other senders only, only-older, empty | TC-S-38, 39 |
| TD-S-13 | Lockout mock | N failures then lockout response [N, shape, message TBC Q-07] | TC-S-55 |

## 5. Mock vs real

| Dependency | Real / mocked | Why |
|---|---|---|
| `/login` and `/forgot-password` UI | Real | No account needed; live observed behaviour |
| Unknown-email credential check at the IdP | Real, one attempt per test, no loops | Observed generic error; protects rate limits (EDGE-28) |
| Wrong password for a registered account | **Mocked** (TC-S-13, 15); one real attempt only TC-S-14 (blocked until Q-01) | Lockout risk (BR-11) |
| Valid-credentials response, MFA challenge, verify, resend | **Mocked** (TC-S-42..54, 57, 58, 66..68) [shapes TBC Q-03] | Account does not exist; shared number must not be consumed |
| Lockout | **Mocked** (TC-S-55); real only on a dedicated account after Q-07 (TC-S-56) | Never lock `CUSTOMER_EMAIL` |
| IdP outage (5xx, abort, timeout) | **Mocked** (TC-S-40 on Sign in, TC-S-66 on verify code) | Cannot be induced live |
| `/forgot-password` unknown email | Real, one attempt (TC-S-18) | Recorded finding F-09, no side effect |
| SMS inbox | Real only in TC-S-37 (open and detect challenge), TC-S-60, 61; logic tested by fixtures (TC-S-38, 39) | Shared, public, Cloudflare |
| Captcha / Cloudflare wall | Never mocked away or bypassed. Existing `assertNotBlocked` / `ThirdPartyBlockedError` stop the run | BR-12 policy |
| Direct `/apply-for-a-loan` while anonymous | Real (TC-S-35); code-step variant mocked (TC-S-43) | Pure access check |

Risk of mocked shapes: they are derived from the sign-up recipe, not from sign-in traffic. TC-S-60 (when unblocked) is the contract check, and TC-S-62 (charter) must update the shapes and Q-03.

## 6. Risk-based priority

Scale (plan convention): Likelihood and Impact each 1 low, 2 medium, 3 high. Score = L x I. Score 6 to 9 = P0, 3 to 4 = P1, 2 = P2, 1 = P3. Execution order: P0 areas first.

| ID | Feature area | L | I | Score | Priority | Reason | Main TCs |
|---|---|---|---|---|---|---|---|
| FA-01 | Authentication gate: no access without credentials and code (BR-03, BR-06) | 2 | 3 | 6 | P0 | Access control; MFA unobserved | TC-S-35, 42, 43, 45, 48 |
| FA-02 | End-to-end sign in with real SMS code | 3 | 3 | 9 | P0 | Story core outcome; blocked by Q-01/Q-02 | TC-S-60, 61 |
| FA-03 | Credential error and non-enumeration (BR-02) | 2 | 3 | 6 | P0 | Security and observed live | TC-S-08, 13, 15 |
| FA-04 | Sign in enable rule and entry (BR-01, REQ-01) | 1 | 3 | 3 | P0 (smoke floor, from the TC list) | Gate to everything; stable | TC-S-01, 02 |
| FA-05 | Password and secret exposure (BR-09, REQ-13) | 1 | 3 | 3 | P1 (TC-S-33 stays P0 per TC list) | Sensitive data | TC-S-33, 34, 67, 69, 20..23 |
| FA-06 | Lockout and rate limit (BR-11, REQ-14) | 2 | 3 | 6 | P1 in TC list; risk is operational (locking the real account) so it is mocked only | Threshold unknown (Q-07) | TC-S-14, 55, 56 |
| FA-07 | SMS inbox and third-party handling (BR-05, BR-12) | 3 | 2 | 6 | P1 in TC list | Shared number, Cloudflare | TC-S-37..39 |
| FA-08 | Navigation: Forgot password, Create one | 1 | 2 | 2 | P1/P2 per TC list | Observed, stable | TC-S-16..19 |
| FA-09 | Resend, expired, superseded code (REQ-07) | 2 | 2 | 4 | P2 | Unobserved, rules TBC (Q-05, Q-06) | TC-S-47, 52..54, 68 |
| FA-10 | Input robustness and validation | 2 | 2 | 4 | P2 | Rules TBC (Q-08..Q-10) | TC-S-06, 09, 10, 12, 36 |
| FA-11 | Accessibility | 2 | 2 | 4 | P2 | Known F-05, F-06, F-13, F-17 | TC-S-23, 27..32, 51 |
| FA-12 | UI and responsive | 1 | 2 | 2 | P2 | No design reference | TC-S-24..26 |
| FA-13 | Session and edge charters (REQ-16) | 2 | 1 | 2 | P2/P3 | Entirely TBC (Q-14, Q-15) | TC-S-57..59, 62..65 |

The execution priority of each TC is the priority given in the test-case file (11 P0, 19 P1, 29 P2, 10 P3). The table above orders areas; it does not re-prioritise TCs.

Execution order: (1) TC-S-37 first (decides whether inbox-dependent TCs run or are marked blocked); (2) P0 automatable: TC-S-01, 02, 08, 33, 35; (3) P0 mocked: TC-S-42, 43, 45, 48; (4) P1 automatable then mocked; (5) P2; (6) P3 and manual charters; (7) TC-S-60 last, workers 1.

## 7. Test case inventory

Every TC carries `@customer @signin`. Type: F functional, V validation, N negative, NAV navigation, UI, A11Y, SEC security, INT integration, UNIT unit (no browser), E2E, EXP exploratory (manual), SES session. Status counts are checked in section 7.2.

### 7.1 Inventory (TC-S-01..69)

| TC ID | Title | Type | Pri | Tags (plus @customer @signin) | Status | AC trace |
|---|---|---|---|---|---|---|
| TC-S-01 | Sign in button on landing opens the sign-in form | NAV | P0 | @smoke @regression | automatable | AC-01 |
| TC-S-02 | Sign in disabled when both fields empty | V | P0 | @smoke @regression | automatable | AC-21 |
| TC-S-03 | Sign in disabled when only email is filled | V | P1 | @regression | automatable | AC-22 |
| TC-S-04 | Sign in disabled when only password is filled | V | P1 | @regression | automatable | AC-22 |
| TC-S-05 | Sign in enabled when both filled, disabled again when one cleared | V | P1 | @regression | automatable | AC-23 |
| TC-S-06 | Whitespace-only field and enable rule recorded | V | P3 | @regression | automatable | AC-24 |
| TC-S-07 | Enter in email with empty password does not submit | N | P2 | @regression @negative | automatable | (EDGE-21) |
| TC-S-08 | Unknown email shows generic error and stays on login | N | P0 | @smoke @regression @negative | automatable | AC-05 |
| TC-S-09 | Malformed emails are rejected or get the generic error | N | P2 | @regression @negative | automatable | AC-25 |
| TC-S-10 | Password below sign-up policy for unknown email | N | P3 | @regression @negative | automatable | AC-26 |
| TC-S-11 | Form keeps email and stays usable after the error toast dismisses | F | P2 | @regression | automatable | AC-08 |
| TC-S-12 | Very long and unicode passwords give generic error, no server error | N | P2 | @regression @negative | automatable | (EDGE-06, 26) |
| TC-S-13 | Wrong password for registered email shows generic error (mocked) | N | P1 | @regression @negative | mocked | AC-06 |
| TC-S-14 | Wrong password against the REAL account (max 1 attempt per run) | N | P1 | @regression @negative | blocked | AC-06 |
| TC-S-15 | Unknown email and wrong password are indistinguishable | SEC | P1 | @regression @negative | mocked | AC-07 |
| TC-S-16 | Forgot password navigates to reset page without sending a request | NAV | P1 | @smoke @regression | automatable | AC-15 |
| TC-S-17 | Sign in on reset page returns to login with empty fields | NAV | P2 | @regression | automatable | AC-16 |
| TC-S-18 | Reset page with unknown email shows the known enumeration message (recorded) | F | P3 | @regression | automatable | AC-20 |
| TC-S-19 | Create one navigates to create profile without submitting | NAV | P1 | @smoke @regression | automatable | AC-17 |
| TC-S-20 | Password masked and toggle named "Show password" on load | F | P1 | @smoke @regression | automatable | AC-27 |
| TC-S-21 | Show password reveals text and renames toggle | F | P1 | @regression | automatable | AC-28 |
| TC-S-22 | Hide password masks again and keeps value | F | P2 | @regression | automatable | AC-29 |
| TC-S-23 | Toggle works with Space and Enter and keeps focus | A11Y | P2 | @regression @a11y | automatable | AC-30 |
| TC-S-24 | All controls visible at 1280 px without horizontal scroll | UI | P2 | @regression | automatable | AC-31 |
| TC-S-25 | All controls visible at 375 px without horizontal scroll | UI | P2 | @regression @mobile | automatable | AC-31 |
| TC-S-26 | Visual states, spelling and placeholder text review | EXP | P3 | @regression | manual | AC-32 |
| TC-S-27 | Tab order and visible focus | A11Y | P2 | @regression @a11y | automatable | AC-33 |
| TC-S-28 | Enter in the Password field submits the form | A11Y | P1 | @regression @a11y | automatable | AC-34 |
| TC-S-29 | Error toast is exposed as role alert | A11Y | P2 | @regression @a11y | automatable | AC-35 |
| TC-S-30 | axe scan of /login has no new critical violations | A11Y | P2 | @regression @a11y | automatable | AC-36 |
| TC-S-31 | Inputs have accessible names; autocomplete value recorded | A11Y | P2 | @regression @a11y | automatable | AC-37 |
| TC-S-32 | Screen reader walkthrough of sign in and error | A11Y | P2 | @a11y | manual | AC-35 |
| TC-S-33 | No password in URL or history and all requests use HTTPS | SEC | P0 | @regression | automatable | AC-38 |
| TC-S-34 | Password masked in DOM and not echoed in toast or title | SEC | P1 | @regression | automatable | AC-39 |
| TC-S-35 | Unauthenticated direct access to /apply-for-a-loan is refused | SEC | P0 | @regression @negative | automatable | AC-40 |
| TC-S-36 | Injection-like input is handled safely | SEC | P1 | @regression @negative | automatable | AC-42 |
| TC-S-37 | Cloudflare challenge on SMS inbox stops the run as BLOCKED | INT | P1 | @regression | automatable | AC-43 |
| TC-S-38 | Code selection picks newest Alabama Ag Credit message after request time (unit, HTML fixtures) | UNIT | P1 | @regression | automatable | AC-44 |
| TC-S-39 | Selector ignores other senders and older messages, reports no message on timeout (unit) | UNIT | P2 | @regression @negative | automatable | AC-44 |
| TC-S-40 | Identity-provider failure on Sign in shows error and recovers | INT | P2 | @regression @negative | mocked | AC-45 |
| TC-S-41 | Double click on Sign in sends one request | N | P2 | @regression @negative | mocked | AC-45 |
| TC-S-42 | Valid credentials lead to the SMS code step | F | P0 | @regression | mocked | AC-02 |
| TC-S-43 | No access to /apply-for-a-loan before a code is entered | SEC | P0 | @regression @negative | mocked | AC-40 |
| TC-S-44 | Empty code cannot be submitted | V | P2 | @regression @negative | mocked | AC-09 |
| TC-S-45 | Wrong 6-digit code is rejected | N | P0 | @regression @negative | mocked | AC-10 |
| TC-S-46 | Codes of wrong length or format are rejected | V | P2 | @regression @negative | mocked | AC-11 |
| TC-S-47 | Expired code is rejected | N | P2 | @regression @negative | mocked | AC-12 |
| TC-S-48 | Correct code navigates to /apply-for-a-loan | F | P0 | @regression | mocked | AC-04 |
| TC-S-49 | Double click on verify code sends one verification | N | P2 | @regression | mocked | (EDGE-08) |
| TC-S-50 | Pasting a full code into the first box | F | P3 | @regression | mocked | (EDGE-10) |
| TC-S-51 | Code step controls have accessible names | A11Y | P2 | @regression @a11y | mocked | AC-14 |
| TC-S-52 | Resend code requests a new code and shows confirmation | F | P2 | @regression | mocked | AC-18 |
| TC-S-53 | Resend countdown disables the control until it ends | F | P3 | @regression | mocked | AC-19 |
| TC-S-54 | Code from before Resend after a new code was issued | F | P2 | @regression | mocked | AC-13 |
| TC-S-55 | Lockout response is shown after repeated failures (mocked) | SEC | P1 | @regression @negative | mocked | AC-41 |
| TC-S-56 | Lockout on a dedicated lock-test account (manual, after Q-07) | SEC | P2 | @negative | blocked | AC-41 |
| TC-S-57 | Refresh on the code step never signs the user in | SES | P2 | @regression | mocked | AC-47 |
| TC-S-58 | Back then Forward on the code step never signs the user in | SES | P2 | @regression | mocked | AC-47 |
| TC-S-59 | Signed-in user opening /login | SES | P3 | @regression | blocked | AC-46 |
| TC-S-60 | Full sign in with real SMS code reaches /apply-for-a-loan | E2E | P0 | @e2e-full | blocked | AC-02, AC-03, AC-04 |
| TC-S-61 | Manual fallback: sign in with human-read SMS | E2E | P0 | @e2e-full | manual | AC-02, AC-03, AC-04 |
| TC-S-62 | Charter: observe and document the MFA screen | EXP | P2 | @regression | manual | AC-09..AC-19 |
| TC-S-63 | Charter: account with no MFA phone or a different phone | EXP | P3 | @regression @negative | manual | (EDGE-25, BR-03) |
| TC-S-64 | Charter: timeouts and multiple tabs | EXP | P3 | @regression | manual | (EDGE-17, 18) |
| TC-S-65 | Charter: input edge cases on the sign-in form | EXP | P3 | @regression | manual | (EDGE-01, 03, 04, 05, 19, 20, 27) |
| TC-S-66 | Verify code when the identity provider returns 5xx, abort or timeout | INT | P1 | @regression @negative | mocked | AC-45 |
| TC-S-67 | Verification code is not exposed in the URL or requests and travels over HTTPS | SEC | P1 | @regression | mocked | AC-38 |
| TC-S-68 | Already-used code rejected | N | P2 | @regression @negative | mocked | (BR-07, REQ-06) |
| TC-S-69 | Password not persisted in storage, cookies or console | SEC | P1 | @regression | automatable | AC-39 |

AC trace in parentheses = trace is by EDGE or BR because the TC file lists no AC. TC-S-60 and 61 also trace AC-02..04 as shown plus BR-03, 05, 06, 12 and REQ-05/15 (see TC file). Titles are shortened only where the original was long; IDs, tags, status and priority are exactly those of `docs/TEST-CASES-Customer-Signin.md`.

### 7.2 Counts (reconciled with the TC file)

| Status | Count | TCs |
|---|---|---|
| automatable | 35 | 01..12, 16..25, 27..31, 33..39, 69 |
| mocked | 23 | 13, 15, 40..55, 57, 58, 66..68 |
| manual | 7 | 26, 32, 61..65 |
| blocked | 4 | 14, 56, 59, 60 |
| Total | 69 | matches 35 / 23 / 7 / 4 |

By priority: P0 11 (01, 02, 08, 33, 35, 42, 43, 45, 48, 60, 61), P1 19, P2 29, P3 10. Tags: @customer 69, @signin 69, @smoke 6, @regression 65, @negative 23, @a11y 8, @e2e-full 2, @mobile 1.

### 7.3 Suites

| Suite | Selection | TCs | Notes |
|---|---|---|---|
| Smoke | `--grep "@signin.*@smoke"` or tag `@smoke` | TC-S-01, 02, 08, 16, 19, 20 | 6 TCs, all automatable, no third party, no account, mocks not needed |
| Regression | `@regression` | all except TC-S-32, 56, 60, 61 (65 TCs, including TC-S-66..69); blocked ones (14, 59) are listed and skipped with reason, manual ones (26, 62..65) are executed by a human | mocked and automatable run in `customer-chromium` |
| E2E full | `@e2e-full` | TC-S-60 (blocked), TC-S-61 (manual) | `customer-e2e`, workers 1, retries 0, no `--repeat-each` |
| Mobile | `@mobile` | TC-S-25 | `customer-mobile` (Pixel 5) |
| A11y | `@a11y` | TC-S-23, 27, 28, 29, 30, 31, 32 (manual), 51 (mocked) | automated: 23, 27..31; 51 needs Q-03 |

## 8. Entry criteria
- `CUSTOMER_BASE_URL` reachable; `/login` returns 200 and renders the "Email address" textbox.
- `.env` keys present for the TC set being run: automatable and mocked sets need only `CUSTOMER_BASE_URL`; TC-S-37 additionally `SMS_INBOX_URL`; TC-S-14, 60, 61 additionally `CUSTOMER_EMAIL`, `CUSTOMER_PASSWORD`.
- Smoke suite (6 TCs) passes on the build before regression starts.
- Existing Lender and Create Customer Profile suites green as baseline (same pass count recorded).
- Playwright and Chromium installed; sign-in page objects and mock helpers merged.
- For mocked MFA TCs (42..54, 57, 58, 66..68): PC-5 mock set and shapes reviewed; each labelled [TBC Q-03] until observation.
- For TC-S-14, 59, 60: Q-01 answered and a smoke sign-in of the real account reaches the code step (not `user_not_found`). For TC-S-60 also Q-02 answered and TC-S-37 reports no challenge. Otherwise these stay blocked with recorded reason.
- For TC-S-56: Q-07 answered and a dedicated lock-test account provided.

## 9. Exit criteria
- 100 percent of P0 TCs that are automatable or mocked executed and passing: TC-S-01, 02, 08, 33, 35, 42, 43, 45, 48 (9 TCs).
- 100 percent of P1 automatable and mocked TCs executed; at least 95 percent passing; failures have a defect.
- P0 TC-S-60 passed at least once on the current build, or recorded blocked with reason (Q-01, Q-02) and TC-S-61 executed by a human with recorded code timestamp and result.
- Every blocked TC (14, 56, 59, 60) recorded with its blocking Q- ID; every manual TC (26, 32, 61..65) has an execution record.
- No open Critical or High defects. Known defects F-05, F-06, F-09, F-10, F-13, F-17 are referenced, not re-raised.
- Smoke green on 3 consecutive runs; zero reliance on the real SMS inbox or the real account in smoke and mocked regression.
- Every "record behaviour" TC (06, 09, 10, 46, 50, 54, 57, 58, 59) has the observed behaviour written back to its Q- item.
- Requirements clarity is 31 percent (AC doc). Release sign-off on sign-in is not claimed for REQ-04, 06, 07, 14, 16 until Q-03, Q-05, Q-06, Q-07, Q-14, Q-15 are answered; the plan reports this as residual risk.
- Lender and Create Profile results unchanged; HTML report archived under `reports/`.

## 10. Suspension and resumption criteria

| Condition | Action (suspend) | Resume when |
|---|---|---|
| Cloudflare challenge on `SMS_INBOX_URL` (B2) | Stop inbox-dependent TCs immediately with "BLOCKED: SMS inbox behind Cloudflare challenge (B2)"; mark TC-S-60 blocked, not failed; no solve or evade attempt | Q-02 gives an allowed route, or a human runs TC-S-61 |
| `user_not_found` for `CUSTOMER_EMAIL` | Mark TC-S-14, 59, 60 blocked (Q-01); do not retry sign-in | Account confirmed created and MFA-registered |
| Account lockout or throttle message seen on any real account | Stop all real-account TCs; no further attempts; notify owner | Owner confirms unlock and Q-07 answered |
| Real-account wrong-password daily budget used (1 wrong attempt per day across TC-S-14, TC-S-56 and any manual session, until Q-07 is known) | Suspend every further wrong-password attempt on real accounts for the rest of the day; TC-S-14 recorded as not run with reason; TC-S-56 only on a dedicated account | Next day, or Q-07 gives a threshold that allows more |
| Identity provider outage (5xx or timeouts on unmocked calls, TC-S-08 unexpectedly returns server error) | Stop unmocked TCs; mocked TCs may continue; record time | Two consecutive TC-S-08 runs return the generic error |
| Smoke fails | Stop regression | Smoke passes after fix |
| A blocker stops more than 20 percent of the planned TCs of the run | Suspend and escalate | Blocker cleared |
| Code selector (TC-S-38/39) fails | Do not run TC-S-60 | Unit tests pass |
| `.env` key missing for a set | Skip that set with reason | Key present |

## 11. Risks and mitigations

| ID | Risk | L | I | Mitigation |
|---|---|---|---|---|
| R-S-01 | Account missing (`user_not_found`, Q-01); happy path unprovable | High | High | Mark TC-S-14, 59, 60 blocked; mocked TC-S-42..54 cover the UI; human fallback TC-S-61 once account exists |
| R-S-02 | SMS inbox behind Cloudflare (B2, Q-02) | High | High | Detect via existing `assertNotBlocked`; BLOCKED report; no bypass; allowed route requested via Q-02 |
| R-S-03 | MFA screen unobserved; mock shapes and labels wrong (Q-03) | High | High | TC-S-62 charter first after account exists; locators role/label first; fixtures in one file; TC-S-60 as contract check |
| R-S-04 | Real account lockout (BR-11, Q-07) | Medium | High | Daily budget: at most 1 wrong attempt per day across TC-S-14, TC-S-56 and any manual session until Q-07 is known; TC-S-56 only on a dedicated account; TC-S-65 uses unknown synthetic emails only; lockout only mocked or on dedicated account; no loops, retries 0 for real-account TCs |
| R-S-05 | Shared number: stale or foreign message, parallel runs (EDGE-13, 14, 23) | High | High | Only newest "Alabama Ag Credit" message after `requestedAt`; unit tests TC-S-38/39; workers 1 for `@e2e-full` |
| R-S-06 | Toast auto-dismisses (F-05); assertion flakes | High | Medium | Wait on the server response, then assert role `alert` immediately |
| R-S-07 | Unknown client validation rules (Q-08, Q-09, Q-10): tests assert recorded behaviour, weak oracles | Medium | Medium | Record-only TCs; update after Q- answers |
| R-S-08 | Entra rate limit on repeated unknown-email attempts (EDGE-28) | Medium | Medium | Keep workers modest, one submit per test, no repeat-each; stop on throttle message |
| R-S-09 | Mocked responses drift from the real API | Medium | Medium | Single fixture file; refresh after TC-S-62 and TC-S-60 |
| R-S-10 | Secrets in traces, videos, logs | Low | High | `video: 'off'` and no trace for TCs typing real secrets; never log env values; mocked TCs use only TD-S literals |
| R-S-11 | Duplicate coverage with existing `customer.login-navigation`, `customer.a11y`, `customer.mobile` specs (not inspected in detail) | Medium | Low | Before writing, diff against those specs; reuse or tag, do not duplicate |
| R-S-12 | Low requirements clarity (31 percent) | High | Medium | Skeletal TCs flagged; revisit after Q-03..Q-15 |
| R-S-13 | Config or fixture change affects other suites | Low | High | Additive files only; run Lender and Create Profile baseline after merge |

## 12. Blockers and dependencies

| ID | Item | Blocks | Owner (per AC doc) |
|---|---|---|---|
| Q-01 | Account behind `CUSTOMER_EMAIL` does not exist (creation blocked by B1/B2) | TC-S-14, 59, 60, 61, 62, 63, 64 | Product owner / Dev |
| Q-02 / B2 | Cloudflare on receive-smss.com | TC-S-60 (automation); TC-S-61 needs a human to pass it | Dev / DevOps |
| Q-03 | MFA labels, states, response shapes | Finalising TC-S-42..54, 57, 58, 66..68 | QA after Q-01 |
| Q-07 | Lockout threshold, duration, message; dedicated account | TC-S-55 (values), TC-S-56 | Dev / Security |
| Q-04 | No-MFA or different-phone account | TC-S-63 | Product owner |
| Q-05, Q-06 | Code validity and Resend invalidation | TC-S-47, 54 oracle | Dev / Product owner |
| Q-08, Q-09, Q-10, Q-11 | Email validation, whitespace, password policy, autocomplete | TC-S-06, 09, 10, 31, 65 oracles | QA / Dev / Product owner |
| Q-12, Q-14, Q-15, Q-16 | Unauthenticated redirect, signed-in `/login`, refresh/Back, forgot-password message | TC-S-35, 59, 57, 58, 18 oracles | Dev / Product owner |
| Q-13 | Poll timeout for the SMS message | TC-S-39, 60 | QA / Product owner |
| B1 | yopmail Turnstile (account creation) | Indirect, via Q-01 | Dev |

Dependency on existing code (verified present): `pages/customer/CustomerLoginPage.ts`, `CustomerForgotPasswordPage.ts`, `CustomerLandingPage.ts`, `ApplyForLoanPage.ts`, `Toast.ts`, `fixtures/customer.fixture.ts`, `utils/ciamMocks.ts`, `utils/thirdPartyGuard.ts`, `pages/third-party/ReceiveSmsInboxPage.ts`, `test-data/customer.data.ts`, `config/env.ts` getters. Not present: `SignInMfaPage`, a pure code-selection module (no `codeParser`), sign-in mock helpers.

## 13. Proposed additive folder layout and tag usage

Existing files are not edited except where marked "append only".

```
AgriNext_AI_TWAutomation/
├── pages/customer/
│   ├── CustomerLoginPage.ts          # EXISTING: reuse; append helper methods only if needed
│   ├── CustomerForgotPasswordPage.ts # EXISTING: reuse
│   └── SignInMfaPage.ts              # NEW: code boxes, "verify code", Resend (labels [TBC Q-03])
├── tests/customer/
│   ├── signin.entry-validation.spec.ts    # TC-S-01..07
│   ├── signin.credentials.spec.ts         # TC-S-08..15 (14 skipped/blocked)
│   ├── signin.navigation-showhide.spec.ts # TC-S-16..23   (check overlap with customer.login-navigation.spec.ts)
│   ├── signin.ui-a11y.spec.ts             # TC-S-24, 25, 27..31, 51
│   ├── signin.security.spec.ts            # TC-S-33..36, 43, 55, 69
│   ├── signin.third-party.spec.ts         # TC-S-37
│   ├── signin.mfa.spec.ts                 # TC-S-40..42, 44..54, 57, 58, 66..68
│   ├── signin.e2e-full.spec.ts            # TC-S-60 (guards repeatEachIndex, skips with BLOCKED reason)
│   └── unit/smsCodeSelector.spec.ts       # TC-S-38, 39
├── utils/
│   ├── ciamSignInMocks.ts            # NEW (do not edit ciamMocks.ts): valid-creds, wrong-password, invalid/expired code, resend, lockout, 5xx/abort/delay
│   └── smsCodeSelector.ts            # NEW: pure functions (newest "Alabama Ag Credit" after requestedAt), used by ReceiveSmsInboxPage callers
├── test-data/
│   └── signin.data.ts                # NEW: TD-S-01..13 (non-secret only)
├── fixtures/
│   └── signin.fixture.ts             # NEW: extends customer.fixture with SignInMfaPage and mock helpers
└── docs/
```

TC-S-26, 32, 56, 59, 61..65 have no spec file (manual or blocked); record them in the execution log. TC-S-14 lives in `signin.credentials.spec.ts` as `test.skip` with reason "blocked: Q-01", guarded by presence of env keys and a single attempt.

Config and tags:
- No new Playwright project and no new config file; the existing `customer-chromium`, `customer-mobile`, `customer-e2e` collect `tests/customer`. Select sign-in with `--grep @signin`.
- Tags per TC exactly as in section 7.1: `@customer @signin` on all, plus `@smoke`, `@regression`, `@negative`, `@a11y`, `@mobile`, `@e2e-full` as listed. Do not add new tags.
- `package.json` scripts (append only): `test:signin` (`--grep @signin` on customer projects), `test:signin:smoke` (`--grep "@signin.*@smoke"`). The existing `test:customer:e2e` gating (opt-in env flag in `package.json`) is reused for TC-S-60.
- Mock registration order: catch-all abort on `**/ciam-native-auth/**` and `**/oauth2/v2.0/token` first, specific routes after (last registered wins).
- Third-party pages open in `context.newPage()` of the same context; `assertNotBlocked(page, 'receive-smss')` runs before any read; `ThirdPartyBlockedError` maps to a BLOCKED skip, not a failure.

## 14. Execution and reporting
- Smoke on every commit and deploy: 6 TCs (TC-S-01, 02, 08, 16, 19, 20), no third party, no account.
- Regression nightly: automatable plus mocked sets, `customer-chromium` (workers as configured) and `customer-mobile`. Inbox and real account never touched.
- `@e2e-full` (TC-S-60): manually triggered, workers 1, retries 0, no `--repeat-each`, serialised against any other use of the shared number. If Cloudflare appears or `user_not_found` is returned, the result is reported as BLOCKED with reason, not as a failure.
- Real account: at most 1 wrong-password attempt per day across TC-S-14, TC-S-56 and any manual session, until Q-07 is known (TC-S-56 only on a dedicated account). Lockout TCs mocked, or dedicated account only after Q-07.
- Manual TCs (26, 32, 61..65) logged in the execution record with tester, build, timestamp, result; TC-S-61 records the code timestamp and pass/fail, never the code or secrets.
- Report: Playwright HTML under `reports/`, summary by status (automatable / mocked / manual / blocked), by priority, blocked list with Q- ID, defects with F-xx cross-reference. Never print env values.
- Estimates: not provided. No historical metrics for this module and low clarity (31 percent); an estimate would not be evidence-based.
