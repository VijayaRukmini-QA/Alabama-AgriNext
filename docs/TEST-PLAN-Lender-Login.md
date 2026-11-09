# Test Plan: AgriNext Lender Portal Login

Runner: Playwright Test 1.65 (TypeScript, Page Object Model) | App: https://alabama-dev-lender.agrinextcloud.ai/ (dev) | Date: 2026-11-06

Legend: **[O]** = observed on the live page, **[I]** = inferred (not verified live).

---

## 0. Key finding from exploration

The Lender portal has no login form of its own. Opening the base URL redirects (MSAL.js, OIDC auth-code + PKCE) to **Microsoft Entra ID** (`login.microsoftonline.com/<tenant>/oauth2/v2.0/authorize`, redirect_uri = base URL). The "login page" under test is therefore a Microsoft-hosted, two-step, tenant-branded page. [O]

Observed flow:
1. Step 1, "Sign in": email field + `Next`. [O]
2. Step 2, "Enter password": password field + `Sign in`. [O]
3. After success, Entra may show "Stay signed in?" (Yes/No) and may require MFA. [I, not reached]
4. Redirect back to the lender app. [I, not reached]

Consequences for automation:
- Microsoft owns the markup and wording, so assertions must be tolerant (role/label based, regex on messages) and kept few.
- Format validation, lockout and throttling are enforced by Entra, not by AgriNext. Many "login validation" checks are really smoke checks of the IdP integration.
- If MFA or Conditional Access applies to the test account, UI login cannot be fully automated (see Risks R-02).

**Credential issue found:** the `LENDER_PASSWORD` in `.env` is rejected by Entra ("Your account or password is incorrect."). The value is stored unquoted and contains a `#` character. `dotenv` treats an unquoted `#` as the start of a comment, so the loaded value is truncated (13 characters loaded). **Fix: wrap the value in double quotes in `.env`.** This consumed 1 wrong-password attempt against the real account during exploration. No further attempts were made. Re-verify once, manually, after the fix.

---

## 1. User story and acceptance criteria

### User story
As a **lender user** of AgriNext, I want to **sign in securely with my organisation email and password**, so that I can **access the Lender portal and manage my lending data**, and be told clearly when my credentials are wrong or missing.

### Acceptance criteria

