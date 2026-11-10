# Test Cases: Customer Loan Application - Land & Home

Source: `docs/ACCEPTANCE-CRITERIA-Customer-Loan-Application.md` (REQ-L-01..16, BR-L-01..08, AC-L-01..42, EDGE-L-01..36, Q-L-01..29, blockers B-L1..B-L3). House style: `docs/TEST-CASES-Customer-Signin.md`.
App: `CUSTOMER_BASE_URL`. Secrets are referenced by env var name only: `CUSTOMER_EMAIL`, `CUSTOMER_PASSWORD`, `SMS_INBOX_URL`, `CUSTOMER_BASE_URL`. SSN is only the test-data reference `LOAN_TEST_SSN` (synthetic, resolved at run time). No secret value and no SSN literal appears in this file.
Execution target: Playwright UI mode, Chrome channel.
Every TC carries `@customer @loan`. Priority: P0 blocks release, P1 high, P2 medium, P3 cosmetic or recording only. The technique is the bracketed prefix in the Title: EP, BVA, DT, ST, PW, EG, UC.

Status vocabulary:
- automatable-now: runs live with no account (signed-out routes, static checks).
- blocked (B-L1): needs the registered customer account behind `CUSTOMER_EMAIL`; real sign-in returns 400 `user_not_found` (AADSTS50034) and account creation is blocked by Cloudflare bot checks. Nothing after sign-in can be executed or explored.
- manual: human or process step.

Marker rule: every label, control type, rule, limit or message not observed live is written `[TBC – exploration blocked by B-L1; Q-L-nn]` with the linked question. Where the AC says "outcome is recorded", the expected result is an observation to record, not a pass/fail on an invented rule. No limits are invented. Values in the TD table that probe a boundary (for example 4.99, 5, 5.01) are probes taken from the AC, not claims about the rule.
Run policy (B-L3, BR-L-08): TC-L-43, TC-L-47, TC-L-49 and TC-L-66 each create a real Dev record. At most one submission per run; opt-in, serial, single run; the created record identifier is logged for cleanup (owner Q-L-25). Run these in separate opted-in runs, never in parallel, never looped, never retried automatically.

## Summary

Totals: 11 scenarios (TS-L-01..11), 66 test cases (TC-L-01..66), 3 decision tables (DT-L-01..03), 10 exploratory charters (EXP-L-01..10).

| By priority | P0 | P1 | P2 | P3 |
|---|---|---|---|---|
| TCs | 8 | 32 | 25 | 1 |

| By status | automatable-now | blocked (B-L1) | manual |
|---|---|---|---|
| TCs | 7 | 58 | 1 |

Main risks: B-L1 blocks 58 of 66 TCs, so all post-login steps and expected results are skeletal and marked TBC. Story data is internally inconsistent (DOB 09/09/2001 vs Year began farming 2000; Years with employer 11), see Q-L-18 and TC-L-30. Submit creates real Dev records (B-L3). Post-login accessibility has no AC yet (gap G-L-1).

## Precondition blocks

| ID | Block |
|---|---|
| PC-L-1 | Anonymous browser context, fresh storage, signed out. No account needed. |
| PC-L-2 | Registered, MFA-ready account behind `CUSTOMER_EMAIL` exists (B-L1 resolved, Q-L-29). Signed in per TD-L-01 (credentials, SMS code for "Alabama Ag Credit" read from `SMS_INBOX_URL`, Verify code). URL path is `/apply-for-a-loan`. Serialised, one session at a time. |
| PC-L-3 | PC-L-2 plus the Loan Information page open at `/loan-application-creation/loan-information` (steps 1-3 done). |
| PC-L-4 | PC-L-3 plus Loan Information completed with TD-L-02 and Continue clicked; "Collateral & Loan Amount" shown. |
| PC-L-5 | PC-L-4 plus Collateral & Loan Amount completed with TD-L-05 and Continue clicked; "Applicant Details" shown. |
| PC-L-6 | PC-L-5 plus Applicant Details completed with TD-L-10 and Continue clicked; "Co-Applicant Details" shown [acceptance of the story data is TBC – exploration blocked by B-L1; Q-L-18]. |
| PC-L-7 | PC-L-6 plus Continue clicked on Co-Applicant Details; "Income" shown. |
| PC-L-8 | PC-L-7 plus Income completed with TD-L-17 and Continue clicked; "Balance Sheet" shown. |
| PC-L-9 | PC-L-8 plus Balance Sheet completed with TD-L-19 (all No) and Continue clicked; "Application Summary" shown. |
| PC-L-10 | PC-L-9 plus Continue clicked on Application Summary; "Additional Terms & Agreements" shown, no box checked. |
| PC-L-11 | PC-L-10 plus the four boxes of TD-L-20 checked. Opt-in gated run (BR-L-08): the opt-in switch [name TBC, Q-L-24] is set, no submission made yet in this run, cleanup owner named (Q-L-25). |
| PC-L-12 | PC-L-11 plus page "SUBMIT APPLICATION" clicked; confirmation dialog open. |

Each post-login TC is independent: it starts from the named block and needs no other TC to have run. Blocks PC-L-4 to PC-L-12 are built by a shared fixture that replays the happy-path data, not by reusing state from another TC.

## Test data

References only appear in the TC table. SSN values are never stored: shape variants are derived at run time from `LOAN_TEST_SSN`.

| TD ID | Content | Source |
|---|---|---|
| TD-L-01 | Sign-in credentials by env var name: `CUSTOMER_EMAIL`, `CUSTOMER_PASSWORD`; SMS code from `SMS_INBOX_URL` (sender "Alabama Ag Credit"); base `CUSTOMER_BASE_URL` | brief |
| TD-L-02 | Loan Information story: Purchase or refinance = Purchase; Principal residence = Yes; Dwelling = No; Acres = 5.11 | brief |
| TD-L-03 | Acres probes: 0, 0.01, 4.99, 5, 5.01, 5.11, 5.111 (3 decimals), 1,000 (separator), 5,11 (comma decimal), -1, abc, empty, 99999999 (very large probe) | AC-L-06, EDGE-L-01, 02 |
| TD-L-04 | Loan Information alternates: Refinance; Principal residence = No; Dwelling = Yes. DT-L-01 band representatives: band A invalid = empty; band B below 5 = 4.99; band C 5 or more = 5.11 | AC-L-08, DT-L-01 |
| TD-L-05 | Collateral story: description text "Scenario : Customer apply for loan- Land & Home, with dwelling No and Acres more than / equal to 5, with AG Fast (160599)"; Estimated property value = 160599; Borrow amount = 160500; Property county = Barbour; Residence/HQ county = Barbour; Branch Office verified; Contact with different branch/lender = No; Active loan with Alabama Ag Credit = Yes | brief |
| TD-L-06 | Borrow probes with value 160599: 160598, 160599, 160600, 0, -1, abc, empty, 160500.50, "160,500", "$160500" | AC-L-10 |
| TD-L-07 | Value probes: 0, -1, 160599.99, 99999999999 (very large probe), empty. Order-edit probe: borrow 160500 entered first, then value edited to 160000 | EDGE-L-05, 06 |
| TD-L-08 | Description probes: empty; 1 character "A"; story text (about 100 characters); 5000 x "a" (long probe); whitespace only; `<script>alert(1)</script>`; `& < > " ' %`; emoji; non-Latin text; text with a newline; max and max+1 once Q-L-09 is answered | AC-L-11, EDGE-L-07 |
| TD-L-09 | County probes: Barbour/Barbour; a second pair of two other counties taken from the dropdown list [options TBC – exploration blocked by B-L1; Q-L-10]; default (nothing selected); first and last option of the list | AC-L-12, EDGE-L-08, 09, 35 |
| TD-L-10 | Applicant story: US citizen = Yes; DOB = 09/09/2001; Marital status = MARRIED; SSN = `LOAN_TEST_SSN`; Mailing address different = No; Contact preference = ANY; Employer name = Techwave; Years with employer = 11; Profession = Team Lead; Years in profession = 4; Year began farming = 2000 | brief |
| TD-L-11 | DOB probes: today; 17 years 364 days old; exactly 18 today; 18 tomorrow; 19; 99; 100 or more; future date; 02/30/2001; leap day 02/29/2000; 31/12/2001; 2001-09-09; 13/09/2001 (day-first proof); empty | AC-L-15, EDGE-L-11, 12 |
| TD-L-12 | Years probes (Years with employer, Years in profession, Year began farming): 0, 1, 99, 100, -1, 1.5, abc, empty; for Year began farming also a future year (2027), a 3-digit year (200), a 5-digit year (20000), a year equal to the birth year (2001) | AC-L-16, EDGE-L-14, 16 |
| TD-L-13 | SSN shape variants derived at run time from `LOAN_TEST_SSN` (no literals stored): reference value; with dashes; without dashes; 8 digits (last dropped); 10 digits (a digit appended); one digit replaced by a letter; with inner spaces; with leading/trailing space; empty; all same digit | AC-L-17, EDGE-L-17 |
| TD-L-14 | Story inconsistency set: DOB 09/09/2001; Year began farming 2000; Years with employer 11; Years in profession 4 (rule outcome unknown; corrected dataset [TBC – exploration blocked by B-L1; Q-L-18]) | AC-L-18, EDGE-L-13, 15, 16 |
| TD-L-15 | Applicant alternates: US citizen = No; each other Marital status option listed in the control [options TBC – exploration blocked by B-L1; Q-L-11]; Mailing address different = Yes; each other Contact preference option listed [options TBC – exploration blocked by B-L1; Q-L-11] | AC-L-19 |
| TD-L-16 | Employer/Profession probes: Techwave; Team Lead; empty; `O'Brien & Sons`; non-Latin text; 500 x "a" (long probe); max and max+1 once Q-L-09 is answered | AC-L-14, EDGE-L-19 |
| TD-L-17 | Income story: Salary/Wages = 12000 | brief |
| TD-L-18 | Salary probes: 0, 0.01, -1, 12000.50, "12,000", "$12000", abc, empty, 999999999999 (very large probe) | AC-L-23, EDGE-L-21 |
| TD-L-19 | Balance Sheet: all four declarations = No (FCA director/employee/relative; bankruptcy in 7 years; judgments/suits pending; foreclosure/deed in lieu/debt forgiveness in 7 years). Variants: each declaration = Yes in turn; each left unanswered in turn | brief, AC-L-25 |
| TD-L-20 | Agreements: A1 Financial Report and Bylaw Disclosure; A2 Patronage and Investment Information; A3 right to receive an Appraisal Report; A4 authorization to run a credit check. Combinations: the 16 rows of DT-L-02 | brief, AC-L-29 |
| TD-L-21 | Signed-out routes: `/apply-for-a-loan`; `/loan-application-creation/loan-information`; variants: query string `?ref=test`, trailing slash, uppercase path `/APPLY-FOR-A-LOAN`, stale session cookie (cleared or garbage value) | AC-L-39..42, EDGE-L-36 |
| TD-L-22 | Fault injection on the submit request via `page.route`: HTTP 500; request abort (timeout); delayed response; success after a first failure. Request URL pattern [TBC – exploration blocked by B-L1; Q-L-26] | AC-L-34 |
| TD-L-23 | Unregistered-account evidence: `CUSTOMER_EMAIL` / `CUSTOMER_PASSWORD` used at `/login` while the account does not exist (B-L1) | AC-L-02 |
| TD-L-24 | Session expiry simulation: clear session cookies and storage in the context, or wait for timeout once known [method and timeout TBC – exploration blocked by B-L1; Q-L-28] | AC-L-37 |
| TD-L-25 | Viewports: desktop 1280x720; narrow 375x667; touch emulation with no hover | EDGE-L-34 |

