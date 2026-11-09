# Test Execution Summary: Customer Sign In

| Item | Value |
|---|---|
| Environment | Dev customer portal (`CUSTOMER_BASE_URL`, `/login`), Chromium (Desktop Chrome) and Pixel 5 / 375 px |
| Tool | Playwright Test 1.65.0, TypeScript, POM |
| Date | 2026-11-09 |
| Final @signin run | 12:34 UTC, 4.4 min. Evidence: `reports/signin-run-final.log`, `reports/signin-results.json`, `reports/signin-html-report/` |
| E2E (TC-S-60) | `reports/signin-e2e-run.log`, `reports/signin-e2e-results.json` |
| Command | `npx playwright test --project=customer-chromium --project=customer-mobile --grep @signin` |

Reports are git-ignored. Every customer test takes a screenshot. Failed tests also keep a trace and a video.

## Results (from the real run output)

| Project | Total | Passed | Failed | Skipped | Flaky |
|---|---|---|---|---|---|
| customer-chromium (@signin) | 55 | 54 | 1 | 0 | 0 |
| customer-mobile (@signin) | 1 | 1 | 0 | 0 | 0 |
| customer-e2e, TC-S-60 (`RUN_CUSTOMER_E2E=1`) | 1 | 0 | 0 | 1 | 0 |
| **Total** | **57** | **55** | **1** | **1** | **0** |

The 56 @signin tests break down as follows:
- **49 new tests** in `tests/customer/signin/`.
- **7 existing customer tests**, retitled with their TC-S IDs instead of being duplicated. These are Show/Hide, Sign in enablement, the unknown-account toast, Forgot password, Create one, the landing buttons, and keyboard Show/Hide.

Outcomes:
- **Failure:** the 1 failure is TC-S-51, app defect S-F-06. The 6 MFA code boxes are located correctly, and box 2 has an empty accessible name.
- **Skip:** the 1 skip is TC-S-60, the real happy path. It is blocked because `CUSTOMER_EMAIL` is not registered in the tenant (S-F-01: `initiate` returns 400 `user_not_found`). The skip happens before any SMS is requested.

Lender regression check after these changes:
- 26 passed, 5 skipped, 3 failed in the full run.
- The 3 failures were `ENOENT` errors on trace files. A parallel Playwright run had wiped the shared `test-results/` folder, so these were environment failures, not test failures.
- The 3 tests then passed when re-run on their own (`reports/lender-rerun-3.log`). The lender suite is therefore effectively 29 passed, 5 skipped, unchanged.

## Defects and findings

| ID | Severity | Summary | Status |
|---|---|---|---|
| S-F-06 | Medium (accessibility) | MFA code boxes 2 to 6 have no accessible name or id | Failing test TC-S-51 |
| S-F-01 | Blocker (test data) | `CUSTOMER_EMAIL` is not registered (`user_not_found`, AADSTS50034) | Blocks TC-S-60, 14, 59 |
| S-F-02 | Low | No client-side email format check: a malformed email enables Sign in and is submitted | Observation (AC-25 allows the generic server error) |
| S-F-03 | Low | The password is kept in the field after a failed sign-in | Observation |
| S-F-04 | Low | No maxlength on email or password | Observation |
| S-F-05 / F-05 | Low | The error toast auto-dismisses after about 6 s | Observation |
| S-F-07 | Low | The MFA "Resend code (Ns)" countdown is a span and is not announced | Observation |
| S-F-08 | Info | The login MFA step (Verify code, Cancel, Enter submits) is inconsistent with the sign-up SMS step (Complete Profile, Enter does nothing: F-17) | Observation |
| S-F-12 | Info | The lockout message differs from the generic failure, which reveals that the account exists | Seen in a mocked lockout only |
| F-09 | Medium | Forgot password reveals whether an account exists (see the Create Customer Profile summary) | Recorded in TC-S-18 |
| Q-12 | Info | Signed-out `/apply-for-a-loan` does not redirect. It shows the public welcome page with Sign in and Create profile at the same URL. | Asserted in TC-S-35/43 |

## Automation coverage

The test cases come from `docs/TEST-CASES-Customer-Signin.md`: 69 in total, classified as 35 automatable, 23 mocked, 7 manual and 4 blocked.