| ID | Category | Acceptance criterion | Basis |
|---|---|---|---|
| AC-01 | Functional | Navigating to the base URL while signed out redirects to the Microsoft sign-in page (heading "Sign in"). | [O] |
| AC-02 | Functional | A valid email followed by `Next` advances to the "Enter password" step, showing the entered email and a `Back` button. | [O] |
| AC-03 | Functional | A valid email and valid password complete sign-in and return the user to the Lender app (URL on `alabama-dev-lender.agrinextcloud.ai`, not on `login.microsoftonline.com`). The "Stay signed in?" prompt, if shown, is handled. | [I] |
| AC-04 | Functional | After sign-in, the user can sign out and is returned to a signed-out state. Protected pages are no longer reachable without signing in again. | [I], logout UI not observed |
| AC-05 | Validation | Submitting an empty email shows "Enter a valid email address, phone number, or Skype name." and stays on step 1. | [O] |
| AC-06 | Validation | Submitting an email with no matching account (including malformed text such as `notanemail`) shows "We couldn't find an account with that username." and stays on step 1. Note: Entra does not give a separate "invalid format" message for this input. | [O] |
| AC-07 | Validation | Submitting an empty password on step 2 shows a "password required" message and does not sign in. | [I], wording not observed |
| AC-08 | Validation | A correct email with a wrong password shows "Your account or password is incorrect." with a "reset it now" link, and keeps the user on step 2. | [O] |
| AC-09 | Functional | The error message does not reveal whether the account exists in the password step (generic wording). Step 1 does reveal non-existence (Entra behaviour). | [O] (step 2), [O] (step 1) |
| AC-10 | Functional | `Back` on step 2 returns to step 1. | [O] element, [I] behaviour |
| AC-11 | Functional | A "Forgot my password" link is present on step 2 and navigates to the Microsoft password reset page (`passwordreset.microsoftonline.com`). | [O] |
| AC-12 | Functional | A "Can't access your account?" link is present on step 1. | [O] |
| AC-13 | UI | Step 1 shows: logo/branding images, heading "Sign in", an email textbox (placeholder "Email, phone, or Skype"), "Can't access your account?" link, `Next` button, `Sign-in options` button, and footer links "Terms of use" and "Privacy & cookies". | [O] |
| AC-14 | UI | Step 2 shows: `Back`, the user's email, heading "Enter password", a password textbox (placeholder "Password"), "Forgot my password" link and `Sign in` button. | [O] |
| AC-15 | UI | The password field masks input (`type=password`). | [O] |
| AC-16 | UI | A password show/hide toggle is available. **Not present** in headless Chromium on this tenant. This AC is recorded as not applicable unless a toggle appears (the native browser reveal icon is outside the DOM). | [O] absence |
| AC-17 | Accessibility | Email field has an accessible name ("Enter your email, phone, or Skype."). Password field has an accessible name ("Enter the password for <email>"). Buttons and links have accessible names. | [O] |
| AC-18 | Accessibility | Logical Tab order: email, then "Can't access your account?", then `Next` (step 1). On step 2: password, then "Forgot my password", then `Sign in` (`Back` earlier). | [I] |
| AC-19 | Accessibility | Pressing Enter in the email field triggers `Next`, and Enter in the password field triggers `Sign in`. | [I] |
| AC-20 | Accessibility | Validation errors are exposed in an `alert` role region (live region), so screen readers announce them. | [O] (alert region present) |
| AC-21 | Security | Password is never shown in the URL, and the sign-in page is served over HTTPS. | [O] HTTPS, [I] no password in URL |
| AC-22 | Functional | Pressing browser Back/Refresh on the sign-in page does not break the flow (page reloads to step 1 or the same step without an error page). | [I] |

---

## 2. Analysis

### Positive
- Valid email, then valid password, lands in the Lender app (AC-03).
- Enter key submits on both steps (AC-19).
- `Back` returns to email step (AC-10).
- Forgot-password and account-access links navigate correctly (AC-11, AC-12).
- Sign out works (AC-04).

### Negative
- Empty email (AC-05).
- Non-existent synthetic email (AC-06), run many times safely because no real account is affected.
- Malformed email string (AC-06).
- Empty password (AC-07).
- Real email with one wrong password (AC-08), limited to 1 attempt per run.
- Unauthenticated deep link to a protected page redirects to sign-in (AC-01).

### Boundary
- Email with leading/trailing whitespace (valid email wrapped in spaces): Entra normally trims. [I]
- Email in different case (UPPERCASE) should still be accepted. [I]
- Very long email (about 300 characters) is rejected without a crash. [I]
- Special characters, unicode and an SQL/script-like string in the email field are handled as plain "account not found". [I]
- Password at 1 character (wrong) and over 256 characters: rejected, no crash. Use only with the synthetic email (step 2 is not reachable for a non-existent email, so password boundaries are limited to the real account and are therefore NOT automated, to protect against lockout).

### Exploratory charters
1. Session: refresh, back/forward and multi-tab during step 2, and whether state is retained.
2. Session: sign in, close the tab, reopen the base URL (SSO silent sign-in), and token expiry behaviour.
3. Keyboard-only and screen-reader pass over both steps (zoom 200 percent, high contrast).
4. Responsive: mobile viewport (375 px) rendering of both steps.
5. Error recovery: error shown, then correct the value, and confirm the error clears.
6. "Sign-in options" and "Can't access your account?" paths (only observe, do not complete).
7. Cross-browser (Firefox, WebKit): wording and layout differences on Microsoft's page.