## Scenarios

| ID | Scenario | TCs |
|---|---|---|
| TS-L-01 | Signed-out access to the loan routes (public page, no redirect, no form) | TC-L-01..06 |
| TS-L-02 | Precondition sign-in and navigation to Start Application | TC-L-07..10 |
| TS-L-03 | Loan Information step | TC-L-11..17 |
| TS-L-04 | Collateral & Loan Amount step | TC-L-18..24 |
| TS-L-05 | Applicant Details step | TC-L-25..33 |
| TS-L-06 | Co-Applicant, Income, Balance Sheet, Application Summary | TC-L-34..40 |
| TS-L-07 | Additional Terms & Agreements, submission and confirmation | TC-L-41..49 |
| TS-L-08 | Navigation, draft resume, session and concurrency | TC-L-50..55 |
| TS-L-09 | Data impact and SSN handling | TC-L-56, 57 |
| TS-L-10 | Accessibility (post-login) and UI | TC-L-58..65 |
| TS-L-11 | End-to-end happy path, steps 1-45 | TC-L-66 |

## Test cases

Columns: ID, Title, REQ, AC, BR, EDGE, Type, Priority, Tags, Status, Preconditions, Steps, Test data, Expected result. "none" means no upstream ID applies.

### TS-L-01 Signed-out route access

| ID | Title | REQ | AC | BR | EDGE | Type | Priority | Tags | Status | Preconditions | Steps | Test data | Expected result |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-L-01 | [UC] Signed-out /apply-for-a-loan shows the public page, no redirect, no form | REQ-L-12 | AC-L-39 | BR-L-01, BR-L-06 | none | negative | P1 | @customer @loan @smoke @regression @negative | automatable-now | PC-L-1 | 1. Open `CUSTOMER_BASE_URL` + `/apply-for-a-loan` 2. Wait for load 3. Read the final URL path 4. Look for buttons "SIGN IN" and "CREATE PROFILE" 5. Count loan form controls | TD-L-21 | Final URL path is `/apply-for-a-loan` (no redirect). Buttons "SIGN IN" and "CREATE PROFILE" are visible. No loan application form control is present. |
| TC-L-02 | [UC] Signed-out loan-information route shows the public page, no form | REQ-L-12 | AC-L-40 | BR-L-01, BR-L-06 | none | negative | P1 | @customer @loan @smoke @regression @negative | automatable-now | PC-L-1 | 1. Open `CUSTOMER_BASE_URL` + `/loan-application-creation/loan-information` 2. Wait for load 3. Read the final URL path 4. Look for buttons "SIGN IN" and "CREATE PROFILE" 5. Look for text "Purchase or refinance?", text "How many acres?" and a Continue button | TD-L-21 | Final URL path is `/loan-application-creation/loan-information`. "SIGN IN" and "CREATE PROFILE" are visible. "Purchase or refinance?", "How many acres?" and a Continue button are absent. |
| TC-L-03 | [EP] SIGN IN and CREATE PROFILE on the signed-out loan route go to their destinations | REQ-L-12 | AC-L-41 | none | none | navigation | P2 | @customer @loan @regression | automatable-now | PC-L-1, open `/loan-application-creation/loan-information` fresh for each step pair | 1. Click "SIGN IN" 2. Record the final URL path and whether the requested loan route is remembered 3. Open the route again from a fresh load 4. Click "CREATE PROFILE" 5. Record the final URL path | TD-L-21 | Destinations are recorded as observations. Expected as on the landing page: `/login` and `/create-profile` (not yet observed from this route, Q-L-02). Whether login returns to the loan route is recorded, no assertion (Q-L-02). |
| TC-L-04 | [EP] Signed-out loan routes: SIGN IN and CREATE PROFILE are named and keyboard reachable | REQ-L-12, REQ-L-14 | AC-L-42 | none | none | a11y | P2 | @customer @loan @regression @a11y | automatable-now | PC-L-1 | 1. Open `/apply-for-a-loan` 2. Run an axe scan 3. Press Tab until "SIGN IN" has focus 4. Press Tab until "CREATE PROFILE" has focus 5. Repeat steps 1-4 on `/loan-application-creation/loan-information` | TD-L-21 | Both controls have accessible names "SIGN IN" and "CREATE PROFILE" and are reachable by keyboard. axe findings are recorded against the signed-out public page only; none is attributed to the loan form. |
| TC-L-05 | [EG] Signed-out route variants (query string, trailing slash, uppercase, stale cookie) still show the public page | REQ-L-12 | AC-L-39, AC-L-40 | BR-L-06 | EDGE-L-36 | validation | P2 | @customer @loan @regression @negative | automatable-now | PC-L-1 | For each variant: 1. Open the `/apply-for-a-loan` variant 2. Record the final URL 3. Check "SIGN IN" and "CREATE PROFILE" 4. Check no loan form control 5. Repeat for the loan-information variant | TD-L-21 | For each variant the public page shows "SIGN IN" and "CREATE PROFILE" and no loan form control. Final URL (normalised or not) is recorded as an observation; no loan form, no error page, no stack trace. |
| TC-L-06 | [EP] Unregistered CUSTOMER_EMAIL cannot sign in and no loan route is reachable as a customer | REQ-L-01 | AC-L-02 | BR-L-01 | none | negative | P2 | @customer @loan @regression @negative | automatable-now | PC-L-1, open `/login`. Evidence of B-L1, not a loan defect; references sign-in AC-05 | 1. Type `CUSTOMER_EMAIL` in "Email address" 2. Type `CUSTOMER_PASSWORD` in "Password" 3. Click "Sign in" once 4. Wait for the response 5. Open `/apply-for-a-loan` | TD-L-23 | Alert text "Invalid email or password." is shown. URL path stays `/login`. No code step. `/apply-for-a-loan` then shows the public page with "SIGN IN" and "CREATE PROFILE". Single attempt only; never looped. |

### TS-L-02 Precondition sign-in and navigation

| ID | Title | REQ | AC | BR | EDGE | Type | Priority | Tags | Status | Preconditions | Steps | Test data | Expected result |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-L-07 | [UC] Verified SMS code lands the customer on /apply-for-a-loan | REQ-L-01 | AC-L-01 | BR-L-01 | none | functional | P0 | @customer @loan @smoke @regression | blocked (B-L1) | PC-L-1, account exists and is MFA-registered (Q-L-29) | 1. Open `/login` 2. Type `CUSTOMER_EMAIL` 3. Type `CUSTOMER_PASSWORD` 4. Click "Sign in" 5. Read the "Alabama Ag Credit" code at `SMS_INBOX_URL` 6. Type the code 7. Click "Verify code" | TD-L-01 | URL path is `/apply-for-a-loan`. Page content beyond the URL [TBC – exploration blocked by B-L1; Q-L-29]. |
| TC-L-08 | [UC] Menu path apply for loan, Land & Home, Start Application opens Loan Information | REQ-L-02 | AC-L-03 | BR-L-02 | EDGE-L-34 | navigation | P0 | @customer @loan @smoke @regression | blocked (B-L1) | PC-L-2 | 1. Click "apply for loan" in the main menu 2. Hover "Land & Home" 3. Click "Start Application" | TD-L-01 | URL path is `/loan-application-creation/loan-information`. Menu structure and any submenu labels beyond those three [TBC – exploration blocked by B-L1; Q-L-03]. |
| TC-L-09 | [UC] Loan Information page shows its four questions | REQ-L-02 | AC-L-04 | BR-L-02 | none | UI | P1 | @customer @loan @regression | blocked (B-L1) | PC-L-3 | 1. Wait for the page to load 2. List visible question labels and control types | TD-L-02 | Loan Information page is displayed with four questions (purchase or refinance, principal residence, dwelling, acres). Exact labels and control types [TBC – exploration blocked by B-L1; Q-L-03, Q-L-12]. |
| TC-L-10 | [EG] Land & Home menu has a keyboard alternative to hover | REQ-L-02, REQ-L-14 | AC-L-03 | none | EDGE-L-34 | a11y | P2 | @customer @loan @regression @a11y | blocked (B-L1) | PC-L-2 | 1. Press Tab until "apply for loan" has focus 2. Press Enter 3. Press Tab or arrow keys to reach "Land & Home" 4. Press Enter on "Land & Home" 5. Reach "Start Application" and press Enter | TD-L-01 | "Start Application" is reachable and activatable with keyboard only, and the URL path becomes `/loan-application-creation/loan-information`; if not, the gap is recorded as a finding. Key behaviour [TBC – exploration blocked by B-L1; Q-L-03]. |

### TS-L-03 Loan Information

