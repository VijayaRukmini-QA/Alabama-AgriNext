# AgriNext (Alabama Ag Credit) - Playwright E2E Automation

This framework uses Playwright Test 1.65, TypeScript and the Page Object Model. It covers three modules:

| Module | App | Playwright projects | Specs |
|---|---|---|---|
| Lender Login | `BASE_URL` (lender portal, Microsoft Entra sign-in) | `chromium`, `mobile` | `tests/e2e/` |
| Create Customer Profile | `CUSTOMER_BASE_URL` (customer portal, Entra External ID native auth) | `customer-chromium`, `customer-mobile`, `customer-e2e` | `tests/customer/` |
| Customer Sign In (incl. SMS MFA) | `CUSTOMER_BASE_URL` `/login` | `customer-chromium`, `customer-mobile`, `customer-e2e` (select with `--grep @signin`) | `tests/customer/signin/` |

Each project sets its own `testDir` and `baseURL`, so the two modules never pick up each other's specs.

## Setup

```bash
npm ci
npx playwright install chromium
cp .env.example .env   # then fill in values locally - never commit .env
```

| Variable | Used by |
|---|---|
| `BASE_URL`, `LENDER_EMAIL`, `LENDER_PASSWORD` | Lender module |
| `CUSTOMER_BASE_URL`, `CUSTOMER_EMAIL`, `CUSTOMER_PASSWORD`, `CUSTOMER_PHONE`, `CUSTOMER_FIRST_NAME`, `CUSTOMER_LAST_NAME`, `SMS_INBOX_URL` | Customer module |
| `RUN_REAL_LOGIN=1` | Opt-in real lender login |
| `RUN_CUSTOMER_E2E=1` | Opt-in real end-to-end registration (TC-C-01) |

Secrets are read only through `config/env.ts`, which uses lazy getters. Values passed to `registerSecret` are masked by `utils/logger.ts`.

## Run

```bash
npm run test:lender          # lender suite
npm run test:customer:signin # customer sign-in tests only (@signin)
npm run test:customer        # customer suite (mocked auth for form/SMS steps + a few real calls)
npm run test:smoke           # @smoke across both modules
# real end-to-end customer registration (one run; uses yopmail + receive-smss):
#   PowerShell: $env:RUN_CUSTOMER_E2E=1; npm run test:customer:e2e
#   bash:       RUN_CUSTOMER_E2E=1 npm run test:customer:e2e
npx playwright show-report reports/html-report
```

Evidence settings:
- Customer projects take a screenshot for every test. Trace and video are kept on failure.
- Lender projects keep the screenshot, trace and video on failure only.
- Reports are written to `reports/` (HTML, JSON, JUnit) and are git-ignored.

## Layout

```
config/env.ts                 env loading + lazy secret getters
pages/                        lender page objects
pages/customer/               customer page objects (landing, login, forgot password,
                              create-profile email/code steps, sign-up form, SMS step,
                              apply-for-a-loan, Toast component)
pages/third-party/            YopmailInboxPage, ReceiveSmsInboxPage (bounded polling,
                              Cloudflare detection -> ThirdPartyBlockedError, never bypassed)
fixtures/pages.fixture.ts     lender fixtures
fixtures/customer.fixture.ts  customer fixtures (independent of lender fixtures)
utils/                        logger (secret masking), uniqueEmail, customerEmail
                              (unique agcustomer<ts>@yopmail.com), ciamMocks (Entra
                              native-auth response mocks), thirdPartyGuard
test-data/                    non-secret data (login.data.ts, customer.data.ts)
tests/e2e/                    lender specs
tests/customer/               customer specs
docs/                         acceptance criteria, test plans, exploratory findings,
                              execution summary, neutral screenshots
```

## Customer module design notes

**Data uniqueness**
- Every happy-path run registers a new `agcustomer<timestamp>@yopmail.com` address, and the generated address is recorded as a test annotation for data lineage.
- `CUSTOMER_EMAIL` itself is only probed (TC-C-05) and is never used to register.

**Mocked auth**
- The profile form, the SMS step and the Change flow are tested by mocking the app's own Entra native-auth responses (`utils/ciamMocks.ts`). This avoids creating accounts and needing real codes.
- Google Places autocomplete stays real.

**Real calls**
- A few tests deliberately call the dev app: wrong email code, resend, the sign-in probe and forgot-password enumeration.
- They send about 3 real email codes per run, all to throwaway addresses.
- Do not loop these tests or run them with `--repeat-each`.

**SMS code selection**
- receive-smss.com is a shared public inbox.
- Before Continue is clicked, the test snapshots the existing "Alabama Ag Credit" messages. After Continue it accepts only the newest message that was not in the snapshot.
- It polls at least every 5 s, with an overall bound of about 3 min, so a stale code is never used.

**Third-party risk**
- yopmail.com (inbox) and receive-smss.com currently show Cloudflare bot checks.
- When either check appears, TC-C-01 skips with `BLOCKED: ... not bypassed`. See `docs/EXPLORATORY-FINDINGS-Create-Customer-Profile.md` (B1/B2) for the options to unblock it.

**Defects**
- Tests assert the acceptance criteria. Known app defects are left failing, with a `defect` annotation and the F-ID in the test title. They are never masked.

## Customer Sign In design notes

**Mocked MFA**
- The MFA step renders inside `/login` ("Multi-factor authentication", "Verify code"). It is tested by mocking the app's Entra native-auth responses in `utils/signInMocks.ts`.
- Real calls per run: 3 sign-in submits with synthetic unknown emails. There are never wrong-password attempts against `CUSTOMER_EMAIL`.

**Real end-to-end check (TC-S-60)** runs under `RUN_CUSTOMER_E2E=1`:
- It preflights the SMS inbox first and skips as BLOCKED on a Cloudflare challenge.
- It then makes one real sign-in and skips as BLOCKED if the account does not exist.
- Only then does it read the newest "Alabama Ag Credit" SMS (`utils/smsCodePicker.ts`).

**Known blocker**
- `CUSTOMER_EMAIL` is not registered in the Dev tenant (S-F-01).

## Docs

| Module | Documents |
|---|---|
| Lender | `docs/TEST-PLAN-Lender-Login.md`, `docs/EXPLORATORY-FINDINGS-Lender-Login.md` |
| Customer | `docs/ACCEPTANCE-CRITERIA-Create-Customer-Profile.md`, `docs/TEST-PLAN-Create-Customer-Profile.md`, `docs/EXPLORATORY-FINDINGS-Create-Customer-Profile.md`, `docs/TEST-EXECUTION-SUMMARY-Create-Customer-Profile.md` |
| Customer Sign In | `docs/ACCEPTANCE-CRITERIA-Customer-Signin.md`, `docs/TEST-PLAN-Customer-Signin.md`, `docs/TEST-CASES-Customer-Signin.md`, `docs/EXPLORATORY-FINDINGS-Customer-Signin.md`, `docs/TEST-EXECUTION-SUMMARY-Customer-Signin.md`, `qa/customer-signin/validation.md` |
| Excel | `Excels/TEST-PLAN-Create-Customer-Profile.xlsx` |