---

## 3. Test plan

### 3.1 Objectives
- Verify a lender can sign in and out through the Entra-backed login with valid credentials.
- Verify error and validation behaviour for missing and invalid input, using safe test data.
- Verify the required UI elements and basic accessibility (labels, Tab order, Enter-to-submit).
- Build a fast, stable smoke and regression suite, safe to run repeatedly against dev without locking the account.

### 3.2 Scope

| In scope | Out of scope |
|---|---|
| Redirect from app to Entra sign-in | Entra's internal security (brute-force algorithms, smart lockout tuning) |
| Email step and password step UI and validation | Completing password reset, "Can't access your account?" and "Sign-in options" flows |
| Valid login, invalid login, empty fields | MFA enrolment and challenge flows (unless a dedicated MFA-exempt test account is provided) |
| Forgot-password link navigation (link only) | Post-login application features (dashboard, loans, etc.) beyond landing check |
| Logout (if available in app header) | Performance and load testing |
| Basic accessibility (names, Tab order, Enter) | Full WCAG audit (separate effort, optional axe scan) |
| Chromium primary, Firefox/WebKit smoke | Production environment |

### 3.3 Environment
- Dev: `https://alabama-dev-lender.agrinextcloud.ai/` (from `BASE_URL`).
- Identity provider: Microsoft Entra ID, tenant `d5cfed24-0813-47c8-944a-5d9b66994662`.
- Browsers: Chromium (primary), Firefox and WebKit (smoke only). Viewports: desktop 1280x720, mobile 375x667 for UI checks.
- Runner: Playwright Test 1.65, Node, TypeScript, `dotenv`.
- Network access to `login.microsoftonline.com` is required.

### 3.4 Test data

| Data | Source | Notes |
|---|---|---|
| Valid email | `LENDER_EMAIL` (`.env`) | Never printed or logged. |
| Valid password | `LENDER_PASSWORD` (`.env`) | **Must be double-quoted in `.env`** because it contains `#`. Never printed, logged, committed, or written to docs or reports. Mask in traces (avoid `fill` values in debug logs). |
| Non-existent email | Synthetic, generated: `qa.nouser.<timestamp>@example.invalid` | Safe for unlimited repeat runs. |
| Malformed email | Literal: `notanemail`, `user@`, `@domain.com`, `a b@c.com` | Entra returns "couldn't find" for these. |
| Wrong password | Synthetic literal: `Wrong#Pass-<random>` | Used against the real account at most once per run (TC-07). |
| Empty values | `''` | |
| Long/special input | Generated (300 chars, `<script>`, `' OR 1=1 --`) | Synthetic email field only. |

`.env` keys: `BASE_URL`, `LENDER_EMAIL`, `LENDER_PASSWORD`. Add `.env` to `.gitignore` (no git yet, but do so on init). Provide `.env.example` with placeholders only.

### 3.5 Entry criteria
- Dev site reachable and redirecting to Entra.
- `.env` populated and the password quoted. The valid credentials verified by one manual sign-in.
- Test account active, not locked, and exempt from MFA (or an MFA strategy agreed).
- `npm install` done, Chromium installed (`npx playwright install`).

### 3.6 Exit criteria
- 100 percent of P1 test cases executed, with 100 percent pass.
- At least 95 percent of all P1+P2 test cases pass. No open Critical or High defects.
- Smoke suite is green on 3 consecutive runs (no flakiness).
- Skipped tests are documented with a reason (for example show/hide not present, logout not found).
- Execution report (HTML) archived in `reports/`.