| ID | Title | REQ | AC | BR | EDGE | Type | Priority | Tags | Status | Preconditions | Steps | Test data | Expected result |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-L-11 | [UC] Loan Information story answers lead to Collateral & Loan Amount | REQ-L-03 | AC-L-05 | BR-L-02, BR-L-03 | none | functional | P0 | @customer @loan @smoke @regression | blocked (B-L1) | PC-L-3 | 1. Choose Purchase for "Purchase or refinance?" 2. Choose Yes for "Principal residence?" 3. Choose No for "Dwelling on the property?" 4. Enter 5.11 in "How many acres?" 5. Click Continue | TD-L-02 | Step heading "Collateral & Loan Amount" is shown. Control types and any inline text [TBC – exploration blocked by B-L1; Q-L-03]. DT-L-01 rule R21. |
| TC-L-12 | [BVA] Acres boundary values around 5 and zero | REQ-L-03 | AC-L-06 | none | EDGE-L-01 | boundary | P1 | @customer @loan @regression | blocked (B-L1) | PC-L-3, other answers valid (Purchase, Yes, No) | For each acres value: 1. Enter the value 2. Click Continue 3. Record the outcome (next step, stay, message text) 4. Reload PC-L-3 | TD-L-03 (0, 0.01, 4.99, 5, 5.01, 5.11, 5.111, 1,000) | Each outcome is recorded. No value the confirmed rule rejects is accepted. Accept/reject limits and decimal precision [TBC – exploration blocked by B-L1; Q-L-05]. Whether 5 is the AG Fast threshold [TBC – exploration blocked by B-L1; Q-L-06]. |
| TC-L-13 | [EP] Acres invalid input (negative, text, comma decimal, empty, very large) | REQ-L-03 | AC-L-06 | none | EDGE-L-02 | negative | P2 | @customer @loan @regression @negative | blocked (B-L1) | PC-L-3, other answers valid | For each value: 1. Enter the value in "How many acres?" 2. Click Continue 3. Record outcome and message text | TD-L-03 (-1, abc, 5,11, empty, 99999999) | User stays on Loan Information or the outcome is recorded; no crash, no error page. Message text and position [TBC – exploration blocked by B-L1; Q-L-12]. |
| TC-L-14 | [EP] Each Loan Information question left unanswered blocks or reports on Continue | REQ-L-03 | AC-L-07 | none | EDGE-L-20 | mandatory | P1 | @customer @loan @regression @negative | blocked (B-L1) | PC-L-3 | For each of the four questions in turn: 1. Answer the other three per TD-L-02 2. Leave this one unanswered 3. Click Continue 4. Record whether the page advances and the message | TD-L-02 | Outcome per field recorded (blocked or advanced; message text). Mandatory set, message and Continue state [TBC – exploration blocked by B-L1; Q-L-12, Q-L-13]. |
| TC-L-15 | [DT] Loan Information combinations of purchase/refinance, residence, dwelling and acres band | REQ-L-03 | AC-L-08 | BR-L-03 | EDGE-L-03 | functional | P2 | @customer @loan @regression | blocked (B-L1) | PC-L-3 | For each rule R1..R24 of DT-L-01 except R21: 1. Choose the three answers 2. Enter the band representative acres 3. Record the visible fields 4. Click Continue 5. Record the resulting step | TD-L-04, TD-L-02 | Outcome per rule recorded: extra fields, different next step, or block. Every outcome other than R21 is [TBC – exploration blocked by B-L1; Q-L-04, Q-L-05, Q-L-06]. |
| TC-L-16 | [EG] Direct URL to a later step is not usable without completing earlier steps | REQ-L-15 | none | BR-L-02 | EDGE-L-25 | negative | P2 | @customer @loan @regression @negative | blocked (B-L1) | PC-L-2 (no application started) | 1. Open a later step URL directly (step URL pattern is unobserved) 2. Record the final URL and visible heading | TD-L-01 | Outcome recorded: redirect to Loan Information, an error, or the later step. Behaviour [TBC – exploration blocked by B-L1; Q-L-27]. Signed-out analogue is TC-L-02. |
| TC-L-17 | [EG] Double click on Continue does not duplicate or skip steps | REQ-L-03 | none | BR-L-03 | EDGE-L-29 | negative | P2 | @customer @loan @regression @negative | blocked (B-L1) | PC-L-3, Loan Information filled per TD-L-02 | 1. Double click Continue 2. Record the step heading and URL 3. Press browser Back once | TD-L-02 | "Collateral & Loan Amount" is shown once, not skipped to a later step; no error message. Whether a duplicate record is created [TBC – exploration blocked by B-L1; Q-L-26]. |

### TS-L-04 Collateral & Loan Amount

| ID | Title | REQ | AC | BR | EDGE | Type | Priority | Tags | Status | Preconditions | Steps | Test data | Expected result |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-L-18 | [UC] Collateral & Loan Amount story data leads to Applicant Details | REQ-L-04 | AC-L-09 | BR-L-03 | none | functional | P0 | @customer @loan @smoke @regression | blocked (B-L1) | PC-L-4 | 1. Enter the description text in "Help us understand what you are planning to finance" 2. Enter 160599 as Estimated property value 3. Enter 160500 as Borrow amount 4. Select Barbour in Property county 5. Select Barbour in Residence/HQ county 6. Verify the Branch Office 7. Choose No for Contact with different branch/lender? 8. Choose Yes for Active loan with Alabama Ag Credit? 9. Click Continue | TD-L-05 | Step heading "Applicant Details" is shown. Branch Office value shown [TBC – exploration blocked by B-L1; Q-L-10]. |
| TC-L-19 | [BVA] Borrow amount around Estimated property value 160599 | REQ-L-04 | AC-L-10 | none | EDGE-L-04, EDGE-L-05 | boundary | P1 | @customer @loan @regression | blocked (B-L1) | PC-L-4, other fields valid per TD-L-05, value 160599 | For each borrow value: 1. Enter the value 2. Click Continue 3. Record outcome and message | TD-L-06 | Each outcome recorded (accepted, rejected, message). No assertion that borrow above value is rejected until the rule is confirmed [TBC – exploration blocked by B-L1; Q-L-07]. Format handling of "160,500" and "$160500" [TBC – exploration blocked by B-L1; Q-L-08]. |
| TC-L-20 | [DT] Value edited after borrow entered so borrow now exceeds value | REQ-L-04 | AC-L-10 | none | EDGE-L-06 | validation | P2 | @customer @loan @regression | blocked (B-L1) | PC-L-4 | 1. Enter borrow 160500 2. Enter value 160599 3. Edit value to 160000 4. Record any message at once 5. Click Continue 6. Record outcome | TD-L-07 | Outcome recorded: message on edit, message on Continue, or none. Validation order and rule [TBC – exploration blocked by B-L1; Q-L-07, Q-L-13]. |
| TC-L-21 | [BVA] Financing description text length and content | REQ-L-04 | AC-L-11 | none | EDGE-L-07 | boundary | P2 | @customer @loan @regression | blocked (B-L1) | PC-L-4, other fields valid | For each text: 1. Enter or paste the text 2. Record any counter or truncation 3. Click Continue 4. Record outcome | TD-L-08 | Each outcome recorded (counter, truncation, message, accepted). Script-like text is not executed and no dialog appears. Maximum length [TBC – exploration blocked by B-L1; Q-L-09]. |
| TC-L-22 | [EP] Property and Residence/HQ county selection and Branch Office shown | REQ-L-04 | AC-L-12 | none | EDGE-L-08, EDGE-L-35 | functional | P2 | @customer @loan @regression | blocked (B-L1) | PC-L-4 | 1. Select Barbour in both county dropdowns 2. Record the Branch Office shown 3. Select the second county pair 4. Record the Branch Office shown 5. Open each dropdown and scroll to the last option | TD-L-09 | Branch Office for Barbour is recorded and changes with county only as the confirmed mapping says. List length, typeahead and scroll behaviour recorded. Mapping [TBC – exploration blocked by B-L1; Q-L-10]. |
| TC-L-23 | [EG] Branch Office verify control not acted on | REQ-L-04 | none | none | EDGE-L-10 | mandatory | P2 | @customer @loan @regression @negative | blocked (B-L1) | PC-L-4, all other fields valid per TD-L-05 | 1. Fill every field except the Branch Office verification 2. Click Continue 3. Record outcome and message | TD-L-05 | Outcome recorded (advanced or blocked, message text). Verify control type and whether it is required [TBC – exploration blocked by B-L1; Q-L-10, Q-L-12]. |
| TC-L-24 | [EP] Each Collateral & Loan Amount field left empty blocks or reports on Continue | REQ-L-04 | AC-L-13 | none | EDGE-L-09, EDGE-L-20 | mandatory | P1 | @customer @loan @regression @negative | blocked (B-L1) | PC-L-4 | For each field in turn (description, value, borrow, Property county, Residence/HQ county, the two Yes/No questions): 1. Fill all other fields per TD-L-05 2. Leave this one empty or at default 3. Click Continue 4. Record outcome | TD-L-05, TD-L-09 | User stays on the step (or outcome recorded) and the message per field is recorded. Mandatory set [TBC – exploration blocked by B-L1; Q-L-12]. |

### TS-L-05 Applicant Details