| Group | Count | TCs |
|---|---|---|
| Automated and executed | 56 tests | The automatable and mocked TCs, except those listed below. Some tests cover several TCs, for example TC-S-28+29 and TC-S-33+34+69. |
| Automated, blocked at run time | 1 | TC-S-60 (S-F-01) |
| Not automated: blocked | 3 | TC-S-14 (no wrong-password attempts on the real account; the account is unregistered), TC-S-56 (needs a dedicated lockout account and the Q-07 threshold), TC-S-59 (needs a signed-in session) |
| Not automated: other | 1 | TC-S-30, axe scan. `@axe-core/playwright` is not installed. Accessible names and roles are covered by TC-S-27/31/51. |
| Manual | 7 | TC-S-26, 32, 61, 62, 63, 64, 65 |
| Partial | 3 | TC-S-40/66: the "delay beyond client timeout" mode is not automated, while 500, 503 and abort are. TC-S-55: one mocked lockout only. |

Strategy:
- The MFA step is tested by mocking the app's own Entra native-auth responses (`utils/signInMocks.ts`). No real SMS is sent.
- TC-S-48 (correct code, mocked) asserts the `mfa_oob` token exchange and that the app leaves `/login`. Landing on `/apply-for-a-loan` is verified only by TC-S-60, because mocks cannot prove the real route.
- TC-S-38/39 are unit tests of the pure SMS code picker (`utils/smsCodePicker.ts`): newest message after the request, other senders and stale codes ignored, bounded timeout.
- **Real Entra calls per @signin run:** 3 sign-in submits, all with synthetic unknown emails, plus 1 forgot-password start. There are no wrong-password attempts against `CUSTOMER_EMAIL`. TC-S-60 makes one `initiate` call with `CUSTOMER_EMAIL`.

## Healing summary

**Generator iteration 1, 8 script failures fixed**
- The toast text includes an "Error" prefix, so assertions now use `toContain`.
- A stale-toast strict-mode clash: tests now wait for `initiate` and then read the newest toast.
- A missing PrivacyPolicy mock in `mockSignInFailure` was added.
- The `allCodeBoxes` locator matched only box 0. It is now `input[inputmode="numeric"]`.

The re-run gave 7 passed and TC-S-51 failing (a real defect).

**False pass found by the orchestrator**
- TC-S-37 passed although a direct page load showed a Cloudflare challenge on receive-smss.
- The healer changed `utils/thirdPartyGuard.ts`:
  - it now waits for load;
  - it re-checks title, text, DOM, frames and `cf-mitigated`/403/503 over a bounded 6 s window;
  - the fixed sleep was later replaced with `expect.poll`.
- TC-S-37 now passes only if the inbox controls are visible. Otherwise it skips as BLOCKED.

**Re-checks**
- TC-S-37 was re-verified twice and passed both times, because the inbox really was readable on those loads.
- In the same session, TC-C-01 was BLOCKED on receive-smss. Cloudflare on receive-smss is therefore **intermittent**.

**Re-runs**
- No `--repeat-each` was used on tests that make real calls.
- Healed tests were re-run once.

## Exploratory findings
See `docs/EXPLORATORY-FINDINGS-Customer-Signin.md`.
- **Route:** the MFA step renders inside `/login`, with heading "Multi-factor authentication" and button "Verify code" (the brief says "verify code").
- **Real account:** one real sign-in confirmed `user_not_found`.
- **Final route unverified:** a mocked success navigates to `/`, so the real route to `/apply-for-a-loan` is unverified.

## Data lineage
- **`CUSTOMER_EMAIL` / `CUSTOMER_PASSWORD`:** read from `.env` only. Used for one real `initiate` call in TC-S-60, which returned `user_not_found`.
- **Negative tests:** synthetic `qa.signin.<ts>@agrinextqa-nodomain-test.com` and yopmail addresses.
- **Mocked MFA:** code `123456`, a masked phone label and an unsigned mock id_token. Nothing real.
- **QA design:** traceability (REQ, BR, AC, TC) is in `docs/ACCEPTANCE-CRITERIA-Customer-Signin.md`, `docs/TEST-PLAN-Customer-Signin.md` and `docs/TEST-CASES-Customer-Signin.md`. The validation report is `qa/customer-signin/validation.md`.

## Final status
**FAILED: not release-ready.**
- **Defect:** 1 accessibility defect is failing (S-F-06).
- **Primary acceptance check unverified:** the real sign-in to `/apply-for-a-loan` cannot run because the configured account does not exist (S-F-01).
- **Automation status:** stable, with 0 flaky tests and 0 script failures.
- **To unblock TC-S-60:**
  - provide a registered customer account with SMS MFA on the shared number. Creating one through the app is blocked by the Cloudflare checks on yopmail and receive-smss, which are intermittent for receive-smss.
  - once the account exists, run `RUN_CUSTOMER_E2E=1 npm run test:customer:e2e`.