### 3.7 Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | **Account lockout** (Entra smart lockout) from repeated invalid logins on the real account | Medium | High: blocks every test | Use synthetic non-existent emails for all invalid-input tests. Limit wrong-password attempts against the real account to **1 per run**, in a single serial test, run only in regression (not smoke). Never retry it (`retries: 0` for that test). Do not run it in parallel workers or on CI re-runs. |
| R-02 | MFA / Conditional Access / "Stay signed in" prompts interrupt automated login | Medium | High | Request an MFA-exempt test account, or reuse `storageState` from one manual sign-in. Handle the KMSI prompt conditionally. |
| R-03 | Microsoft changes markup or wording | Medium | Medium | Use role/label locators, regex for messages, isolate in `LoginPage`. |
| R-04 | `.env` password truncated by `#` (already observed) | Confirmed | High | Quote the value. Add a pre-flight check that fails fast if the password is empty, without printing it. |
| R-05 | Bot detection or throttling of rapid IdP requests | Low | Medium | Run serially for login specs (`workers: 1` for this project), reuse the session for non-login tests. |
| R-06 | Logout control not discoverable, so AC-04 cannot be asserted | Medium | Low | Explore post-login once; skip with a reason if absent. |
| R-07 | Show/hide toggle and wording (empty password) differ from assumption | High | Low | Conditional test, marked as inferred. |
| R-08 | Credentials leaking via traces, videos, or logs | Low | High | Do not record video for the valid-login test, mask values, and keep `.env` out of artefacts. |
| R-09 | Shared dev environment downtime | Low | Medium | Pre-flight reachability check. |

---

## 4. Test cases

Priority: P1 critical, P2 high, P3 medium. Every tag list also includes `@login`. Conventions: "Email step" means step 1 of Entra, "Password step" means step 2. Preconditions for all: fresh browser context, no stored session, unless stated.