| ID | Title | REQ | AC | BR | EDGE | Type | Priority | Tags | Status | Preconditions | Steps | Test data | Expected result |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-L-25 | [UC] Applicant Details story data is submitted with SSN from LOAN_TEST_SSN | REQ-L-05 | AC-L-14 | BR-L-03, BR-L-07 | none | functional | P0 | @customer @loan @regression | blocked (B-L1) | PC-L-5 | 1. Choose Yes for US citizen 2. Enter 09/09/2001 as DOB 3. Choose MARRIED as Marital status 4. Enter the SSN resolved from `LOAN_TEST_SSN` 5. Choose No for Mailing address different? 6. Choose ANY as Contact preference 7. Enter Techwave as Employer name 8. Enter 11 as Years with employer 9. Enter Team Lead as Profession 10. Enter 4 as Years in profession 11. Enter 2000 as Year began farming 12. Click Continue | TD-L-10, TD-L-13 | The outcome is recorded. Intended result: "Co-Applicant Details" step shown. Whether the system accepts the story data [TBC – exploration blocked by B-L1; Q-L-18]. Screenshots and traces do not show the SSN. |
| TC-L-26 | [BVA] DOB boundaries, invalid dates and formats | REQ-L-05 | AC-L-15 | none | EDGE-L-11, EDGE-L-12 | boundary | P1 | @customer @loan @regression | blocked (B-L1) | PC-L-5, other fields valid per TD-L-10 | For each DOB value: 1. Enter or pick the value 2. Click Continue 3. Record outcome and message | TD-L-11 | Each outcome recorded; date format, typing versus picker and day-first versus month-first handling recorded (13/09/2001 distinguishes them). Min and max age and format [TBC – exploration blocked by B-L1; Q-L-14]. |
| TC-L-27 | [BVA] Years with employer, Years in profession and Year began farming limits | REQ-L-05 | AC-L-16 | none | EDGE-L-14, EDGE-L-16 | boundary | P2 | @customer @loan @regression | blocked (B-L1) | PC-L-5, other fields valid | For each field in turn and each value: 1. Enter the value 2. Click Continue 3. Record outcome and message | TD-L-12 | Each outcome recorded. Limits, decimals and future-year handling [TBC – exploration blocked by B-L1; Q-L-15]. |
| TC-L-28 | [BVA] SSN shape variants derived from LOAN_TEST_SSN | REQ-L-05 | AC-L-17 | BR-L-07 | EDGE-L-17 | boundary | P1 | @customer @loan @regression @negative | blocked (B-L1) | PC-L-5, other fields valid per TD-L-10 | For each SSN variant: 1. Derive the variant at run time from `LOAN_TEST_SSN` 2. Enter it in SSN 3. Click Continue 4. Record outcome and message without logging the typed value | TD-L-13 | Each outcome recorded (accepted, rejected, message). No literal SSN in logs, traces or screenshots (masked or redacted). Format and validation rule [TBC – exploration blocked by B-L1; Q-L-16]. |
| TC-L-29 | [EP] SSN is masked on screen and in the Application Summary | REQ-L-05, REQ-L-09 | AC-L-17, AC-L-27 | BR-L-07 | EDGE-L-18 | validation | P1 | @customer @loan @regression | blocked (B-L1) | PC-L-9 (Application Summary shown; SSN entered earlier from `LOAN_TEST_SSN`) | 1. Read the SSN display on the summary 2. Open the Applicant Details step again and read the field type 3. Inspect whether the value is present in the DOM and the request payload without printing it | TD-L-10, TD-L-13 | Masking on screen and in the summary is recorded as the confirmed rule says. Masking, payload and storage handling [TBC – exploration blocked by B-L1; Q-L-17]. The value itself is never written to a report. |
| TC-L-30 | [DT] Story data inconsistency: DOB 2001 vs Year began farming 2000 and Years with employer 11 | REQ-L-05 | AC-L-18 | none | EDGE-L-13, EDGE-L-15, EDGE-L-16 | exploratory | P1 | @customer @loan @regression | blocked (B-L1) | PC-L-5 | 1. Enter the TD-L-14 values with the other fields per TD-L-10 2. Click Continue 3. Record accepted or rejected and the message 4. Repeat with Year began farming equal to the birth year (2001) 5. Record outcome | TD-L-14, TD-L-12 | Observation only; no pass or fail is decided. Outcome per DT-L-03 row recorded. Cross-field rules and a corrected dataset [TBC – exploration blocked by B-L1; Q-L-18]. |
| TC-L-31 | [PW] Applicant alternates: citizenship, marital status, mailing address, contact preference | REQ-L-05 | AC-L-19 | none | none | functional | P2 | @customer @loan @regression | blocked (B-L1) | PC-L-5 | For each alternate: 1. Set the alternate answer, other fields per TD-L-10 2. Record extra fields or messages 3. Click Continue 4. Record the step shown | TD-L-15, TD-L-10 | Extra fields or messages recorded per alternate. What each alternate changes [TBC – exploration blocked by B-L1; Q-L-11, Q-L-19]. |
| TC-L-32 | [EP] Each Applicant Details field left empty blocks or reports on Continue | REQ-L-05 | AC-L-20 | none | EDGE-L-20 | mandatory | P1 | @customer @loan @regression @negative | blocked (B-L1) | PC-L-5 | For each of the 11 fields in turn: 1. Fill all other fields per TD-L-10 2. Leave this one empty 3. Click Continue 4. Record outcome and message | TD-L-10 | Outcome per field recorded. Mandatory set, messages and Continue state [TBC – exploration blocked by B-L1; Q-L-12]. |
| TC-L-33 | [BVA] Employer name and Profession text content and length | REQ-L-05 | AC-L-14 | none | EDGE-L-19 | boundary | P3 | @customer @loan @regression | blocked (B-L1) | PC-L-5, other fields valid | For each text and each field: 1. Enter the text 2. Click Continue 3. Record outcome | TD-L-16 | Each outcome recorded; script-like or special characters do not break the page. Maximum length [TBC – exploration blocked by B-L1; Q-L-09]. |

### TS-L-06 Co-Applicant, Income, Balance Sheet, Summary

| ID | Title | REQ | AC | BR | EDGE | Type | Priority | Tags | Status | Preconditions | Steps | Test data | Expected result |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-L-34 | [UC] Continue on Co-Applicant Details with no data opens Income | REQ-L-06 | AC-L-21 | BR-L-03 | EDGE-L-22 | functional | P1 | @customer @loan @regression | blocked (B-L1) | PC-L-6 | 1. Click Continue without entering data | none | Step heading "Income" is shown. Co-applicant fields and whether the step is optional [TBC – exploration blocked by B-L1; Q-L-20]. |
| TC-L-35 | [UC] Income with Salary/Wages 12000 opens Balance Sheet | REQ-L-07 | AC-L-22 | BR-L-03 | none | functional | P1 | @customer @loan @regression | blocked (B-L1) | PC-L-7 | 1. Enter 12000 in Salary/Wages 2. Click Continue | TD-L-17 | Step heading "Balance Sheet" is shown. Period (monthly or annual) and currency format [TBC – exploration blocked by B-L1; Q-L-21]. |
| TC-L-36 | [BVA] Salary/Wages boundaries and formats | REQ-L-07 | AC-L-23 | none | EDGE-L-21 | boundary | P2 | @customer @loan @regression | blocked (B-L1) | PC-L-7 | For each value: 1. Enter the value 2. Click Continue 3. Record outcome and message | TD-L-18 | Each outcome recorded. Limits, decimals, separators and symbol handling [TBC – exploration blocked by B-L1; Q-L-21]. |
| TC-L-37 | [UC] Balance Sheet all four declarations No opens Application Summary | REQ-L-08 | AC-L-24 | BR-L-03 | none | functional | P1 | @customer @loan @regression | blocked (B-L1) | PC-L-8 | 1. Answer No to the FCA director/employee/relative declaration 2. Answer No to bankruptcy in 7 years 3. Answer No to judgments/suits pending 4. Answer No to foreclosure/deed in lieu/debt forgiveness in 7 years 5. Click Continue | TD-L-19 | Step heading "Application Summary" is shown. Control type [TBC – exploration blocked by B-L1; Q-L-12]. |
| TC-L-38 | [EP] Balance Sheet with a Yes answer or an unanswered declaration | REQ-L-08 | AC-L-25 | none | EDGE-L-20, EDGE-L-23 | negative | P2 | @customer @loan @regression @negative | blocked (B-L1) | PC-L-8 | For each of the four declarations: 1. Answer it Yes, the others No 2. Record extra questions or warnings 3. Click Continue 4. Record outcome. Then for each declaration: 5. Leave it unanswered, the others No 6. Click Continue 7. Record outcome | TD-L-19 | Outcome recorded per variant (extra questions, block, warning, advance). Yes handling and unanswered handling [TBC – exploration blocked by B-L1; Q-L-22, Q-L-12]. |
| TC-L-39 | [UC] Application Summary lists entered values and Continue opens Additional Terms & Agreements | REQ-L-09 | AC-L-26 | BR-L-03 | none | functional | P1 | @customer @loan @regression | blocked (B-L1) | PC-L-9 | 1. Read the summary content 2. Click Continue | TD-L-02, TD-L-05, TD-L-10, TD-L-17, TD-L-19 | The summary lists the values entered in earlier steps. Step heading "Additional Terms & Agreements" is shown after Continue. Summary layout and sections [TBC – exploration blocked by B-L1; Q-L-12]. |
| TC-L-40 | [EP] Summary values equal the values entered, no loss or reformatting | REQ-L-09 | AC-L-27 | none | EDGE-L-18 | validation | P1 | @customer @loan @regression | blocked (B-L1) | PC-L-9 | 1. Compare each summary value with the entered value (acres, property value, borrow, counties, DOB, employer, years, salary, declarations) 2. Record differences 3. Check the SSN display | TD-L-02, TD-L-05, TD-L-10, TD-L-17, TD-L-19 | Every value equals what was entered, except display reformatting the confirmed rule allows (recorded). SSN display is masked as the confirmed rule says [TBC – exploration blocked by B-L1; Q-L-17]. |

### TS-L-07 Terms and submission

