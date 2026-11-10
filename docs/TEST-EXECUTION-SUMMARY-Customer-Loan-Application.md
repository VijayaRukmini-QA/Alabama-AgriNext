# Test Execution Summary: Customer Loan Application (Land & Home)

| Item | Value |
|---|---|
| Environment | Dev customer portal (`CUSTOMER_BASE_URL`), Google Chrome (Playwright `channel: 'chrome'`, project `customer-chrome`), headed |
| Tool | Playwright Test 1.65.0, TypeScript, POM |
| Date | 2026-11-10 |
| Final run | 11:33 UTC, 69 s, 3 workers. Evidence: `reports/loan-run-final.log`, `reports/loan-results.json`, `reports/loan-html-report/` (git-ignored) |
| Command | `npm run test:customer:loan`. UI mode: `npm run test:customer:loan:ui` |

UI mode (`--ui`) is interactive and needs a person at the keyboard. The automated execution therefore ran the same project headed on the Chrome channel. The UI-mode script is provided for interactive runs.

## Results (from the real run output)

| Metric | Count |
|---|---|
| Designed test cases | 66 (TC-L-01..66) |
| Automated and executed | 7 TCs (TC-L-01..06, TC-L-57), as 16 tests |
| Passed | 16 |
| Failed | 0 |
| Skipped | 0 |
| Flaky | 0 |
| Blocked, not automated | 58 TCs (TC-L-07..56 except 56, TC-L-58..66): require a signed-in customer (B-L1) |
| Manual | 1 TC (TC-L-56, opt-in/serial gate and record logging) |

The 16 executed tests:
- **TC-L-01 / 02:** signed-out loan routes show the public gate and no form.
- **TC-L-03:** where Sign in and Create profile lead.
- **TC-L-04:** accessible names and keyboard reach on 2 routes. axe is not installed, so the axe step stays manual.
- **TC-L-05:** 8 route variants.
- **TC-L-06:** blocker evidence. One real sign-in confirms `user_not_found`. This test will FAIL once the account exists, which is the signal to unblock the suite.
- **TC-L-57:** 2 static scans showing no SSN-shaped literal and no `LOAN_TEST_SSN` value in source, test data or reports.

No healing was needed: the first and the final run were both 16/16.

Real traffic: 1 real sign-in attempt per run (TC-L-06). There were no loan submissions, so no records were created in Dev.

## Defects and findings
No application defect was found in the reachable (signed-out) scope.

Findings:
- L-F-01: signed-out deep links keep the URL and are not redirected to `/login` with a return path (Q-L-01/02).
- L-F-02: the gate page has no headings or landmarks.
- L-F-03: CSS-uppercase button labels.
- L-F-04: the story test data is inconsistent (DOB 2001 vs farming since 2000).

See `docs/EXPLORATORY-FINDINGS-Customer-Loan-Application.md`.

## Automation coverage

| Scope | TCs | Automated |
|---|---|---|
| Signed-out access and data hygiene | 7 | 7 (100%) |
| Post-sign-in application flow (steps 1-45) | 58 | 0: blocked (B-L1) |
| Manual | 1 | n/a |
| **Total** | **66** | **7 (10.6%)** |

QA design artefacts, with full REQ, BR, AC, EDGE and TC traceability:
- `docs/ACCEPTANCE-CRITERIA-Customer-Loan-Application.md`
- `docs/TEST-PLAN-Customer-Loan-Application.md`
- `docs/TEST-CASES-Customer-Loan-Application.md`
- `qa/customer-loan/test-data.md`
- `qa/customer-loan/validation.md`

Validation gate: PASS with conditions. 6 High findings remain open (H1-H6), and the fixes are listed in `validation.md`.

## Final status
**BLOCKED: the loan application flow is untested.**
- Only the signed-out scope (10.6% of the designed cases) could be executed, and it passed.
- The suspension criterion (more than 20% blocked) is met: 88% of the cases are blocked.

To resume:
1. **Account:** provide a registered customer account with SMS MFA. For example, a person completes Create Profile manually, solving the yopmail and receive-smss checks themselves. Then set `CUSTOMER_EMAIL`/`CUSTOMER_PASSWORD` in `.env`.
2. **Exploration:** run exploration (EXP-L-01..10) to capture the real loan-screen locators.
3. **Page objects and specs:** build page objects and specs for TC-L-07..66.
4. **Before running submit tests:** agree on the record opt-in, the cleanup owner and record tracing (B-L3, Q-L-24/25).