| ID | Title | AC | Type | Pri | Tags | Steps | Expected results |
|---|---|---|---|---|---|---|---|
| TC-01 | Unauthenticated visit redirects to sign-in | AC-01, AC-21 | functional | P1 | @smoke @login | 1. Open `BASE_URL`. 2. Wait for the URL to settle. | 1. URL host is `login.microsoftonline.com`, protocol HTTPS. 2. Heading "Sign in" is visible. |
| TC-02 | Valid login lands in the Lender app | AC-02, AC-03 | functional | P1 | @smoke @login | 1. Open `BASE_URL`. 2. Fill the email textbox with `LENDER_EMAIL`. 3. Click `Next`. 4. Verify heading "Enter password". 5. Fill the password textbox with `LENDER_PASSWORD`. 6. Click `Sign in`. 7. If "Stay signed in?" appears, click `No` (or `Yes`). 8. Wait for redirect. | 1. After step 3, password step shows with the email displayed and `Back` visible. 2. After step 8 the URL host is `alabama-dev-lender.agrinextcloud.ai`. 3. No Entra error alert. 4. An authenticated landing element (to be confirmed, for example user menu) is visible. |
| TC-03 | Empty email shows required message | AC-05 | validation | P1 | @smoke @regression @login | 1. Open `BASE_URL`. 2. Leave email empty. 3. Click `Next`. | 1. Alert text matches `/Enter a valid email address, phone number, or Skype name/`. 2. Still on "Sign in" step. 3. Password step not shown. |
| TC-04 | Non-existent email is rejected | AC-06 | negative | P1 | @smoke @regression @login | 1. Open `BASE_URL`. 2. Fill email with synthetic `qa.nouser.<ts>@example.invalid`. 3. Click `Next`. | 1. Alert matches `/We couldn't find an account with that username/`. 2. Still on "Sign in" step. |
| TC-05 | Malformed email strings are rejected (data-driven) | AC-06 | validation | P2 | @regression @login | For each of `notanemail`, `user@`, `@domain.com`, `a b@c.com`: 1. Open `BASE_URL`. 2. Fill the value. 3. Click `Next`. | For each: an error alert appears (either the "couldn't find" or "valid email" wording), and the password step is never shown. |
| TC-06 | Empty password is rejected | AC-07 | validation | P1 | @regression @login | 1. Open `BASE_URL`. 2. Enter `LENDER_EMAIL`, click `Next`. 3. Leave password empty. 4. Click `Sign in`. | 1. An alert appears with a "password required" style message (match `/password/i`). 2. Still on "Enter password". 3. No navigation to the app. **Note:** empty submit is not counted as a failed attempt by Entra in practice [I], so this is run once per run. |
| TC-07 | Wrong password for the real account is rejected (max 1 attempt) | AC-08, AC-09 | negative | P1 | @regression @login | Run serially, no retries. 1. Open `BASE_URL`. 2. Enter `LENDER_EMAIL`, click `Next`. 3. Fill password with synthetic `Wrong#Pass-<random>`. 4. Click `Sign in`. | 1. Alert matches `/Your account or password is incorrect/`. 2. A "reset it now" link is shown. 3. Still on "Enter password". 4. Email remains displayed. 5. Exactly one wrong attempt made. |
| TC-08 | Password input is masked | AC-15 | UI | P2 | @regression @login | 1. Get to the password step with `LENDER_EMAIL`. 2. Type any text into the password field. 3. Read the field `type` attribute. | 1. `type` is `password`. 2. Value is not displayed as plain text. |
| TC-09 | Password show/hide toggle (conditional) | AC-16 | UI | P3 | @regression @login | 1. Get to the password step. 2. Look for a control named `/show password/i` or `/reveal/i`. 3. If present: type text, click it, check `type`, click again, check `type`. 4. If absent: mark test skipped. | If present: type switches `password` to `text` and back. If absent (current observed state): test is **skipped** with reason "no toggle in Entra page on this tenant". |
| TC-10 | Forgot my password link navigates to reset | AC-11 | functional | P2 | @regression @login | 1. Get to the password step with `LENDER_EMAIL`. 2. Verify link "Forgot my password" is visible. 3. Click it. | 1. Link has an `href` to `passwordreset.microsoftonline.com`. 2. After click, URL host is `passwordreset.microsoftonline.com` (or opens a reset page). 3. No reset is submitted. |
| TC-11 | "Can't access your account?" link present on email step | AC-12 | functional | P3 | @regression @login | 1. Open `BASE_URL`. 2. Locate link "Can't access your account?". | 1. Link visible and enabled. (Do not complete the recovery flow.) |
| TC-12 | Back button returns to the email step | AC-10 | functional | P2 | @regression @login | 1. Get to the password step. 2. Click `Back`. | 1. Heading "Sign in" is visible. 2. Email field is visible and enabled. |
| TC-13 | Email step UI elements are present | AC-13, AC-17 | UI | P1 | @smoke @regression @login | 1. Open `BASE_URL`. 2. Check each element. | Visible: heading "Sign in"; textbox named "Enter your email, phone, or Skype." with placeholder "Email, phone, or Skype"; link "Can't access your account?"; button `Next`; button `Sign-in options`; links "Terms of use", "Privacy & cookies"; branding images (logo/background). |
| TC-14 | Password step UI elements are present | AC-14, AC-17 | UI | P2 | @regression @login | 1. Get to the password step with `LENDER_EMAIL`. 2. Check each element. | Visible: button `Back`; the entered email text; heading "Enter password"; textbox with placeholder "Password" and name containing "Enter the password for"; link "Forgot my password"; button `Sign in`. |
| TC-15 | Form fields have accessible names | AC-17 | a11y | P1 | @smoke @regression @login | 1. Open `BASE_URL`. 2. Query `getByRole('textbox')` and `getByRole('button')` for names. 3. Repeat on the password step. | Every textbox, button and link exposes a non-empty accessible name. Email textbox is resolved by its label. Password textbox is resolved by `/password/i`. |
| TC-16 | Keyboard Tab order on the email step | AC-18 | a11y | P2 | @regression @login | 1. Open `BASE_URL`. 2. Click inside the email field (or focus it). 3. Press Tab, note the focused element. 4. Press Tab again. | 1. Focus order is email, then "Can't access your account?", then `Next` (then `Sign-in options`). 2. Each focused element shows a visible focus indicator. |
| TC-17 | Keyboard Tab order on the password step | AC-18 | a11y | P2 | @regression @login | 1. Get to the password step. 2. Focus the password field. 3. Press Tab twice, noting focus. | Focus goes password, then "Forgot my password", then `Sign in`. No focus trap. |
| TC-18 | Enter key submits the email step | AC-19 | a11y | P1 | @smoke @regression @login | 1. Open `BASE_URL`. 2. Fill `LENDER_EMAIL`. 3. Press Enter (no click). | Password step ("Enter password") is shown. |
| TC-19 | Enter key submits the password step (valid) | AC-19, AC-03 | a11y | P2 | @regression @login | 1. Get to the password step. 2. Fill `LENDER_PASSWORD`. 3. Press Enter. 4. Handle "Stay signed in?" if shown. | User lands on the Lender app (URL host `alabama-dev-lender.agrinextcloud.ai`). Combine with TC-02 if desired to limit sign-ins. |
| TC-20 | Validation errors are announced via alert region | AC-20 | a11y | P3 | @regression @login | 1. Open `BASE_URL`. 2. Click `Next` with empty email. 3. Inspect the `alert` role element. | 1. An element with `role=alert` contains the error text. |
| TC-21 | Error clears after correcting the email | AC-05, AC-06 | functional | P3 | @regression @login | 1. Open `BASE_URL`. 2. Submit an empty email (error shown). 3. Fill the synthetic email and click `Next` (new error) or `LENDER_EMAIL` and click `Next`. | 1. Previous empty-email message is replaced or removed. 2. With `LENDER_EMAIL` the password step is shown. |
| TC-22 | Boundary: email with surrounding spaces and uppercase | AC-02 | functional | P3 | @regression @login | 1. Open `BASE_URL`. 2. Fill `"  " + LENDER_EMAIL.toUpperCase() + "  "`. 3. Click `Next`. | The password step is shown (email normalised). If not, log as an observation (Entra behaviour), not a product defect. |
| TC-23 | Boundary: very long and special-character email | AC-06 | negative | P3 | @regression @login | For each: 300-character local part; `<script>alert(1)</script>@x.com`; `' OR 1=1 --`. 1. Open `BASE_URL`. 2. Fill the value. 3. Click `Next`. | Error alert shown, no script execution, no unhandled error page, password step not shown. |
| TC-24 | Logout returns to signed-out state | AC-04 | functional | P1 | @regression @login | Precondition: signed in (reuse `storageState`). 1. Open the app. 2. Open the user/profile menu. 3. Click Sign out / Log out. 4. Confirm any Microsoft "pick an account" step if shown. 5. Open `BASE_URL` again. | 1. Sign-out control exists (if not found, test skipped and a gap logged). 2. After logout, opening the app redirects to the Entra sign-in page. |
| TC-25 | Protected deep link requires authentication | AC-01 | functional | P2 | @regression @login | 1. With no session, open `BASE_URL` + a sub-path (for example `/dashboard`, confirm real route during exploration). | Redirect to Entra sign-in. App content is not shown. |
| TC-26 | Responsive: email step renders on mobile | AC-13 | UI | P3 | @regression @login | 1. Set viewport 375x667. 2. Open `BASE_URL`. 3. Check email field, `Next`, and footer links. | All key controls visible without horizontal scroll. |
| TC-27 | Refresh on the password step does not break the flow | AC-22 | functional | P3 | @regression @login | 1. Get to the password step. 2. Reload the page. | Page loads to a valid sign-in step (email or password step), with no error page. |

