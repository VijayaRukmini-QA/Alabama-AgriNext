# Test Execution Summary: Create Customer Profile

| Item | Value |
|---|---|
| Environment | Dev customer portal (`CUSTOMER_BASE_URL`), Chromium (Desktop Chrome) and Pixel 5 emulation |
| Tool | Playwright Test 1.65.0, TypeScript, POM |
| Date | 2026-11-09 |
| Final customer run | 09:37 UTC, 6.0 min, 3 workers. Evidence: `reports/customer-run-final.log`, `reports/customer-results.json`, `reports/customer-html-report/` |
| E2E run | 09:48 UTC. Evidence: `reports/customer-e2e-run-final.log`, `reports/customer-e2e-results.json` |

The report files are git-ignored. Regenerate them with `npm run test:customer`.

## Results (from the real run output)

| Project | Total | Passed | Failed | Skipped | Flaky |
|---|---|---|---|---|---|
| customer-chromium | 56 | 49 | 7 | 0 | 0 |
| customer-mobile | 2 | 2 | 0 | 0 | 0 |
| customer-e2e (`RUN_CUSTOMER_E2E=1`) | 1 | 0 | 0 | 1 | 0 |
| **Total** | **59** | **51** | **7** | **1** | **0** |

- **Failures:** all 7 are confirmed application defects. None is a script issue. The healer verified each one against the error context and trace.
- **Skip:** the one skip is TC-C-01, the full real registration. It is blocked by a Cloudflare bot check on yopmail.com (B1/F-01). The check runs as a preflight before any code is sent. No bypass was attempted.

Lender regression check, run on the same day after the config change:
- `chromium` + `mobile`: 29 passed, 5 skipped (34 tests). This is identical to the pre-change baseline.
- Evidence: `reports/lender-run-final.log`.

## Defects identified

| ID | Severity | Summary | Failing test |
|---|---|---|---|
| F-09 | Medium (security) | Forgot password reveals whether an account exists | `customer.login-navigation.spec.ts:98` TC-C-X1 |
| F-13 | Medium (accessibility) | Consent checkboxes have no accessible name | `customer.a11y.spec.ts:30` TC-C-20 |
| F-13 | Medium (accessibility) | 5 of the 6 SMS OTP boxes and the Back icon button are unnamed | `customer.a11y.spec.ts:49` TC-C-20 |
| F-03 | Medium (accessibility) | 7 of the 8 email OTP boxes are unnamed | `customer.a11y.spec.ts:38` TC-C-20 |
| F-04 | Low (accessibility) | The "Invalid email" error is not announced (no role=alert, aria-describedby or aria-invalid) | `customer.a11y.spec.ts:109` TC-C-22 |
| F-10 | Low (validation) | Forgot password accepts a malformed email: Send is enabled and there is no inline error | `customer.login-navigation.spec.ts:79` TC-C-07 |
| F-17 | Low (keyboard) | Enter does not submit the filled SMS step (AC-35) | `customer.a11y.spec.ts:83` TC-C-21 |

Also logged, not asserted as failing tests:
- F-05: toasts auto-dismiss.
- F-06: Forgot password is a button rather than a link.
- F-07: no early signal for an existing email.
- F-11: phone `0000000000` is accepted.
- F-12: no feedback while Continue is disabled until an address is picked.
- F-14: the code length is 8 on the email step but 6 on the SMS step.
- F-15: the Maps key is visible.
- F-16: links open in new tabs.

Environment blockers:
- **B1/F-01:** a Cloudflare Turnstile check on the yopmail inbox.
- **B2/F-02:** a Cloudflare managed challenge on receive-smss.com.

## Automation coverage

**Planned:** 28 test cases (TC-C-01 to TC-C-28) plus 2 manual charters.

**Automated: 24 of the 28 TCs**
- TC-C-01 to TC-C-22, TC-C-24 and TC-C-26.
- TC-C-X1 is automated as the F-09 check.

**Executed to a verdict: 23 of the 28.** TC-C-01 is automated but blocked.

