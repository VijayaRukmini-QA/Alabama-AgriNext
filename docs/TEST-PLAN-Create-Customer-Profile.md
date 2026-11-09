# Test Plan: Create Customer Profile (Customer app)

Runner: Playwright Test 1.65 (TypeScript, Page Object Model) | App: `CUSTOMER_BASE_URL` (dev: https://alabama-dev-customer.agrinextcloud.ai/) | Date: 2026-11-09
Companion: `docs/ACCEPTANCE-CRITERIA-Create-Customer-Profile.md` (AC-xx references below). House style: `docs/TEST-PLAN-Lender-Login.md`.

Legend: **[B]** = from the brief, **[I]** = inferred, **[TBC]** = to be confirmed by exploration. Nothing in this plan has been observed live. Every locator, label, message, endpoint and URL (except `/apply-for-a-loan`) is [TBC]. No secret value appears here; secrets are read from `.env`.

---

## 1. Objectives
- Prove a new customer can complete registration end to end: email, email code, profile, consents, password, SMS code, arrival at `/apply-for-a-loan` (one real run, `@e2e-full`).
- Cover validation, negative, duplicate, Show/Hide, Resend code and Forgot password navigation, UI and accessibility cheaply, without consuming a real registration, by mocking the verification calls where possible.
- Keep the third-party dependencies (yopmail, receive-smss.com) isolated in utilities, bounded by timeouts, and never allowed to return a stale code.
- Leave the Lender suite untouched.

## 2. Scope

| In scope | Out of scope |
|---|---|
| Customer registration steps 1 to 3 and landing on `/apply-for-a-loan` | Content and behaviour of the loan application itself |
| Email and SMS code entry, wrong code, Resend code | Email/SMS delivery infrastructure internals, content design of mails |
| Profile form validation, consents, password rules, Show/Hide | Sign-in of already registered customers (only the "already registered" outcome) |
| Duplicate registration using the base `CUSTOMER_EMAIL` | Completing a password reset |
| Address autocomplete (selection of last option) | Address provider accuracy or coverage |
| UI, responsive, accessibility (keyboard, names, axe), basic security checks | Penetration testing, load testing, full WCAG audit |
| Third-party handling (bounded polling, captcha stop) | Bypassing captcha, bot protection, or ads on third-party sites |
| Chromium primary; mobile viewport for UI | Firefox/WebKit (optional later, smoke only); production |

## 3. Environment
- Customer app: `CUSTOMER_BASE_URL`. Separate Playwright project(s) with their own `baseURL`. Lender `BASE_URL` is not used.
- Third-party: `yopmail.com` (mail), `SMS_INBOX_URL` (receive-smss.com public inbox, shared number). Both require outbound internet from the runner.
- Browsers: Chromium (primary), Pixel 5 emulation for `@mobile`. Viewports: 1280x720, 375x667.
- Node + TypeScript + `dotenv`. `.env` keys: `CUSTOMER_BASE_URL`, `CUSTOMER_EMAIL`, `CUSTOMER_PASSWORD` (quote the value if it contains `#`, see lender plan section 0), `CUSTOMER_PHONE`, `CUSTOMER_FIRST_NAME`, `CUSTOMER_LAST_NAME`, `SMS_INBOX_URL`. Add placeholders to `.env.example`.

## 4. Data lineage

| Need | Lineage | How | Cleanup |
|---|---|---|---|
| Unique registration email | SYNTHETIC-GENERATED | `agcustomer<Date.now()>@yopmail.com` (extend `utils/uniqueEmail.ts` or new helper); one per test needing a fresh registration | None possible from the UI. Dev profiles accumulate; ask for a purge job (Q-14). |
| Already-registered email | ENV-SECRET | `CUSTOMER_EMAIL`, only submitted at the start step; never completes registration | None (read-only use) |
| Email verification code | THIRD-PARTY-LIVE | Read from yopmail inbox of the unique email, bounded poll | Mail left in public inbox |
| SMS verification code | THIRD-PARTY-LIVE | Newest "Alabama Ag Credit" message with timestamp after the request time | Message left in public inbox |
| First/last name, phone, password | ENV-SECRET | `CUSTOMER_FIRST_NAME`, `CUSTOMER_LAST_NAME`, `CUSTOMER_PHONE`, `CUSTOMER_PASSWORD`; never logged, no `video` on tests that type them | None |
| Street1 | SYNTHETIC-LITERAL | `Alabama`, choose the last autocomplete option | None |
| Invalid emails / names / phones / passwords | SYNTHETIC-LITERAL | `test-data/customer.data.ts` (non-secret strings only); invalid passwords are synthetic, never derived from the real one | None |
| Wrong codes | SYNTHETIC-LITERAL | `000000` and `abc123` (format [TBC]) | None |
| Verification responses for form tests | SYNTHETIC-NETWORK | `page.route` fulfilments, only after exploration reveals the endpoints | Per-test route, auto discarded |

Rules: no test depends on another test's data; each gets its own email. The phone is shared (public inbox) so only `@e2e-full` uses the real phone number. Form tests use synthetic phone literals and mocks.

## 5. Mock vs real

| Dependency | Real / mocked | Why |
|---|---|---|
| Email-code request/validate API (to reach Step 2) | **Mocked** for TC-C-08 to TC-C-17, TC-C-20 to TC-C-24 [TBC endpoints]. Real only in TC-C-01 and TC-C-06. | Avoids a yopmail round trip per test and protects rate limits. |
| SMS send/verify API | **Mocked** for SMS-step UI and negative tests (TC-C-17, TC-C-18). Real only in TC-C-01. | Phone is shared and one-time. |
| yopmail UI | Real, only in TC-C-01 | The brief requires it. |
| receive-smss.com UI | Real, only in TC-C-01 | The brief requires it. |
| Address autocomplete provider | Real (TC-C-15 and TC-C-01) | The brief requires selecting a real option; if flaky, mock a fixed list. |
| Duplicate-email check | Real (TC-C-05), no side effect expected | Needs the true backend answer. |
| Captcha / bot wall | Never mocked or bypassed. Detection helper stops the run. Detection logic itself is tested with a mocked page (TC-C-25). | Policy. |

Fallback if the verification calls cannot be mocked (for example, server-side signed state): one serial `describe` (`@customer @regression`) that gets to Step 2 once with the real yopmail flow, then runs the Step 2 validation checks on the same page without submitting Continue. Decide after exploration.

## 6. Journeys (risk-based)

Priority: P1 critical, P2 high, P3 medium. Every test also carries `@customer`.

| ID | Journey | Type | Pri | Tags | Role / Data | AC |
|---|---|---|---|---|---|---|
| TC-C-01 | Full registration to `/apply-for-a-loan` (real yopmail + real SMS) | E2E | P1 | @customer @e2e-full | anonymous; unique email, env secrets | AC-01 to AC-03, AC-06 to AC-12, AC-42, AC-43 |
| TC-C-02 | Start page renders required elements | UI | P1 | @customer @smoke @regression | anonymous | AC-27 |
| TC-C-03 | Empty email rejected | validation | P1 | @customer @smoke @regression @negative | anonymous | AC-16 |
| TC-C-04 | Malformed emails rejected (data-driven) | validation | P2 | @customer @regression @negative | anonymous; literals | AC-16 |
| TC-C-05 | Already-registered email (`CUSTOMER_EMAIL`) is refused | negative | P1 | @customer @regression @negative | anonymous; env secret | AC-15, AC-40 |
| TC-C-06 | Wrong email verification code rejected | negative | P1 | @customer @regression @negative | anonymous; unique email, literal code | AC-04 |
| TC-C-07 | Resend code (email step) and Forgot password navigation | functional | P2 | @customer @regression | anonymous | AC-05, AC-17 |
| TC-C-08 | Profile form: all mandatory fields empty | validation | P1 | @customer @smoke @regression @negative | mocked verification | AC-18 |
| TC-C-09 | Profile form: one mandatory field missing at a time | validation | P2 | @customer @regression @negative | mocked; literals | AC-19 |
| TC-C-10 | Consents: unchecked blocks Continue; select-all enables | validation | P1 | @customer @regression @negative | mocked | AC-08, AC-20 |
| TC-C-11 | Password policy violations | validation | P2 | @customer @regression @negative | mocked; synthetic passwords | AC-21 |
| TC-C-12 | Password and confirm mismatch | validation | P1 | @customer @regression @negative | mocked | AC-22 |
| TC-C-13 | Password Show/Hide on both fields | UI | P1 | @customer @smoke @regression | mocked | AC-26, AC-32 |
| TC-C-14 | Phone field invalid values | validation | P2 | @customer @regression @negative | mocked; literals | AC-23 |
| TC-C-15 | Street1 autocomplete: last option selected; no-match behaviour | functional | P1 | @customer @regression | mocked verification, real autocomplete | AC-06, AC-24 |
| TC-C-16 | Name boundaries and script-like input | validation | P3 | @customer @regression @negative | mocked; literals | AC-25 |
| TC-C-17 | SMS step: wrong and empty code rejected | negative | P1 | @customer @regression @negative | mocked SMS | AC-13 |
| TC-C-18 | SMS step: Resend code behaviour and navigation | functional | P2 | @customer @regression | mocked SMS | AC-14 |
| TC-C-19 | Error clears after correction | functional | P3 | @customer @regression | mocked | AC-28 |
| TC-C-20 | Accessible names on all steps | a11y | P1 | @customer @smoke @regression @a11y | mocked | AC-31 |
| TC-C-21 | Keyboard: Tab order, Enter submits, autocomplete by keyboard | a11y | P2 | @customer @regression @a11y | mocked | AC-33, AC-35 |
| TC-C-22 | Errors exposed to assistive tech (alert / aria-describedby) | a11y | P2 | @customer @regression @a11y | mocked | AC-34 |
| TC-C-23 | axe scan on each step (A/AA, critical and serious) | a11y | P2 | @customer @regression @a11y | mocked | AC-36 |
| TC-C-24 | Mobile viewport renders each step | UI | P3 | @customer @regression @mobile | mocked | AC-29 |
| TC-C-25 | Third-party wall detection (captcha) stops run with clear message | resilience | P2 | @customer @regression | mocked page | AC-44 |
| TC-C-26 | Security: no secrets in URL, masked fields, HTTPS, autocomplete attrs | security | P2 | @customer @regression | mocked | AC-37, AC-38 |
| TC-C-27 | SMS/email code parsing and "newest after request time" selection | unit (not E2E) | P1 | @customer @unit | HTML fixtures | AC-11, AC-43, AC-45 |
| TC-C-28 | Refresh and browser Back during steps | exploratory then regression | P3 | @customer @regression | mocked | AC-30 |
| TC-C-X1 | Exploratory: code reuse and expiry, attempt throttling, enumeration, concurrent double submit | exploratory | n/a | @customer (manual charter, not automated) | manual | AC-39, AC-41, AC-40 |
| TC-C-X2 | Exploratory: screen reader pass, 200% zoom, high contrast, Firefox/WebKit | exploratory | n/a | manual | manual | AC-31 to AC-36 |

Suites: **Smoke** = TC-C-02, 03, 08, 13, 20 (no third parties, under 2 min). **Regression** = all `@regression`. **Full E2E** = `@e2e-full` (TC-C-01), run once per pipeline, workers 1, no `--repeat-each`, no retry.

## 7. Entry criteria
- Customer dev site reachable. Open questions Q-01 (phone uniqueness), Q-08 (bypass), Q-10 (captcha) have an owner and either an answer or a documented workaround.
- `.env` populated; password quoted where needed; `CUSTOMER_PHONE` matches the number behind `SMS_INBOX_URL`.
- Exploration complete: locators, messages, mock endpoints confirmed and recorded in the page objects.
- yopmail and receive-smss.com reachable from the runner without captcha.
- Playwright and Chromium installed. Lender suite green before changes (baseline).

## 8. Exit criteria
- All P1 TCs executed and passing; TC-C-01 passed at least once on the current build.
- At least 95 percent of P1+P2 pass; no open Critical/High defects.
- Smoke green on 3 consecutive runs; zero reliance on yopmail/SMS in smoke and mocked regression.
- Skips carry a recorded reason (for example Q-01 blocks repeat E2E).
- Lender suite results unchanged (same pass count as baseline).
- HTML report archived under `reports/`.

## 9. Risks and mitigations

| ID | Risk | L | I | Mitigation |
|---|---|---|---|---|
| R-C-01 | yopmail flakiness: slow delivery, ads, consent dialog, inbox iframe, possible captcha | High | High | Isolate in `utils/yopmail.ts`; bounded poll (about 90 s) with refresh every 5 s; dismiss consent and ads by role/text where safe; on captcha stop with "BLOCKED: captcha"; yopmail only in TC-C-01. |
| R-C-02 | SMS public inbox: shared number, delays, stale or other users' messages, ads, page cache | High | High | Record `requestedAt` before Continue; pick only newest "Alabama Ag Credit" message with timestamp after `requestedAt` (allow clock skew tolerance, [TBC] format); click "update message" in a bounded loop (about 120 s); never accept messages seen earlier; run with workers 1. |
| R-C-03 | Captcha or bot detection on the customer app or third parties | Medium | High | No bypass. Detect, stop the run, report. Raise with dev (Q-10) for a test allowlist. |
| R-C-04 | Shared phone number: uniqueness rule (Q-01) blocks repeat registrations; other teams consume the inbox | High | High | Ask for phone pool or bypass; use phone only in TC-C-01; document one-time constraint. |
| R-C-05 | Rate limits on code sends and registrations (email, SMS, IP) | Medium | High | `@e2e-full` runs once, workers 1, no repeat-each, no retries; all other tests mocked; no loops of Resend. |
| R-C-06 | Registration is one-time, dev accumulates profiles | High | Medium | Unique email per run; cleanup request Q-14. |
| R-C-07 | Mocked endpoints drift from real API | Medium | Medium | TC-C-01 is the contract check; keep fixtures in one file; update on API change. |
| R-C-08 | Locators or wording differ from assumptions (this plan is unobserved) | High | Medium | Role/label locators, regex messages; exploration before generation. |
| R-C-09 | Secrets leaking in traces, videos, logs | Low | High | `video: 'off'` and masked logging for tests typing secrets; never log `.env` values; `.env` git-ignored. |
| R-C-10 | Lender suite affected by config change | Low | High | Separate config file/projects, no change to existing project definitions, verify lender baseline after change. |
| R-C-11 | Autocomplete provider flaky, "last option" changes | Medium | Medium | Wait for listbox stable (count unchanged for 500 ms); assert the field is filled, not a specific address. |

## 10. Proposed folder layout (additive only)

```
AgriNext_AI_TWAutomation/
├── playwright.customer.config.ts   # NEW: customer projects only (see 11); lender playwright.config.ts untouched
├── config/
│   └── env.ts                      # ADD getters: getCustomerBaseUrl, getCustomerEmail, getCustomerPassword,
│                                   #   getCustomerPhone, getCustomerFirstName, getCustomerLastName, getSmsInboxUrl
├── pages/
│   └── customer/                   # NEW
│       ├── CustomerStartPage.ts            # email step (+ already-registered error)
│       ├── EmailVerificationPage.ts        # code entry, Resend code
│       ├── CustomerProfilePage.ts          # name, street1 autocomplete, phone, consents, passwords, Show/Hide
│       ├── SmsVerificationPage.ts          # SMS code, Complete verification, Resend
│       ├── ApplyForLoanPage.ts             # landing assertion
│       ├── YopmailInboxPage.ts             # third-party page object (search, refresh, read code)
│       └── SmsInboxPage.ts                 # third-party page object (update message, newest message)
├── tests/
│   └── customer/                   # NEW
│       ├── registration.e2e-full.spec.ts   # TC-C-01
│       ├── start-step.spec.ts              # TC-C-02 to 07
│       ├── profile-validation.spec.ts      # TC-C-08 to 12, 14, 16, 19
│       ├── profile-ui.spec.ts              # TC-C-13, 15, 24, 28
│       ├── sms-step.spec.ts                # TC-C-17, 18
│       ├── a11y.spec.ts                    # TC-C-20 to 23
│       ├── security.spec.ts                # TC-C-26
│       ├── third-party-guard.spec.ts       # TC-C-25
│       ├── unit/codeParsing.spec.ts        # TC-C-27
│       └── helpers.ts
├── test-data/
│   └── customer.data.ts            # NEW: invalid emails, names, phones, passwords, wrong codes (no secrets)
├── utils/
│   ├── yopmail.ts                  # NEW: getVerificationCode(email, {sinceMs, timeoutMs}) or page-object equivalent
│   ├── smsInbox.ts                 # NEW: getSmsCode({sender:'Alabama Ag Credit', requestedAt, timeoutMs})
│   ├── thirdPartyGuard.ts          # NEW: detectCaptcha(page) -> throws BlockedError
│   ├── codeParser.ts               # NEW: pure functions, unit-testable
│   └── uniqueEmail.ts              # EXISTING: add customerEmail() or reuse
├── fixtures/
│   ├── pages.fixture.ts            # EXISTING, untouched
│   └── customer.fixture.ts         # NEW: extends test with customer page objects, yopmail/sms helpers, mock helpers
└── docs/
```

`yopmail.ts` / `smsInbox.ts` may be replaced by the page objects `YopmailInboxPage` / `SmsInboxPage` if the repo prefers; keep the parsing pure in `codeParser.ts`. Third-party pages must open in a **new page of the same context** (`context.newPage()`), so the app page keeps its state.

## 11. Playwright configuration (proposal)

- `playwright.customer.config.ts` (separate file, run with `npx playwright test -c playwright.customer.config.ts`). Reuses reporters, timeouts pattern from the lender config.
- `testDir: 'tests/customer'`. Lender `testDir` is `tests/e2e`, so the lender run never collects these files.
- Projects:
  - `customer-chromium`: `baseURL = CUSTOMER_BASE_URL`, Desktop Chrome, `grep: /@customer/`, `grepInvert: /@e2e-full|@mobile/`, `fullyParallel: true`, workers up to 3 (mocked tests).
  - `customer-mobile`: Pixel 5, `grep: /@mobile/`.
  - `customer-e2e-full`: Desktop Chrome, `grep: /@e2e-full/`, `workers: 1` via project-level `fullyParallel: false`, `retries: 0`, `timeout: 300_000`, `video: 'off'`, `trace: 'off'` or `retain-on-failure` with masked inputs. Never run with `--repeat-each`; add a guard in the spec that fails if `testInfo.repeatEachIndex > 0`.
- `package.json` scripts (additive): `test:customer`, `test:customer:smoke` (`--grep @smoke`), `test:customer:e2e-full`. Existing scripts unchanged.
- Global: `forbidOnly` on CI, `expect.timeout 15_000`.

## 12. Test cases with steps

Conventions: "unique email" = `agcustomer<timestamp>@yopmail.com`. "Mock verification" = `page.route` fulfilments for email-code validate so the profile form is reached without yopmail [endpoints TBC]. All locators are role/label first and **to be confirmed by exploration**. Preconditions for all: fresh browser context, no stored session.

### TC-C-01 Full registration (`@customer @e2e-full`, P1)
Precondition: `CUSTOMER_PHONE` unused by a registered profile (Q-01); guard that `repeatEachIndex === 0`; workers 1; retries 0.
1. Generate the unique email; open `CUSTOMER_BASE_URL`.
2. Enter the unique email; submit (button name TBC). Record `emailRequestedAt = Date.now()`.
3. Assert the verification-code step is shown (heading TBC).
4. Open a new page in the same context at yopmail.com. Run the captcha guard; dismiss consent/ads if present.
5. Enter the unique mailbox name in the inbox field; open the inbox.
6. Search/filter for the account verification mail (subject TBC); click refresh every 5 s until it appears, up to 90 s; on timeout fail with "verification mail not received".
7. Read the code from the mail body (iframe `#ifmail` TBC) using `codeParser`.
8. Close the yopmail page; return to the app page; enter the code; click validate.
9. Assert the profile form is shown.
10. Fill first name (`CUSTOMER_FIRST_NAME`) and last name (`CUSTOMER_LAST_NAME`).
11. Type `Alabama` in street1; wait for the suggestions; click the last option; assert street1 is filled.
12. Fill phone (`CUSTOMER_PHONE`).
13. Check every consent checkbox; assert all checked (count recorded).
14. Fill password and confirm password with `CUSTOMER_PASSWORD` (optionally toggle Show then Hide to verify). 
15. Record `smsRequestedAt = Date.now()` immediately before clicking Continue; click Continue.
16. Assert the SMS verification step is shown.
17. Open a new page at `SMS_INBOX_URL`; run the captcha guard; dismiss consent/ads.
18. Loop up to 120 s: click "update message"; parse the message list; keep only messages whose sender/text contains "Alabama Ag Credit" and whose received time is after `smsRequestedAt` (minus tolerance [TBC]); choose the newest; stop when found. On timeout fail with "SMS not received after <t>".
19. Extract the code; close the page; enter it on the app page; click "Complete verification".
20. Assert `page.waitForURL(/\/apply-for-a-loan/)` and assert the landing element (TBC).
Expected: registration succeeds; no error alerts at any step; no secret in logs.

### TC-C-02 Start page elements (`@smoke @regression`)
1. Open `CUSTOMER_BASE_URL`.
2. Assert heading, email textbox (by label), primary button, and links (Forgot password / Resend code if on this page) [TBC] visible. Assert HTTPS.
Expected: all present with accessible names.

### TC-C-03 Empty email (`@smoke @negative`)
1. Open the start page. 2. Leave email empty; click the submit button.
Expected: required message shown; remains on start step; no network call requesting a code (assert no request to the send-code endpoint [TBC]).

### TC-C-04 Malformed emails (data-driven from `customer.data.ts`)
For each of `notanemail`, `user@`, `@domain.com`, `a b@c.com`, 300-char local part: 1. Open start page. 2. Fill value. 3. Submit.
Expected: validation error; code step not shown.

### TC-C-05 Already registered (`@negative`)
1. Open start page. 2. Fill `CUSTOMER_EMAIL`. 3. Submit.
Expected: "already registered" message or redirect to sign-in [TBC, Q-05]; no profile form; no duplicate. Do not proceed beyond. Run once per pipeline (no loops).

### TC-C-06 Wrong email code (`@negative`)
Uses one real code send; no yopmail read.
1. Open start page; submit a unique email. 2. On the code step enter `000000` (format TBC); validate. 3. Repeat once with an empty code.
Expected: error each time; remains on code step; profile form not shown. Do not exceed 2 wrong attempts (Q-06 lockout).

### TC-C-07 Resend code and Forgot password navigation
1. Reach the code step as in TC-C-06 (unique email). 2. Click Resend code; assert confirmation message (TBC) and still on code step. Click at most once. 3. Open the start/sign-in page; click Forgot password; assert navigation to the reset page (URL/heading TBC); do not submit.
Expected: both links work and navigate or act as specified; position of each link is confirmed during exploration (Q-12).

### TC-C-08 All mandatory fields empty (`@smoke`)
1. Mock verification; reach the profile form. 2. Click Continue with nothing filled.
Expected: a required message for each mandatory field (first name, last name, street1, phone, password, confirm, consents); focus moves to the first invalid field [TBC]; no SMS request issued.

### TC-C-09 One mandatory field missing (data-driven)
For each field F in [first name, last name, street1, phone, password, confirm password]: 1. Reach the form (mock). 2. Fill everything valid with synthetic data (not env secrets), leave F empty, check all consents. 3. Click Continue.
Expected: only F shows an error; Continue does not proceed.

### TC-C-10 Consents
1. Reach the form (mock); fill all other fields validly. 2. Check all consents except one; click Continue: assert consent error (or disabled). Repeat leaving each one out in turn. 3. Check all; assert Continue accepted (assert the SMS request is attempted using a mocked endpoint).
Expected: Continue only succeeds with all consents.

### TC-C-11 Password policy
For each synthetic invalid password (too short, no digit, no uppercase, no special char, max+1 length) [rules TBC, Q-02]: 1. Reach the form (mock). 2. Fill the password; blur/Continue.
Expected: policy error shown. Plus one boundary: min-length valid password has no error.

### TC-C-12 Mismatch
1. Reach the form (mock). 2. Password `A`, confirm `B` (synthetic). 3. Blur confirm, click Continue.
Expected: mismatch error; no progress. Then correct confirm: error clears.

### TC-C-13 Show/Hide
1. Reach the form (mock). 2. Type a synthetic password in password; assert `type=password`. 3. Click Show (name TBC); assert `type=text` and the name changes to Hide. 4. Click Hide; assert `type=password`. 5. Repeat for confirm password. 6. Assert the toggles are keyboard-operable (focus + Enter/Space).
Expected: masked and revealed correctly; toggles independent.

### TC-C-14 Phone invalid
For each of `abc`, `123`, `+++`, 25 digits, `(555) 000-000` [rules TBC]: 1. Reach the form (mock). 2. Fill phone; blur.
Expected: invalid phone error. A valid format (from literal, not env) shows none.

### TC-C-15 Street1 autocomplete
1. Reach the form (mock verification, real autocomplete). 2. Type `Alabama`; wait for the listbox. 3. Press/Click the last option; assert field value changed and dependent fields filled [TBC]. 4. Clear; type `zzzzzzzz`; assert no options / behaviour per Q-07.
Expected: the last option is selectable by mouse (and keyboard).

### TC-C-16 Name boundaries
For `O'Neil`, `Anne-Marie`, `  spaced  `, 100 chars, `<script>window.__x=1</script>`: 1. Reach the form (mock). 2. Fill first name; blur. 
Expected: accepted values trimmed or valid error; the script is never executed (`window.__x` undefined).

### TC-C-17 SMS step wrong and empty code
1. Mock verification and the send-SMS endpoint; fill the form validly with synthetic data; Continue. 2. On the SMS step click "Complete verification" with an empty code. 3. Enter `000000`; click again (mock verify returns an error response [TBC]).
Expected: errors; stays on SMS step; URL not `/apply-for-a-loan`.

### TC-C-18 SMS Resend
1. Reach the SMS step as in TC-C-17. 2. Click Resend code; assert a second send request was made (route counter) and confirmation shown; cooldown behaviour if any [TBC].
Expected: exactly one extra send request.

### TC-C-19 Error clears
1. Reach the form (mock). 2. Click Continue (errors). 3. Fill first name.
Expected: first name error clears; others remain.

### TC-C-20 Accessible names (`@a11y @smoke`)
For each step (start, code, profile, SMS): 1. Reach it (mock). 2. Assert every textbox, checkbox, button, link, and toggle resolves `getByRole(...)` with a non-empty name; assert each input is found via `getByLabel`.
Expected: no unnamed controls; any failure is a testability gap.

### TC-C-21 Keyboard
1. Reach each step. 2. Press Tab through the controls; assert the order is visual order and a focus indicator is visible; no trap. 3. Press Enter in the email, code and SMS-code fields; assert submit. 4. Autocomplete: type `Alabama`, ArrowDown to the last, Enter; assert selection [TBC].
Expected: fully keyboard operable.

### TC-C-22 Errors exposed to AT
1. Reach the profile form (mock); click Continue empty. 2. For each invalid field assert `aria-invalid=true` and `aria-describedby` linking to the message, or that a `role=alert` region contains messages.
Expected: errors programmatically associated.

### TC-C-23 axe scan
1. For each step (mock) run `@axe-core/playwright` with WCAG 2.1 A/AA tags (add dev dependency only after approval). 2. Fail on critical and serious; log moderate/minor as warnings.
Expected: no critical or serious violations beyond a documented baseline.

### TC-C-24 Mobile (`@mobile`, project `customer-mobile`)
1. Viewport 375x667. 2. Reach each step (mock). 3. Assert key controls visible, no horizontal scroll (`scrollWidth <= clientWidth`), primary button reachable.
Expected: usable layout.

### TC-C-25 Third-party guard
1. Serve a mocked page (`page.route` / `setContent`) with captcha markers (iframe src containing `recaptcha`/`hcaptcha`, text "verify you are human") [markers TBC]. 2. Call `detectCaptcha(page)`.
Expected: throws `BlockedError` whose message begins "BLOCKED: captcha"; no bypass attempted; clean page returns normally.

### TC-C-26 Security basics
1. Reach the form (mock) and fill with synthetic values; click through to the SMS step (mock). 2. Assert each URL visited has no email, password or code in query/hash. 3. Assert password fields `type=password` by default and `autocomplete` includes `new-password` [TBC]. 4. Assert protocol https. 5. Capture console messages; assert no secret value appears.
Expected: no leakage.

### TC-C-27 Code parsing and selection (unit, no browser)
1. Feed HTML fixtures of the yopmail mail and SMS list (saved after exploration, with any code redacted). 2. Assert the code is extracted. 3. Given messages [old Alabama Ag Credit, newer other sender, newest Alabama Ag Credit after requestedAt], assert the newest matching one is selected. 4. Given only messages older than requestedAt, assert "not found" (never returns a stale code). 5. Given a mixture of time formats ("1 min ago", absolute) [TBC] assert correct ordering.
Expected: pure functions behave as specified.

### TC-C-28 Refresh and Back
1. Reach the profile form (mock). 2. Reload; assert a valid step [Q-09]. 3. Browser Back and Forward; assert no error page and no leaked values.
Expected: documented behaviour; failures become exploratory notes if the spec is undefined.

### Exploratory charters (not automated)
- X1: reuse an accepted code, wait past expiry, 3 to 5 wrong codes, concurrent double submit (use a spare email and phone only), email enumeration behaviour.
- X2: screen reader (NVDA) pass, 200% zoom, high contrast, Firefox and WebKit visual check, terms/privacy consent links.

## 13. Not E2E (pushed down)
- Code extraction and "newest after request time" selection: unit tests (TC-C-27).
- Password policy rules and phone/email format rules: unit or API tests once the rules are known; E2E keeps one representative case each.
- Duplicate-email and code validation logic: API tests (backend), E2E checks only the UI outcome.
- Throttling and expiry rules: API tests / exploratory.

## 14. Testability gaps (to confirm during exploration)
- Show/Hide toggles, consent checkboxes, and autocomplete listbox may lack accessible names or roles.
- No test hook to skip email/SMS verification or to delete test profiles (Q-08, Q-14).
- Uniqueness of phone (Q-01) may make TC-C-01 one-shot per phone number.

## 15. Execution and reporting
- Smoke on every commit/deploy: `npx playwright test -c playwright.customer.config.ts --grep @smoke`.
- Regression nightly (mocked, no third parties).
- `@e2e-full`: manually triggered or once nightly, workers 1, no retries, no repeat-each; if BLOCKED (captcha) the run is marked blocked, not failed, and reported to the QA lead.
- Never print env values in reports; keep `.env` out of artefacts.