**Total: 27 test cases** (TC-01 to TC-27).

Type mix: functional 10, negative 3, validation 3, UI 5, a11y 6 (approximately, with TC-19 and TC-21 counted by primary intent).

Automation notes:
- Pre-flight in global setup: fail fast if `LENDER_EMAIL` or `LENDER_PASSWORD` is empty or the password is shorter than expected (never print it).
- TC-02 can produce a reusable `storageState` (`test-data/.auth/lender.json`, git-ignored) so TC-19 and TC-24 do not need to sign in again, and so sign-ins per run are minimised.
- TC-07 and TC-06 are the only tests that touch the real account with a failing credential. Mark TC-07 with `test.describe.configure({ mode: 'serial', retries: 0 })`.

---

## 5. Regression suite definition

| Suite | Tag | Test cases | Purpose | When |
|---|---|---|---|---|
| Smoke | `@smoke @login` | TC-01, TC-02, TC-03, TC-04, TC-13, TC-15, TC-18 | Fast check that the IdP redirect, valid login, core validation, UI and Enter-to-submit work (7 TCs, under about 2 minutes) | Every commit and deploy |
| Regression | `@regression @login` | TC-03 to TC-27 (all except TC-01 and TC-02 which belong to the smoke suite only) | Full login behaviour coverage | Nightly and pre-release |
| Full (smoke + regression) | `@login` | TC-01 to TC-27 | Release sign-off | Pre-release |