| ID | Title | REQ | AC | BR | EDGE | Type | Priority | Tags | Status | Preconditions | Steps | Test data | Expected result |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-L-41 | [DT] All four agreements checked makes SUBMIT APPLICATION available | REQ-L-10 | AC-L-28 | BR-L-05 | none | functional | P0 | @customer @loan @regression | blocked (B-L1) | PC-L-10 | 1. Check "Financial Report and Bylaw Disclosure" 2. Check "Patronage and Investment Information" 3. Check the right to receive an Appraisal Report 4. Check the authorization to run a credit check 5. Read the state of the four boxes and of "SUBMIT APPLICATION" | TD-L-20 | All four boxes are checked and SUBMIT APPLICATION is available (DT-L-02 R16). Box label wording and agreement text links [TBC – exploration blocked by B-L1; Q-L-19]. |
| TC-L-42 | [DT] Fewer than four agreements checked, per combination | REQ-L-10 | AC-L-29 | BR-L-05 | none | negative | P1 | @customer @loan @regression @negative | blocked (B-L1) | PC-L-10 | For each of the 15 combinations R1..R15 of DT-L-02: 1. Check exactly the boxes of the rule 2. Record the state of "SUBMIT APPLICATION" 3. If enabled, click it and record whether a dialog opens or a message shows (do not confirm the dialog) | TD-L-20 | Outcome per combination recorded (disabled, message, dialog opens). Whether each agreement is mandatory [TBC – exploration blocked by B-L1; Q-L-19]. Nothing is submitted. |
| TC-L-43 | [UC] Submit with four agreements: page then dialog SUBMIT APPLICATION shows the Skip feedback screen (gated) | REQ-L-11, REQ-L-13 | AC-L-30 | BR-L-04, BR-L-08 | none | functional | P0 | @customer @loan @regression | blocked (B-L1) | PC-L-11 | 1. Click "SUBMIT APPLICATION" on the page 2. Wait for the confirmation dialog 3. Click "SUBMIT APPLICATION" in the dialog 4. Wait for the next screen 5. Log the created record identifier if shown | TD-L-20 | The next screen with "Skip feedback & continue" is shown. Exactly one submission in this run. Dialog text, confirmation or application number [TBC – exploration blocked by B-L1; Q-L-23]. Creates a real Dev record (B-L3). |
| TC-L-44 | [ST] Page SUBMIT APPLICATION opens the dialog and does not submit by itself | REQ-L-11 | AC-L-30 | BR-L-04 | none | functional | P1 | @customer @loan @regression | blocked (B-L1) | PC-L-11 | 1. Click "SUBMIT APPLICATION" on the page 2. Record that a confirmation dialog is visible 3. Record that the page behind still shows the agreements step | TD-L-20 | A confirmation dialog is shown. No "Skip feedback & continue" screen has appeared yet. No submit request fired before the dialog button is clicked [request URL TBC – exploration blocked by B-L1; Q-L-26]. |
| TC-L-45 | [ST] Dismissing the confirmation dialog submits nothing and keeps the data | REQ-L-11 | AC-L-31 | BR-L-04 | none | negative | P1 | @customer @loan @regression @negative | blocked (B-L1) | PC-L-12 | 1. Dismiss the dialog with its close control 2. Record the page state 3. Reopen the dialog with page "SUBMIT APPLICATION" 4. Press Escape 5. Record the page state | TD-L-20 | No application is submitted; the page behind keeps all data and the four boxes stay checked. Dismiss control names (close, Cancel) [TBC – exploration blocked by B-L1; Q-L-23]. |
| TC-L-46 | [UC] Skip feedback & continue leaves the post-submit screen | REQ-L-11 | AC-L-32 | none | none | functional | P1 | @customer @loan @regression | blocked (B-L1) | Post-submit screen reached (opt-in gated run, one submission, see PC-L-11) | 1. Click "Skip feedback & continue" 2. Record the final URL and heading 3. Look for the submitted application and its status | none | The destination is recorded; the submitted application is listed with a status. Destination, list and status [TBC – exploration blocked by B-L1; Q-L-23]. Shares the single submission of its run. |
| TC-L-47 | [EG] Double click on the dialog SUBMIT APPLICATION creates exactly one application (gated) | REQ-L-11 | AC-L-33 | BR-L-04, BR-L-08 | EDGE-L-30 | negative | P1 | @customer @loan @regression @negative | blocked (B-L1) | PC-L-12 (opt-in gated run, this TC is the run's single submission) | 1. Double click "SUBMIT APPLICATION" in the dialog 2. Wait for the next screen 3. Count applications in the list 4. Record any error | TD-L-20 | Exactly one application is created and no error is shown. Idempotency rule [TBC – exploration blocked by B-L1; Q-L-26]. Creates a real Dev record (B-L3). |
| TC-L-48 | [EG] Submit fails (5xx, timeout): error shown, retry possible, no duplicate | REQ-L-11 | AC-L-34 | BR-L-04 | EDGE-L-33 | negative | P1 | @customer @loan @regression @negative | blocked (B-L1) | PC-L-12; the submit request is intercepted with `page.route` | For each fault: 1. Click "SUBMIT APPLICATION" in the dialog 2. Record the message 3. Click again to retry once the fault is lifted 4. Count applications created | TD-L-22 | The user sees an error, can retry, and no duplicate application results. Message text and retry rule [TBC – exploration blocked by B-L1; Q-L-26]. Intercepted faults must not reach the real submit endpoint. |
| TC-L-49 | [ST] Browser Back or Refresh after a successful submit does not resubmit (gated) | REQ-L-11 | none | BR-L-08 | EDGE-L-31 | negative | P1 | @customer @loan @regression @negative | blocked (B-L1) | Post-submit screen reached (opt-in gated run, one submission) | 1. Press browser Back 2. Record the page 3. Go forward 4. Press Refresh 5. Count applications in the list | none | No second application is created; page shows a recorded state (confirmation, list or a safe screen). Behaviour [TBC – exploration blocked by B-L1; Q-L-23]. Shares the single submission of its run. |

### TS-L-08 Navigation, draft resume, session and concurrency

| ID | Title | REQ | AC | BR | EDGE | Type | Priority | Tags | Status | Preconditions | Steps | Test data | Expected result |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-L-50 | [ST] In-page Back and browser Back retain previously entered values | REQ-L-15 | AC-L-35 | BR-L-02 | EDGE-L-24 | navigation | P2 | @customer @loan @regression | blocked (B-L1) | PC-L-6 | 1. Click the in-page Back control (name unobserved) 2. Read values on the previous step 3. Click Continue 4. Press browser Back 5. Read values 6. Press browser Forward | TD-L-05, TD-L-10 | Previously entered values are retained as the confirmed rule says; no data loss on in-page Back. Back control name and browser Back behaviour [TBC – exploration blocked by B-L1; Q-L-27]. |
| TC-L-51 | [ST] Refresh mid-step keeps or loses entered data | REQ-L-15 | AC-L-35, AC-L-36 | none | EDGE-L-26 | navigation | P2 | @customer @loan @regression | blocked (B-L1) | PC-L-5, a few Applicant Details fields filled (not submitted) | 1. Press Refresh 2. Record the step and the field values | TD-L-10 | Outcome recorded (data kept or lost, same step or restart). Rule [TBC – exploration blocked by B-L1; Q-L-27]. |
| TC-L-52 | [ST] Partly completed application after sign out and sign in | REQ-L-15 | AC-L-36 | none | EDGE-L-27 | navigation | P2 | @customer @loan @regression | blocked (B-L1) | PC-L-6 | 1. Sign out 2. Sign in again with TD-L-01 3. Look for a draft or resume option 4. Open it if present 5. Record the step and data | TD-L-01 | Whether the draft is resumable, and from which step, is recorded. Draft behaviour [TBC – exploration blocked by B-L1; Q-L-27]. |
| TC-L-53 | [ST] Expired session on Continue returns to sign-in, nothing submitted | REQ-L-16 | AC-L-37 | BR-L-01 | EDGE-L-32 | negative | P1 | @customer @loan @regression @negative | blocked (B-L1) | PC-L-6, a field edited on Income not yet continued | 1. Expire the session per TD-L-24 2. Click Continue 3. Record the page and message 4. Sign in again 5. Record the entered data | TD-L-24 | User is returned to sign-in or shown a message; no step transition on stale session; nothing submitted. Outcome for entered data recorded. Timeout and message [TBC – exploration blocked by B-L1; Q-L-28]. |
| TC-L-54 | [ST] Expired session while the confirmation dialog is open, no submission | REQ-L-16 | AC-L-37 | BR-L-01, BR-L-04 | EDGE-L-32 | negative | P1 | @customer @loan @regression @negative | blocked (B-L1) | PC-L-12 | 1. Expire the session per TD-L-24 2. Click "SUBMIT APPLICATION" in the dialog 3. Record the page and message 4. Check the applications list after signing in again | TD-L-24 | No application is created without a valid session; user is returned to sign-in or shown a message. Behaviour [TBC – exploration blocked by B-L1; Q-L-28]. |
| TC-L-55 | [EG] Two browser tabs editing the same application | REQ-L-15 | none | none | EDGE-L-28 | exploratory | P2 | @customer @loan @regression | blocked (B-L1) | PC-L-6, a second tab in the same session opened on the same step | 1. Edit a field in tab 1 and Continue 2. In tab 2 edit the same field with a different value and Continue 3. Reload both tabs 4. Record which value persists and any stale-data message | TD-L-05, TD-L-10 | Outcome recorded (last write wins, conflict message, session invalidated). No crash. Rule [TBC – exploration blocked by B-L1; Q-L-27]. |

### TS-L-09 Data impact and SSN handling

| ID | Title | REQ | AC | BR | EDGE | Type | Priority | Tags | Status | Preconditions | Steps | Test data | Expected result |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-L-56 | [UC] Submit scenarios run only when opted in, serially, once, with the record logged | REQ-L-13 | AC-L-38 | BR-L-07, BR-L-08 | none | validation | P1 | @customer @loan @regression | manual | Suite configuration under review (process check) | 1. Run the suite without the opt-in switch 2. Confirm TC-L-43, 47, 49, 66 are skipped 3. Inspect config for serial workers and one submission per run 4. Inspect that the record identifier is written to the run log 5. Confirm a cleanup owner is named | TD-L-01, TD-L-20 | Without opt-in no submit TC runs. Workers are serial and at most one submission per run. The record identifier is logged for cleanup. Lineage and cleanup owner [TBC – exploration blocked by B-L1; Q-L-24, Q-L-25]. |
| TC-L-57 | [EG] No literal SSN in specs, test data, logs, traces or reports | REQ-L-13 | AC-L-38 | BR-L-07 | none | validation | P1 | @customer @loan @regression | automatable-now | Repository checked out, no run artefacts required | 1. Scan loan specs, TD files and docs for a bare 9-digit or ddd-dd-dddd pattern 2. Scan the last test reports and traces for the same pattern 3. Confirm the SSN is read through the `LOAN_TEST_SSN` reference only | TD-L-13 | Zero literal SSN matches. SSN appears only as the reference name `LOAN_TEST_SSN`. Any match is a Critical finding. |

### TS-L-10 Accessibility (post-login) and UI

| ID | Title | REQ | AC | BR | EDGE | Type | Priority | Tags | Status | Preconditions | Steps | Test data | Expected result |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-L-58 | [UC] Loan Information and Collateral steps are operable by keyboard only | REQ-L-14 | AC-L-42 (signed-out analogue; post-login AC gap G-L-1) | none | none | a11y | P1 | @customer @loan @regression @a11y | blocked (B-L1) | PC-L-3 | 1. Using only Tab, Shift+Tab, Space, Enter and arrow keys, complete TD-L-02 2. Activate Continue 3. Complete TD-L-05 with keyboard only 4. Activate Continue | TD-L-02, TD-L-05 | Every control is reachable and operable by keyboard; "Applicant Details" is reached with no mouse use; tab order follows visual order. Control behaviour [TBC – exploration blocked by B-L1; Q-L-03]. |
| TC-L-59 | [UC] Applicant Details to Balance Sheet are operable by keyboard only | REQ-L-14 | AC-L-42 (signed-out analogue; post-login AC gap G-L-1) | none | none | a11y | P1 | @customer @loan @regression @a11y | blocked (B-L1) | PC-L-5 | 1. Using only the keyboard, complete TD-L-10 2. Activate Continue on each step through Co-Applicant, Income (TD-L-17) and Balance Sheet (TD-L-19) | TD-L-10, TD-L-17, TD-L-19 | All controls (date entry, dropdowns, Yes/No groups) are operable by keyboard; "Application Summary" is reached. Date picker keyboard support [TBC – exploration blocked by B-L1; Q-L-14]. |
| TC-L-60 | [ST] Agreements checkboxes and confirmation dialog: keyboard, focus trap and Escape | REQ-L-14 | AC-L-42 (signed-out analogue; post-login AC gap G-L-1) | BR-L-04 | none | a11y | P1 | @customer @loan @regression @a11y | blocked (B-L1) | PC-L-10 | 1. Check the four boxes with Space 2. Tab to "SUBMIT APPLICATION" and press Enter 3. Press Tab repeatedly inside the dialog 4. Press Escape 5. Record where focus returns | TD-L-20 | Boxes toggle with Space and expose checked state. Focus moves into the dialog, stays inside it while open, and returns to the page control after Escape; no submission. Dialog role and labels [TBC – exploration blocked by B-L1; Q-L-23]. Stops before confirming the dialog. |
| TC-L-61 | [EP] Accessible names, labels and axe scan on every loan step | REQ-L-14 | AC-L-42 (signed-out analogue; post-login AC gap G-L-1) | none | none | a11y | P1 | @customer @loan @regression @a11y | blocked (B-L1) | PC-L-3, repeated at each step via PC-L-4..PC-L-10 | For each step: 1. Run an axe scan 2. List every input, button and checkbox without an accessible name 3. Record findings with step name | TD-L-02, TD-L-05, TD-L-10, TD-L-17, TD-L-19, TD-L-20 | Every control has an accessible name and label association; zero serious or critical axe violations, or findings are recorded per step. Labels [TBC – exploration blocked by B-L1; Q-L-12]. |
| TC-L-62 | [EP] Validation errors are announced and associated with their field | REQ-L-14 | AC-L-42 (signed-out analogue; post-login AC gap G-L-1) | none | EDGE-L-20 | a11y | P2 | @customer @loan @regression @a11y | blocked (B-L1) | PC-L-3 | 1. Click Continue with a mandatory question empty 2. Inspect the error element for role alert or aria-live 3. Check the field's association to the message 4. Check where focus moves | TD-L-02 | Error message is announced (live region or role) and associated with its field; focus moves to the first error or the message. Whether an error appears at all [TBC – exploration blocked by B-L1; Q-L-12, Q-L-13]. |
| TC-L-63 | [EP] Visible focus indicator and focus placement after each step change | REQ-L-14 | AC-L-42 (signed-out analogue; post-login AC gap G-L-1) | none | none | a11y | P2 | @customer @loan @regression @a11y | blocked (B-L1) | PC-L-3 | 1. Tab through the controls and check a visible focus indicator on each 2. Click Continue 3. Record the element holding focus on the new step | TD-L-02 | A visible focus indicator is present on every control. After Continue, focus lands on the new step heading or first field, not on a removed element. Behaviour [TBC – exploration blocked by B-L1; Q-L-03]. |
| TC-L-64 | [EG] Narrow viewport and touch (no hover) reach Start Application and complete a step | REQ-L-14 | none | none | EDGE-L-34 | UI | P2 | @customer @loan @regression | blocked (B-L1) | PC-L-2 with viewport and touch per TD-L-25 | 1. Set viewport 375x667 with touch emulation 2. Open the main menu 3. Reach "Land & Home" and "Start Application" without hover 4. Complete Loan Information per TD-L-02 | TD-L-25, TD-L-02 | "Start Application" is reachable without hover and Loan Information is usable (no overlapping or clipped controls). Mobile menu structure [TBC – exploration blocked by B-L1; Q-L-03]. |
| TC-L-65 | [UC] Each step shows its named heading in sequence | REQ-L-02..REQ-L-09 | AC-L-04, AC-L-05, AC-L-09, AC-L-21, AC-L-22, AC-L-24, AC-L-26 | BR-L-02 | none | UI | P2 | @customer @loan @regression | blocked (B-L1) | PC-L-3 | 1. Complete each step with the story data and click Continue 2. At each step record the heading 3. Compare the order with the list | TD-L-02, TD-L-05, TD-L-10, TD-L-17, TD-L-19 | Headings appear in order: Loan Information, "Collateral & Loan Amount", "Applicant Details", "Co-Applicant Details", "Income", "Balance Sheet", "Application Summary", "Additional Terms & Agreements". Any progress indicator [TBC – exploration blocked by B-L1; Q-L-03]. Stops before submit. |

### TS-L-11 End-to-end happy path

| ID | Title | REQ | AC | BR | EDGE | Type | Priority | Tags | Status | Preconditions | Steps | Test data | Expected result |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-L-66 | [UC] Full Land & Home application from menu to Skip feedback, steps 1-45 (opt-in, serial, single run) | REQ-L-01..REQ-L-11, REQ-L-13 | AC-L-01, AC-L-03, AC-L-04, AC-L-05, AC-L-09, AC-L-14, AC-L-21, AC-L-22, AC-L-24, AC-L-26, AC-L-28, AC-L-30, AC-L-32 | BR-L-01, BR-L-02, BR-L-03, BR-L-04, BR-L-05, BR-L-07, BR-L-08 | none | e2e | P0 | @customer @loan @e2e-full | blocked (B-L1) | PC-L-2 and the opt-in gate of PC-L-11: opt-in switch set, single worker, one submission per run, cleanup owner named (Q-L-25). Creates a real Dev record (B-L3). Not run in CI by default | Precondition: sign in per TD-L-01 and land on `/apply-for-a-loan`. 1. Click "apply for loan" in the main menu 2. Hover "Land & Home" 3. Click "Start Application" 4. Choose Purchase 5. Choose Yes for Principal residence 6. Choose No for Dwelling on the property 7. Enter 5.11 in How many acres 8. Click Continue 9. Enter the financing description text 10. Enter 160599 as Estimated property value 11. Enter 160500 as Borrow amount 12. Select Barbour as Property county 13. Select Barbour as Residence/HQ county 14. Verify the Branch Office 15. Choose No for Contact with different branch/lender 16. Choose Yes for Active loan with Alabama Ag Credit 17. Click Continue 18. Choose Yes for US citizen 19. Enter 09/09/2001 as DOB 20. Choose MARRIED 21. Enter the SSN resolved from `LOAN_TEST_SSN` 22. Choose No for Mailing address different 23. Choose ANY as Contact preference 24. Enter Techwave as Employer name 25. Enter 11 as Years with employer 26. Enter Team Lead as Profession 27. Enter 4 as Years in profession 28. Enter 2000 as Year began farming 29. Click Continue 30. Click Continue on Co-Applicant Details 31. Enter 12000 in Salary/Wages 32. Click Continue 33. Answer No to FCA director/employee/relative 34. Answer No to bankruptcy in 7 years 35. Answer No to judgments/suits pending 36. Answer No to foreclosure/deed in lieu/debt forgiveness in 7 years 37. Click Continue 38. Click Continue on Application Summary 39. Check Financial Report and Bylaw Disclosure 40. Check Patronage and Investment Information 41. Check right to receive an Appraisal Report 42. Check authorization to run a credit check 43. Click "SUBMIT APPLICATION" 44. Click "SUBMIT APPLICATION" in the confirmation dialog 45. Click "Skip feedback & continue" | TD-L-01, TD-L-02, TD-L-05, TD-L-10, TD-L-13, TD-L-17, TD-L-19, TD-L-20 | After precondition: URL path `/apply-for-a-loan`. After 3: URL path `/loan-application-creation/loan-information`. After 8: "Collateral & Loan Amount". After 17: "Applicant Details". After 29: "Co-Applicant Details" (if the story data is rejected, stop and record the message as a finding for Q-L-18; no pass/fail decided). After 30: "Income". After 32: "Balance Sheet". After 37: "Application Summary". After 38: "Additional Terms & Agreements". After 42: four boxes checked, "SUBMIT APPLICATION" available. After 43: confirmation dialog visible. After 44: next screen with "Skip feedback & continue". After 45: destination and submitted-application status are recorded [TBC – exploration blocked by B-L1; Q-L-23]. Exactly one submission; record identifier logged for cleanup; no SSN literal in logs, traces or screenshots. |

## Decision tables

### DT-L-01 Loan Information: purchase or refinance x principal residence x dwelling x acres band

1. Conditions and domains:
- C1 Purchase or refinance? = Purchase (P) or Refinance (R).
- C2 Principal residence? = Yes (Y) or No (N).
- C3 Dwelling on the property? = Yes (Y) or No (N).
- C4 Acres band: A = invalid or empty (empty, negative, text); B = valid below 5 (representative 4.99); C = valid 5 or more (representative 5.11). The threshold 5 and the valid range are [TBC – exploration blocked by B-L1; Q-L-05, Q-L-06].
2. Actions: A1 Continue opens "Collateral & Loan Amount"; A2 Continue blocked with message; A3 extra fields or a different step.
3. Full matrix: 2 x 2 x 2 x 3 = 24 combinations (below the 32 limit, no pairwise needed).
4. Elimination log: no combination is eliminated. No source states that any combination is impossible, and removing one would invent a rule. This is the stated trade-off.
5-6. Rules and actions (the only known outcome is R21, from the story; every other outcome is TBC):

| Rule | C1 | C2 | C3 | C4 | Outcome | TC |
|---|---|---|---|---|---|---|
| R1 | P | Y | Y | A | Continue blocked or message [TBC – exploration blocked by B-L1; Q-L-05, Q-L-12] | TC-L-13, TC-L-15 |
| R2 | P | Y | Y | B | [TBC – exploration blocked by B-L1; Q-L-04, Q-L-06] | TC-L-15 |
| R3 | P | Y | Y | C | [TBC – exploration blocked by B-L1; Q-L-04] | TC-L-15 |
| R4 | P | Y | N | A | Continue blocked or message [TBC – exploration blocked by B-L1; Q-L-05, Q-L-12] | TC-L-13, TC-L-15 |
| R5 | P | Y | N | B | [TBC – exploration blocked by B-L1; Q-L-06] | TC-L-12, TC-L-15 |
| R6 | P | N | Y | A | Continue blocked or message [TBC – exploration blocked by B-L1; Q-L-05, Q-L-12] | TC-L-15 |
| R7 | P | N | Y | B | [TBC – exploration blocked by B-L1; Q-L-04, Q-L-06] | TC-L-15 |
| R8 | P | N | Y | C | [TBC – exploration blocked by B-L1; Q-L-04] | TC-L-15 |
| R9 | P | N | N | A | Continue blocked or message [TBC – exploration blocked by B-L1; Q-L-05, Q-L-12] | TC-L-15 |
| R10 | P | N | N | B | [TBC – exploration blocked by B-L1; Q-L-04, Q-L-06] | TC-L-15 |
| R11 | P | N | N | C | [TBC – exploration blocked by B-L1; Q-L-04] | TC-L-15 |
| R12 | R | Y | Y | A | Continue blocked or message [TBC – exploration blocked by B-L1; Q-L-05, Q-L-12] | TC-L-15 |
| R13 | R | Y | Y | B | [TBC – exploration blocked by B-L1; Q-L-04, Q-L-06] | TC-L-15 |
| R14 | R | Y | Y | C | [TBC – exploration blocked by B-L1; Q-L-04] | TC-L-15 |
| R15 | R | Y | N | A | Continue blocked or message [TBC – exploration blocked by B-L1; Q-L-05, Q-L-12] | TC-L-15 |
| R16 | R | Y | N | B | [TBC – exploration blocked by B-L1; Q-L-04, Q-L-06] | TC-L-15 |
| R17 | R | Y | N | C | [TBC – exploration blocked by B-L1; Q-L-04] | TC-L-15 |
| R18 | R | N | Y | A | Continue blocked or message [TBC – exploration blocked by B-L1; Q-L-05, Q-L-12] | TC-L-15 |
| R19 | R | N | Y | B | [TBC – exploration blocked by B-L1; Q-L-04, Q-L-06] | TC-L-15 |
| R20 | R | N | Y | C | [TBC – exploration blocked by B-L1; Q-L-04] | TC-L-15 |
| R21 | P | Y | N | C | A1: "Collateral & Loan Amount" (story, AC-L-05) | TC-L-11, TC-L-66 |
| R22 | R | N | N | A | Continue blocked or message [TBC – exploration blocked by B-L1; Q-L-05, Q-L-12] | TC-L-15 |
| R23 | R | N | N | B | [TBC – exploration blocked by B-L1; Q-L-04, Q-L-06] | TC-L-15 |
| R24 | R | N | N | C | [TBC – exploration blocked by B-L1; Q-L-04] | TC-L-15 |

Note: R21 sits at its matrix position (P, Y, N, C). The order of rows is not significant. Each of the 24 rules has at least one TC.

### DT-L-02 Four agreements x SUBMIT APPLICATION state

1. Conditions: A1 Financial Report and Bylaw Disclosure; A2 Patronage and Investment Information; A3 right to receive an Appraisal Report; A4 authorization to run a credit check. Each checked (1) or unchecked (0).
2. Actions: S1 SUBMIT APPLICATION available (enabled, opens the dialog); S2 SUBMIT APPLICATION disabled or blocked with a message.
3. Full matrix: 2^4 = 16 combinations (below 32).
4. Elimination log: none eliminated; every combination is reachable by toggling checkboxes.
5-6. Rules (only R16 is known, from AC-L-28; the rest follow Q-L-19, which asks whether all four are mandatory):

| Rule | A1 | A2 | A3 | A4 | SUBMIT APPLICATION | TC |
|---|---|---|---|---|---|---|
| R1 | 0 | 0 | 0 | 0 | [TBC – exploration blocked by B-L1; Q-L-19] | TC-L-42 |
| R2 | 0 | 0 | 0 | 1 | [TBC – exploration blocked by B-L1; Q-L-19] | TC-L-42 |
| R3 | 0 | 0 | 1 | 0 | [TBC – exploration blocked by B-L1; Q-L-19] | TC-L-42 |
| R4 | 0 | 0 | 1 | 1 | [TBC – exploration blocked by B-L1; Q-L-19] | TC-L-42 |
| R5 | 0 | 1 | 0 | 0 | [TBC – exploration blocked by B-L1; Q-L-19] | TC-L-42 |
| R6 | 0 | 1 | 0 | 1 | [TBC – exploration blocked by B-L1; Q-L-19] | TC-L-42 |
| R7 | 0 | 1 | 1 | 0 | [TBC – exploration blocked by B-L1; Q-L-19] | TC-L-42 |
| R8 | 0 | 1 | 1 | 1 | [TBC – exploration blocked by B-L1; Q-L-19] | TC-L-42 |
| R9 | 1 | 0 | 0 | 0 | [TBC – exploration blocked by B-L1; Q-L-19] | TC-L-42 |
| R10 | 1 | 0 | 0 | 1 | [TBC – exploration blocked by B-L1; Q-L-19] | TC-L-42 |
| R11 | 1 | 0 | 1 | 0 | [TBC – exploration blocked by B-L1; Q-L-19] | TC-L-42 |
| R12 | 1 | 0 | 1 | 1 | [TBC – exploration blocked by B-L1; Q-L-19] | TC-L-42 |
| R13 | 1 | 1 | 0 | 0 | [TBC – exploration blocked by B-L1; Q-L-19] | TC-L-42 |
| R14 | 1 | 1 | 0 | 1 | [TBC – exploration blocked by B-L1; Q-L-19] | TC-L-42 |
| R15 | 1 | 1 | 1 | 0 | [TBC – exploration blocked by B-L1; Q-L-19] | TC-L-42 |
| R16 | 1 | 1 | 1 | 1 | S1 available (AC-L-28) | TC-L-41, TC-L-43, TC-L-66 |

### DT-L-03 Applicant cross-field data consistency (story inconsistency)

1. Conditions: C1 Year began farming is on or after the birth year (Y) or before it (N); C2 Years with employer is consistent with the age (Y) or implies employment from childhood (N), age rule unknown. The story data is C1 = N (2000 vs birth 2001) and C2 = N (11 years at about age 24).
2. Actions: X1 Continue accepted; X2 Continue blocked with message.
3. Full matrix: 2 x 2 = 4. 4. Elimination log: none eliminated. Whether any cross-field rule exists at all is the question Q-L-18.

| Rule | C1 | C2 | Outcome | TC |
|---|---|---|---|---|
| R1 | Y | Y | X1 expected for consistent data [TBC – exploration blocked by B-L1; Q-L-18] | TC-L-30 |
| R2 | Y | N | [TBC – exploration blocked by B-L1; Q-L-18] | TC-L-30 |
| R3 | N | Y | [TBC – exploration blocked by B-L1; Q-L-18] | TC-L-30 |
| R4 | N | N | Story data. Observation only: accepted or rejected [TBC – exploration blocked by B-L1; Q-L-18] | TC-L-25, TC-L-30, TC-L-66 |

## Exploratory charters

All charters are time-boxed sessions. Everything beyond EXP-L-09 needs the registered account (B-L1, Q-L-29). Findings go to a new `docs/EXPLORATORY-FINDINGS-Customer-Loan-Application.md`. Never record secret values or SSN literals in notes, screenshots or traces.

| ID | Time-box | Mission | Areas | Risks | Status | Linked |
|---|---|---|---|---|---|---|
| EXP-L-01 | 45 min | Discover the main-menu structure and every way to reach "Start Application" | Menu, hover, keyboard, touch, narrow viewport | Hover-only path locks out keyboard and touch users; wrong labels in scripts | blocked (B-L1) | Q-L-03, TC-L-08, TC-L-10, TC-L-64 |
| EXP-L-02 | 60 min | Learn what Loan Information changes by answer and by acres, including any AG Fast threshold | Purchase/Refinance, Principal residence, Dwelling, acres, DT-L-01 | Hidden branches, wrong programme routing, acres boundary defect | blocked (B-L1) | Q-L-04, Q-L-05, Q-L-06, TC-L-12, TC-L-15 |
| EXP-L-03 | 60 min | Learn amount, description and county/branch rules on Collateral & Loan Amount | Value, borrow, description, counties, Branch Office, different branch/lender | Borrow above value accepted, wrong branch assigned, input-safety issues | blocked (B-L1) | Q-L-07, Q-L-08, Q-L-09, Q-L-10, TC-L-19..24 |
| EXP-L-04 | 60 min | Probe Applicant Details consistency and SSN handling | DOB, age limits, years fields, farming year, SSN format and masking, DT-L-03 | Impossible dates accepted, SSN exposed in DOM, payload or summary | blocked (B-L1) | Q-L-14..Q-L-18, TC-L-26..30 |
| EXP-L-05 | 45 min | Map Co-Applicant, Income, Balance Sheet and Summary behaviour | Co-applicant fields, salary period and format, declarations answered Yes, summary content | Silent data loss between steps, Yes answers ignored, salary period misread | blocked (B-L1) | Q-L-20, Q-L-21, Q-L-22, TC-L-34..40 |
| EXP-L-06 | 60 min | Explore agreements, the two-step submit, confirmation and data lineage (one opted-in submission only) | Agreement links, dialog, double click, confirmation, notifications, records created | Duplicate applications, no confirmation, undeleted test records | blocked (B-L1) | Q-L-19, Q-L-23, Q-L-24, Q-L-25, Q-L-26, TC-L-41..49 |
| EXP-L-07 | 60 min | Probe draft, back/refresh, session expiry and two-tab behaviour | In-page Back, browser Back, refresh, sign out and in, expiry, second tab | Lost or stale data, submit with an expired session | blocked (B-L1) | Q-L-27, Q-L-28, TC-L-50..55 |
| EXP-L-08 | 60 min | Keyboard and screen-reader pass through all steps | Focus order, names, errors, dialog, date and dropdown controls | WCAG failures on a regulated lending form | blocked (B-L1) | REQ-L-14, TC-L-58..63 |
| EXP-L-09 | 30 min | Explore the signed-out public page at both loan routes | Route variants, SIGN IN and CREATE PROFILE destinations, return-to-route after login, stale cookie | A route that leaks the form, open redirect, wrong return path | automatable-now (live, no account) | Q-L-01, Q-L-02, TC-L-01..06 |
| EXP-L-10 | 45 min | Input-safety pass on every free-text and numeric field | Description, employer, profession, numerics, paste, newline, emoji, script-like text | Stored or reflected injection, broken layout, server error | blocked (B-L1) | Q-L-09, TC-L-21, TC-L-33 |

## Traceability matrix

### REQ to AC to TC

| REQ | AC | TC |
|---|---|---|
| REQ-L-01 | AC-L-01, AC-L-02 | TC-L-07, TC-L-06, TC-L-66 |
| REQ-L-02 | AC-L-03, AC-L-04 | TC-L-08, TC-L-09, TC-L-10, TC-L-65, TC-L-66 |
| REQ-L-03 | AC-L-05..08 | TC-L-11, 12, 13, 14, 15, 17 |
| REQ-L-04 | AC-L-09..13 | TC-L-18..24 |
| REQ-L-05 | AC-L-14..20 | TC-L-25..33 |
| REQ-L-06 | AC-L-21 | TC-L-34 |
| REQ-L-07 | AC-L-22, AC-L-23 | TC-L-35, TC-L-36 |
| REQ-L-08 | AC-L-24, AC-L-25 | TC-L-37, TC-L-38 |
| REQ-L-09 | AC-L-26, AC-L-27 | TC-L-39, TC-L-40, TC-L-29 |
| REQ-L-10 | AC-L-28, AC-L-29 | TC-L-41, TC-L-42 |
| REQ-L-11 | AC-L-30..34 | TC-L-43..49, TC-L-66 |
| REQ-L-12 | AC-L-39..42 | TC-L-01..05 |
| REQ-L-13 | AC-L-38 | TC-L-56, TC-L-57, TC-L-43 |
| REQ-L-14 | AC-L-42 (signed-out), post-login AC gap G-L-1 | TC-L-04, TC-L-10, TC-L-58..64 |
| REQ-L-15 | AC-L-35, AC-L-36 | TC-L-50, 51, 52, 55, 16 |
| REQ-L-16 | AC-L-37 | TC-L-53, TC-L-54 |

### AC to TC

| AC | TC | AC | TC |
|---|---|---|---|
| AC-L-01 | TC-L-07, 66 | AC-L-22 | TC-L-35, 65, 66 |
| AC-L-02 | TC-L-06 | AC-L-23 | TC-L-36 |
| AC-L-03 | TC-L-08, 10, 66 | AC-L-24 | TC-L-37, 65, 66 |
| AC-L-04 | TC-L-09, 65, 66 | AC-L-25 | TC-L-38 |
| AC-L-05 | TC-L-11, 65, 66 | AC-L-26 | TC-L-39, 65, 66 |
| AC-L-06 | TC-L-12, 13 | AC-L-27 | TC-L-40, 29 |
| AC-L-07 | TC-L-14 | AC-L-28 | TC-L-41, 66 |
| AC-L-08 | TC-L-15 | AC-L-29 | TC-L-42 |
| AC-L-09 | TC-L-18, 65, 66 | AC-L-30 | TC-L-43, 44, 66 |
| AC-L-10 | TC-L-19, 20 | AC-L-31 | TC-L-45 |
| AC-L-11 | TC-L-21 | AC-L-32 | TC-L-46, 66 |
| AC-L-12 | TC-L-22 | AC-L-33 | TC-L-47 |
| AC-L-13 | TC-L-24 | AC-L-34 | TC-L-48 |
| AC-L-14 | TC-L-25, 33, 66 | AC-L-35 | TC-L-50, 51 |
| AC-L-15 | TC-L-26 | AC-L-36 | TC-L-51, 52 |
| AC-L-16 | TC-L-27 | AC-L-37 | TC-L-53, 54 |
| AC-L-17 | TC-L-28, 29 | AC-L-38 | TC-L-56, 57 |
| AC-L-18 | TC-L-30 | AC-L-39 | TC-L-01, 05 |
| AC-L-19 | TC-L-31 | AC-L-40 | TC-L-02, 05 |
| AC-L-20 | TC-L-32 | AC-L-41 | TC-L-03 |
| AC-L-21 | TC-L-34, 65, 66 | AC-L-42 | TC-L-04, 58..63 (analogue) |

All 42 ACs have at least one TC.

### BR to TC

| BR | TC |
|---|---|
| BR-L-01 | TC-L-01, 02, 06, 07, 53, 54, 66 |
| BR-L-02 | TC-L-09, 11, 16, 50, 65, 66 |
| BR-L-03 | TC-L-11, 15, 17, 18, 25, 34, 35, 37, 39, 66 |
| BR-L-04 | TC-L-43, 44, 45, 47, 54, 60, 66 |
| BR-L-05 | TC-L-41, 42, 66 |
| BR-L-06 | TC-L-01, 02, 05 |
| BR-L-07 | TC-L-25, 28, 29, 56, 57, 66 |
| BR-L-08 | TC-L-43, 47, 49, 56, 66 |

All 8 BRs have at least one TC.

### EDGE to TC

| EDGE | TC | EDGE | TC | EDGE | TC |
|---|---|---|---|---|---|
| EDGE-L-01 | TC-L-12 | EDGE-L-13 | TC-L-30 | EDGE-L-25 | TC-L-16 |
| EDGE-L-02 | TC-L-13 | EDGE-L-14 | TC-L-27 | EDGE-L-26 | TC-L-51 |
| EDGE-L-03 | TC-L-15 | EDGE-L-15 | TC-L-30 | EDGE-L-27 | TC-L-52 |
| EDGE-L-04 | TC-L-19 | EDGE-L-16 | TC-L-27, 30 | EDGE-L-28 | TC-L-55 |
| EDGE-L-05 | TC-L-19 | EDGE-L-17 | TC-L-28 | EDGE-L-29 | TC-L-17 |
| EDGE-L-06 | TC-L-20 | EDGE-L-18 | TC-L-29, 40 | EDGE-L-30 | TC-L-47 |
| EDGE-L-07 | TC-L-21 | EDGE-L-19 | TC-L-33 | EDGE-L-31 | TC-L-49 |
| EDGE-L-08 | TC-L-22 | EDGE-L-20 | TC-L-14, 24, 32, 38, 62 | EDGE-L-32 | TC-L-53, 54 |
| EDGE-L-09 | TC-L-24 | EDGE-L-21 | TC-L-36 | EDGE-L-33 | TC-L-48 |
| EDGE-L-10 | TC-L-23 | EDGE-L-22 | TC-L-34 | EDGE-L-34 | TC-L-10, 64 |
| EDGE-L-11 | TC-L-26 | EDGE-L-23 | TC-L-38 | EDGE-L-35 | TC-L-22 |
| EDGE-L-12 | TC-L-26 | EDGE-L-24 | TC-L-50 | EDGE-L-36 | TC-L-05 |

All 36 EDGE IDs are covered, including EDGE-L-10, 25, 28, 29 and 31, which have no AC. EDGE-L-36 expired session cookie is covered through the stale-cookie variant of TD-L-21.

### Orphan check

Every TC carries at least one of REQ, AC, BR or EDGE. TCs without an AC cite an EDGE or BR: TC-L-16 (EDGE-L-25, BR-L-02), TC-L-17 (EDGE-L-29), TC-L-23 (EDGE-L-10), TC-L-49 (EDGE-L-31), TC-L-55 (EDGE-L-28), TC-L-64 (EDGE-L-34). No orphan TCs. Every TS links to at least one TC.

### Counts

| By priority | P0 | P1 | P2 | P3 | Total |
|---|---|---|---|---|---|
| TCs | 8 | 32 | 25 | 1 | 66 |

P0: TC-L-07, 08, 11, 18, 25, 41, 43, 66. P3: TC-L-33.

| By type | functional | negative | boundary | validation | mandatory | navigation | UI | a11y | e2e | exploratory | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TCs | 15 | 14 | 8 | 6 | 4 | 5 | 3 | 8 | 1 | 2 | 66 |

| By status | automatable-now | blocked (B-L1) | manual | Total |
|---|---|---|---|---|
| TCs | 7 | 58 | 1 | 66 |

automatable-now: TC-L-01, 02, 03, 04, 05, 06, 57. manual: TC-L-56.

| By tag | @customer | @loan | @smoke | @regression | @negative | @a11y | @e2e-full |
|---|---|---|---|---|---|---|---|
| TCs | 66 | 66 | 6 | 65 | 20 | 8 | 1 |

@smoke: TC-L-01, 02, 07, 08, 11, 18. @e2e-full: TC-L-66 only (it carries no @regression). @negative: TC-L-01, 02, 05, 06, 13, 14, 16, 17, 23, 24, 28, 32, 38, 42, 45, 47, 48, 49, 53, 54. @a11y: TC-L-04, 10, 58..63.

## Gaps / questions

| ID | Gap |
|---|---|
| G-L-1 | No post-login accessibility AC exists (AC-L-42 is signed-out only). TC-L-58..63 cite AC-L-42 as the analogue; add ACs after exploration (Q-L-03, Q-L-12). |
| G-L-2 | 58 of 66 TCs are blocked by B-L1 (Q-L-29). All post-login labels, control types, limits, messages and the confirmation content are TBC. |
| G-L-3 | Story data is internally inconsistent (Q-L-18); TC-L-25 and TC-L-66 run on it and may be rejected by the app. A corrected dataset is needed from the product owner. |
| G-L-4 | Most DT outcome cells are TBC (DT-L-01 23 of 24, DT-L-02 15 of 16, DT-L-03 4 of 4). They resolve with Q-L-04..06, Q-L-18, Q-L-19. |
| G-L-5 | Four TCs create real Dev records (TC-L-43, 47, 49, 66); only one may run per run (BR-L-08). Cleanup owner and lineage are open (Q-L-24, Q-L-25). The opt-in switch name is not defined. |
| G-L-6 | Upstream gave no priorities; P0..P3 here is by business impact assigned in this design. Confirm with the product owner. |
| G-L-7 | AC-L-41 destinations from the loan route are unobserved (Q-L-02); TC-L-03 records rather than asserts. |
| G-L-8 | Step URL pattern for steps after Loan Information is unobserved, so TC-L-16 cannot name a target URL (Q-L-27). |