| Area | Covered by |
|---|---|
| Email step: valid/empty/malformed, Send enablement | TC-C-02, 03, 04 |
| Email code: wrong code (real), resend after 30 s (real), Change | TC-C-06, 07 |
| Already-registered probe of `CUSTOMER_EMAIL` | TC-C-05 (sign-in returns "Invalid email or password.", so the account is not registered) |
| Mandatory fields, one-missing-at-a-time, error clears | TC-C-08, 09, 19 |
| Consents (3 required, Marketing optional) | TC-C-10 |
| Password policy, mismatch, masking, Show/Hide on sign-up and /login | TC-C-11, 12, 13, 26 |
| Phone validation, names and script input | TC-C-14, 16 |
| Street 1 "Alabama", last suggestion autofill (real Google Places) | TC-C-15 |
| SMS step: enablement, wrong code, resend (mocked) | TC-C-17, 18 |
| Forgot password / Create one / Sign in navigation | TC-C-07, TC-C-02 |
| Accessibility: names, keyboard, alerts | TC-C-20, 21, 22 |
| Mobile viewport | TC-C-24 |

Not automated:
- **TC-C-23:** axe scan. `@axe-core/playwright` is not installed. Accessibility is covered with role and name assertions instead.
- **TC-C-25:** captcha detection. It is implemented inside TC-C-01 as `ThirdPartyBlockedError`, but there is no standalone test.
- **TC-C-27:** unit test of code parsing.
- **TC-C-28:** refresh and Back.

Strategy:
- The profile-form and SMS-step tests mock the app's own Entra native-auth responses (`utils/ciamMocks.ts`). No accounts are created, and the steps can be tested without real codes.
- The real dev calls per run are about 3 email-code sends, all to throwaway `agcustomer<ts>@yopmail.com` addresses, plus one sign-in probe and one forgot-password probe.

## Healing summary

**Generator, 2 script fixes**
- The `fieldError` locator now uses `error_text` inside the field container. The test id `<field>-field-error` does not exist.
- TC-C-15 assertions were corrected: the suggestion list closes after selection, and the free-text case now uses a string with no suggestions.

**Healer, F-09 false pass found and fixed**
- The original check was an absence assertion. It retried until the auto-dismissing toast vanished, so it passed.
- The test now waits for `resetpassword/v1.0/start` and asserts on the captured toast text.

**Healer, real-send tests hardened**
- TC-C-06 waits for the 400 response.
- TC-C-07 uses `expect.poll` for the cleared OTP boxes.

**Third-party page objects**
- Fixed-sleep polling was replaced with bounded `toPass` polling. Each poll is at least 5 s for SMS.

**Re-runs**
- Healed tests were re-run once, then the final full run followed.
- No `--repeat-each` was used on tests that make real calls.

## Exploratory findings
See `docs/EXPLORATORY-FINDINGS-Create-Customer-Profile.md`.
- **Charter 1 (live app):** landing, login, the email and code steps, forgot password and resend.
- **Charter 2 (mocked auth):** the profile form, Google Places autocomplete and the SMS step.
- **Blocked:** both third-party code sources.
- **Unverified:** the real end-to-end landing on `/apply-for-a-loan`, phone-number uniqueness and the duplicate-email response.

## Data lineage
- **Happy path (TC-C-01):** `agcustomer<Date.now()>@yopmail.com` is generated per run and recorded as an annotation. In the last run it was blocked before the send.
- **`CUSTOMER_EMAIL`:** never used for registration. The sign-in probe shows it is not registered yet.
- **Mocked tests:** synthetic name `QA Mockuser`, fictional phone `2055550100` and a runtime-generated policy-compliant password.
- **Secrets:** only in `.env` (git-ignored). `.env.example` holds placeholders only.

## Final status
**FAILED: not release-ready.**
- **Defects:** 7 failing tests, all application defects (1 medium security, 4 accessibility, 1 validation, 1 keyboard).
- **Primary acceptance check unverified:** the full registration ending on `/apply-for-a-loan` (TC-C-01) cannot run because of the Cloudflare checks on yopmail and receive-smss.
- **Automation status:** stable, with 0 flaky tests and 0 script failures.
- **To unblock TC-C-01**, one of these is needed:
  - an allowlisted runner;
  - a test mail/SMS provider with an API;
  - a dev-tenant OTP bypass.