Rules:
- P1 test cases (TC-01, 02, 03, 04, 06, 07, 13, 15, 18, 24) must all pass for release.
- TC-07 (wrong password, real account) runs at most once per pipeline execution, never in smoke, never retried.
- TC-09 and TC-24 may legitimately skip (feature absent). A skip needs a recorded reason.
- Cross-browser: Firefox and WebKit run only the smoke subset. Chromium runs the whole regression.

---

## 6. Proposed folder structure

```
AgriNext_AI_TWAutomation/
├── config/                  # env loading, constants, timeouts
│   ├── env.ts               # dotenv load + validation (no logging of secrets)
│   └── global-setup.ts      # pre-flight checks, optional storageState creation
├── pages/                   # Page Object Model
│   ├── LoginPage.ts         # email step, password step, KMSI, error alerts
│   ├── LenderHomePage.ts    # post-login landing, user menu, sign out
│   └── BasePage.ts
├── fixtures/                # Playwright test.extend fixtures
│   └── auth.fixture.ts      # loginPage, authenticated page, storageState
├── utils/                   # helpers
│   ├── data-generator.ts    # synthetic non-existent email, random wrong password
│   └── a11y.ts              # tab-order and name helpers
├── test-data/               # static data (no real secrets)
│   ├── login.data.ts        # malformed emails, boundary strings
│   └── .auth/               # storageState JSON (git-ignored)
├── tests/
│   └── e2e/
│       ├── login.smoke.spec.ts
│       ├── login.validation.spec.ts
│       ├── login.negative.spec.ts      # includes serial TC-07
│       ├── login.ui-a11y.spec.ts
│       └── logout.spec.ts
├── docs/
│   ├── TEST-PLAN-Lender-Login.md
│   └── screenshots/
├── reports/                 # HTML report, JUnit, JSON (git-ignored)
├── test-results/            # Playwright output: screenshots, videos, traces (git-ignored)
├── .env                     # BASE_URL, LENDER_EMAIL, LENDER_PASSWORD (quoted), git-ignored
├── .env.example             # placeholders only
├── .gitignore
├── playwright.config.ts     # projects: chromium (all), firefox/webkit (smoke), reporters -> reports/
├── tsconfig.json
└── package.json
```

Config recommendations (`playwright.config.ts`): `baseURL` from `BASE_URL`; `trace: 'retain-on-failure'`; `screenshot: 'only-on-failure'`; `video: 'off'` for login specs that type credentials (R-08); `outputDir: 'test-results'`; HTML reporter folder `reports/html`; `workers: 1` for login specs (R-05); default `retries: 0` for tests touching the real account.
