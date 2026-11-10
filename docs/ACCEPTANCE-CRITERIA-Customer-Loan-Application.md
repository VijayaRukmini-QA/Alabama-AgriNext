# Acceptance Criteria: Customer Loan Application - Land & Home

App: Customer app, `CUSTOMER_BASE_URL`. Precondition story: `docs/ACCEPTANCE-CRITERIA-Customer-Signin.md` (REQ-04, REQ-05, AC-02 to AC-04, AC-40, Q-12).
Status: DRAFT, Phase 1 (Analyse). Analysed from the story brief only. No screen after sign-in has been observed.
Legend: **[B]** stated in the brief, **[O]** observed live 2026-11-10, **[I]** inferred, **[TBC]** = `[TBC - exploration blocked by B-L1]` (not observed, nothing invented).
Secrets: `CUSTOMER_EMAIL`, `CUSTOMER_PASSWORD`, `CUSTOMER_BASE_URL`, `SMS_INBOX_URL` live in `.env`. SSN is the test-data reference `LOAN_TEST_SSN` (synthetic), never a literal. No secret value appears here.
Execution target: Playwright UI mode, Chrome channel. Tags: @customer @loan @smoke / @regression / @negative / @a11y / @e2e-full. TC status vocabulary: automatable-now / blocked / manual.

---

## 0. Summary

REQ-L 16 | BR-L 8 | AC-L 42 | EDGE-L 36 | Q-L 28 | clarity 12.5 % (2 of 16) | blockers 3 (B-L1, B-L2, B-L3)

Clarity is below the 70 % threshold. Per the analyst rule, ACs for the post-login screens are skeletons built from the brief's step data only; they are flagged [TBC] and blocked, and must be finalised after the questions in section 8 are answered. Only the signed-out route ACs (section 4.9) are final.

## 0.1 Blockers and hard facts (verified 2026-11-10)

| ID | Fact | Effect |
|---|---|---|
| B-L1 | Real sign-in with `CUSTOMER_EMAIL` returns 400 `user_not_found` (AADSTS50034); no registered customer account. Account creation is blocked by Cloudflare bot checks on yopmail (email code) and receive-smss (SMS code, intermittent). Same root as sign-in S-F-01 / B-S1 / B-S2. | Steps 1 to 45 cannot be executed or explored. All labels, control types, validation rules, messages are unobserved. |
| B-L2 | Signed out, `/apply-for-a-loan` and `/loan-application-creation/loan-information` do NOT redirect. They render the public page with "SIGN IN" and "CREATE PROFILE" buttons at the same URL [O] (sign-in Q-12, asserted in TC-S-35/43). | Sign-in AC-40 expectation ("redirected or denied") is superseded by the observed fact. Signed-out ACs in section 4.9 are executable now. |
| B-L3 | Data impact: submitting creates real records in Dev. One-time per run. | Run policy: opt-in, serial, single run; lineage and cleanup owner needed (Q-L-24 to Q-L-26). |

---

## 1. User story

As a **signed-in customer** of Alabama Ag Credit, I want to **complete and submit a Land & Home loan application**, so that **Alabama Ag Credit can process my request**. [I: the brief gives steps only, no "As a" text; wording is reconstructed from the sign-in story and flagged inferred]

Story steps [B]: Precondition (sign in, SMS code, land on `/apply-for-a-loan`); 1-3 menu to "Start Application"; 4-8 Loan Information; 9-17 Collateral & Loan Amount; 18-29 Applicant Details; 30 Co-Applicant Details; 31-32 Income; 33-37 Balance Sheet; 38 Application Summary; 39-42 Additional Terms & Agreements; 43-45 submit, confirm, "Skip feedback & continue".

Story test data [B]: Purchase; Principal residence Yes; Dwelling No; Acres 5.11; Property value 160599; Borrow 160500; Property county "Barbour"; Residence/HQ county "Barbour"; Contact different branch/lender No; Active loan with Alabama Ag Credit Yes; US citizen Yes; DOB 09/09/2001; Marital status MARRIED; SSN = `LOAN_TEST_SSN`; Mailing address different No; Contact preference ANY; Employer "Techwave"; Years with employer 11; Profession "Team Lead"; Years in profession 4; Year began farming 2000; Salary/Wages 12000; four Balance Sheet declarations all No; four agreements checked.

## 2. Requirements

| ID | Requirement | Type | Priority | Depends on | Basis |
|---|---|---|---|---|---|
| REQ-L-01 | Precondition: the customer signs in with `CUSTOMER_EMAIL`/`CUSTOMER_PASSWORD`, reads the SMS code from "Alabama Ag Credit" at `SMS_INBOX_URL`, clicks Verify code and lands on `/apply-for-a-loan`. | Functional | not stated | Signin REQ-04, REQ-05, REQ-15 | [B]; blocked by B-L1 |
| REQ-L-02 | From `/apply-for-a-loan` the customer clicks "apply for loan" in the main menu, hovers "Land & Home" and clicks "Start Application"; the URL becomes `/loan-application-creation/loan-information` and the Loan Information page shows. | Functional | not stated | REQ-L-01 | [B]; menu structure [TBC] |
| REQ-L-03 | Loan Information step: customer answers Purchase or refinance? (Purchase), Principal residence? (Yes), Dwelling on the property? (No), How many acres? (5.11); Continue opens "Collateral & Loan Amount". | Functional | not stated | REQ-L-02 | [B]; control types, rules [TBC] |
| REQ-L-04 | Collateral & Loan Amount step: customer enters the financing description text, Estimated property value, Borrow amount, Property county, Residence/HQ county, verifies the Branch Office, answers Contact with different branch/lender? (No) and Active loan with Alabama Ag Credit? (Yes); Continue opens "Applicant Details". | Functional | not stated | REQ-L-03 | [B]; rules [TBC] |
| REQ-L-05 | Applicant Details step: US citizen, DOB, Marital status, SSN (`LOAN_TEST_SSN`), Mailing address different?, Contact preference, Employer name, Years with employer, Profession, Years in profession, Year began farming; Continue opens "Co-Applicant Details". | Functional | not stated | REQ-L-04 | [B]; rules [TBC] |
| REQ-L-06 | Co-Applicant Details step: Continue (no data entered in the story) opens "Income". | Functional | not stated | REQ-L-05 | [B]; fields and whether optional [TBC] |
| REQ-L-07 | Income step: customer enters Salary/Wages (12000); Continue opens "Balance Sheet". | Functional | not stated | REQ-L-06 | [B]; period (monthly/annual), currency format [TBC] |
| REQ-L-08 | Balance Sheet step: four declarations answered No (FCA director/employee/relative; bankruptcy in 7 years; judgments/suits pending; foreclosure/deed in lieu/debt forgiveness in 7 years); Continue opens "Application Summary". | Functional | not stated | REQ-L-07 | [B]; control type [TBC] |
| REQ-L-09 | Application Summary step shows the entered application; Continue opens "Additional Terms & Agreements". | Functional | not stated | REQ-L-08 | [B]; content [TBC] |
| REQ-L-10 | Additional Terms & Agreements: customer checks four boxes (Financial Report and Bylaw Disclosure; Patronage and Investment Information; right to receive an Appraisal Report; authorization to run a credit check). | Functional | not stated | REQ-L-09 | [B]; whether all four are mandatory [TBC] |
| REQ-L-11 | Submission and confirmation: "SUBMIT APPLICATION" opens a confirmation dialog; "SUBMIT APPLICATION" in the dialog submits and shows a next screen with "Skip feedback & continue". | Functional | not stated | REQ-L-10 | [B]; dialog text, confirmation or application number [TBC] |
| REQ-L-12 | Signed-out route access: `/apply-for-a-loan` and `/loan-application-creation/loan-information` render the public page with "SIGN IN" and "CREATE PROFILE" at the same URL, with no redirect and no loan form. | Functional / security | not stated | none | [O] |
| REQ-L-13 | Data impact: a submitted application creates real records in Dev; one submission per run; lineage and cleanup are planned. | Non-functional (data/compliance) | not stated | REQ-L-11 | [B] |
| REQ-L-14 | Accessibility: every step is operable by keyboard with accessible names, visible focus, announced errors; the hover-only menu path has a keyboard alternative. | Non-functional (accessibility) | not stated | REQ-L-02 to REQ-L-11 | [B] "UI and accessibility"; details [TBC] |
| REQ-L-15 | Step navigation: Continue moves forward; Back (control name [TBC]) returns without data loss; draft save and resume behaviour. | Functional | not stated | REQ-L-03 to REQ-L-10 | [B] "back/continue, save/resume?"; entirely [TBC] |
| REQ-L-16 | Session expiry during a multi-step application behaves safely (no silent loss, no submit without a valid session). | Non-functional (security) | not stated | REQ-L-01 | [I]; entirely [TBC] |

Priority: the brief states none; it is not guessed. Tags @smoke / @regression are assigned in Phase 2.

## 3. Business rules

Only rules stated or observed are listed. Everything else is a question in section 8.

| BR ID | Rule statement | Type | Valid example | Invalid example | REQ | Precedence / conflicts | Edge conditions |
|---|---|---|---|---|---|---|---|
| BR-L-01 | The customer must be signed in (credentials, then SMS code) before the loan application is reachable. | Policy/permission | verified code leads to `/apply-for-a-loan` | opening the loan route signed out and getting a form | REQ-L-01, REQ-L-12 | Signin BR-03 and BR-06 apply first. Signed-out behaviour [O] is a public page, not a redirect, so enforcement is by absence of the form. | session expiry mid-application |
| BR-L-02 | The application is a fixed sequence: Loan Information, Collateral & Loan Amount, Applicant Details, Co-Applicant Details, Income, Balance Sheet, Application Summary, Additional Terms & Agreements, submit. | Workflow/state | Continue on Loan Information opens Collateral & Loan Amount | skipping to Applicant Details | REQ-L-03 to REQ-L-11 | none stated | direct URL to a later step [TBC]; Back |
| BR-L-03 | "Continue" on a completed step opens the named next step. | Workflow/state | 5.11 acres, Continue, "Collateral & Loan Amount" | stays on step with all data valid | REQ-L-03 to REQ-L-09 | Validation rules [TBC] would block Continue first; source silent (Q-L-13) | incomplete step |
| BR-L-04 | Submission is two-step: "SUBMIT APPLICATION" on the page, then "SUBMIT APPLICATION" in a confirmation dialog. | Workflow/state | page button opens dialog, dialog button submits | page button submits immediately | REQ-L-11 | none | double click; dialog dismissed |
| BR-L-05 | The four agreements are checked before submission in the story flow. Whether each is mandatory is [TBC - exploration blocked by B-L1]. | Validation [TBC] | four checked | [TBC] | REQ-L-10, REQ-L-11 | Q-L-19 | 3 of 4 checked |
| BR-L-06 | Signed out, the two loan routes show the public page with SIGN IN and CREATE PROFILE at the same URL (no redirect). | Policy/permission | `/apply-for-a-loan` shows SIGN IN, CREATE PROFILE | redirect, or loan form | REQ-L-12 | Supersedes signin AC-40 expectation; ownership Q-L-01 | query string, trailing slash |
| BR-L-07 | SSN in tests is always the data reference `LOAN_TEST_SSN` (synthetic); no literal SSN in docs, scripts, logs, screenshots, or traces. | Constraint | `LOAN_TEST_SSN` resolved at runtime | literal 9 digits in a spec | REQ-L-05, REQ-L-13 | none | masking in traces |
| BR-L-08 | A submitted application creates real Dev records; at most one submission per run; runs are opt-in and serial. | Constraint | one gated run | looped or parallel submits | REQ-L-11, REQ-L-13 | none | retry after failure creates a duplicate (Q-L-26) |

Not rules: "AG Fast" in the scenario text suggests an acres >= 5 programme; the brief does not state it as a rule (Q-L-06). Borrow <= value is a question, not a rule (Q-L-07).

## 4. Acceptance criteria (Given / When / Then)

All ACs for steps after sign-in are [blocked by B-L1]. Wording below states what the brief says; every validation outcome is recorded as an observation until its Q-L is answered.

### 4.1 Precondition and navigation

```gherkin
AC-L-01 (REQ-L-01, BR-L-01) [happy] [blocked B-L1]
Given the account behind CUSTOMER_EMAIL exists and is MFA-registered
When I sign in with CUSTOMER_EMAIL and CUSTOMER_PASSWORD, read the "Alabama Ag Credit" code at SMS_INBOX_URL and click Verify code
Then the URL path is /apply-for-a-loan
# references signin AC-02, AC-03, AC-04

AC-L-02 (REQ-L-01, BR-L-01) [negative] [executable now, by reference]
Given CUSTOMER_EMAIL is not registered (B-L1)
When I sign in
Then "Invalid email or password." is shown, I stay on /login and no loan route is reachable as a customer
# covered by signin AC-05; evidence of B-L1, not a loan defect

AC-L-03 (REQ-L-02) [happy] [blocked B-L1]
Given I am signed in on /apply-for-a-loan
When I click "apply for loan" in the main menu, hover "Land & Home" and click "Start Application"
Then the URL path is /loan-application-creation/loan-information

AC-L-04 (REQ-L-02) [happy] [blocked B-L1]
Given AC-L-03 completed
When the page loads
Then the Loan Information page is displayed with its four questions [labels TBC]
```

### 4.2 Loan Information

```gherkin
AC-L-05 (REQ-L-03, BR-L-02, BR-L-03) [happy] [P1] [blocked B-L1]
Given the Loan Information page
When I choose Purchase, Principal residence Yes, Dwelling No, enter acres 5.11 and click Continue
Then the "Collateral & Loan Amount" step is shown

AC-L-06 (REQ-L-03) [boundary] [blocked B-L1]
Given the Loan Information page with other answers valid
When I enter acres at the boundaries 0, 0.01, 4.99, 5, 5.01, a negative, 2+ decimals, non-numeric and empty [limits TBC, Q-L-05, Q-L-06]
Then each outcome (accepted, rejected, message) is recorded and no value is accepted that the confirmed rule rejects

AC-L-07 (REQ-L-03) [negative] [blocked B-L1]
Given the Loan Information page
When I click Continue with each question unanswered in turn
Then the outcome (blocked, message text) is recorded per field [mandatory rules TBC, Q-L-12]

AC-L-08 (REQ-L-03) [alternate] [blocked B-L1]
Given the Loan Information page
When I choose Refinance, Principal residence No, or Dwelling Yes
Then the page behaviour (extra fields, different next step) is recorded [Q-L-04]
```

### 4.3 Collateral & Loan Amount

```gherkin
AC-L-09 (REQ-L-04, BR-L-03) [happy] [P1] [blocked B-L1]
Given the Collateral & Loan Amount step
When I enter the scenario text, value 160599, borrow 160500, select Barbour for both counties, verify the Branch Office, answer Contact with different branch/lender No and Active loan Yes, and click Continue
Then the "Applicant Details" step is shown

AC-L-10 (REQ-L-04) [boundary] [blocked B-L1]
Given value 160599
When I enter borrow 160598, 160599, 160600, 0, negative, non-numeric, and borrow with no value [rule TBC, Q-L-07]
Then each outcome is recorded; no assertion that borrow > value is rejected until Q-L-07 is answered

AC-L-11 (REQ-L-04) [boundary] [blocked B-L1]
Given the description field
When I enter empty, 1 character, the story text (about 100 characters), a very long text, whitespace only, special characters and non-Latin text [max length TBC, Q-L-09]
Then each outcome is recorded (counter, truncation, message)

AC-L-12 (REQ-L-04) [alternate] [blocked B-L1]
Given the county dropdowns
When I select Property county "Barbour" and Residence/HQ county "Barbour", then a different pair
Then the Branch Office shown for Barbour is recorded and changes with county only as the confirmed mapping says [Q-L-10]

AC-L-13 (REQ-L-04) [negative] [blocked B-L1]
Given the step
When I click Continue with each mandatory field empty in turn [mandatory set TBC, Q-L-12]
Then the outcome is recorded per field and the user stays on the step
```

### 4.4 Applicant Details

```gherkin
AC-L-14 (REQ-L-05, BR-L-07) [happy] [P1] [blocked B-L1]
Given the Applicant Details step
When I enter US citizen Yes, DOB 09/09/2001, MARRIED, SSN from LOAN_TEST_SSN, Mailing address different No, Contact preference ANY, Employer "Techwave", Years with employer 11, Profession "Team Lead", Years in profession 4, Year began farming 2000 and click Continue
Then the outcome is recorded; the intended result is the "Co-Applicant Details" step [see AC-L-18 on the inconsistent data]

AC-L-15 (REQ-L-05) [boundary] [blocked B-L1]
Given the DOB field
When I enter today, a date making the applicant 17, 18, 19, 99, 100+ years old, a future date, 02/30/2001, a leap day, a wrong format (31/12/2001, 2001-09-09) and empty [age limits TBC, Q-L-14]
Then each outcome is recorded; date format and picker behaviour are recorded

AC-L-16 (REQ-L-05) [boundary] [blocked B-L1]
Given the Years with employer, Years in profession and Year began farming fields
When I enter 0, 1, 99, 100, negative, decimal, non-numeric, empty, a future year, a 3-digit and a 5-digit year [limits TBC, Q-L-15]
Then each outcome is recorded

AC-L-17 (REQ-L-05) [boundary] [blocked B-L1]
Given the SSN field (data from LOAN_TEST_SSN only; shape variants are generated from it at run time, no literals stored)
When I enter the reference value with and without dashes, with 8 and 10 digits, with letters, with spaces, and empty [format rule TBC, Q-L-16]
Then each outcome is recorded; masking of the value on screen and in the summary is recorded [Q-L-17]

AC-L-18 (REQ-L-05) [data combination] [blocked B-L1]
Given the story data DOB 09/09/2001, Year began farming 2000, Years with employer 11
When I submit these values
Then the system outcome (accepted or rejected, message) is recorded as an observation; no pass or fail is decided until Q-L-18 is answered

AC-L-19 (REQ-L-05) [alternate] [blocked B-L1]
Given the step
When I choose US citizen No, Marital status other than MARRIED, Mailing address different Yes, or another Contact preference
Then extra fields or messages are recorded [Q-L-19a, Q-L-11]

AC-L-20 (REQ-L-05) [negative] [blocked B-L1]
Given the step
When I click Continue with each field empty in turn
Then the outcome is recorded per field [Q-L-12]
```

### 4.5 Co-Applicant, Income, Balance Sheet, Summary

```gherkin
AC-L-21 (REQ-L-06, BR-L-03) [happy] [blocked B-L1]
Given the Co-Applicant Details step
When I click Continue without entering data
Then the "Income" step is shown [co-applicant fields TBC, Q-L-20]

AC-L-22 (REQ-L-07, BR-L-03) [happy] [blocked B-L1]
Given the Income step
When I enter Salary/Wages 12000 and click Continue
Then the "Balance Sheet" step is shown

AC-L-23 (REQ-L-07) [boundary] [blocked B-L1]
Given the Salary/Wages field
When I enter 0, 0.01, negative, decimal, thousands separator, non-numeric, empty, a very large number [limits TBC, Q-L-21]
Then each outcome is recorded

AC-L-24 (REQ-L-08, BR-L-03) [happy] [blocked B-L1]
Given the Balance Sheet step
When I answer No to all four declarations and click Continue
Then the "Application Summary" step is shown

AC-L-25 (REQ-L-08) [alternate] [blocked B-L1]
Given the Balance Sheet step
When I answer Yes to any one declaration, and when I leave one unanswered
Then the outcome (extra questions, block, warning) is recorded [Q-L-22, Q-L-12]

AC-L-26 (REQ-L-09, BR-L-03) [happy] [blocked B-L1]
Given the Application Summary step
When it loads and I click Continue
Then it lists the values entered earlier [content TBC] and "Additional Terms & Agreements" is shown

AC-L-27 (REQ-L-09) [data integrity] [blocked B-L1]
Given values entered in steps 1 to 6
When the summary is shown
Then every value equals what was entered (no loss, rounding or reformatting beyond the confirmed display rule); SSN display is masked as the confirmed rule says [Q-L-17]
```

### 4.6 Terms and submission

```gherkin
AC-L-28 (REQ-L-10, BR-L-05) [happy] [blocked B-L1]
Given Additional Terms & Agreements
When I check Financial Report and Bylaw Disclosure, Patronage and Investment Information, right to receive an Appraisal Report and authorization to run a credit check
Then all four boxes are checked and SUBMIT APPLICATION is available

AC-L-29 (REQ-L-10, BR-L-05) [negative] [blocked B-L1]
Given Additional Terms & Agreements
When I check none, then 1, 2, 3 of the four boxes and click SUBMIT APPLICATION
Then the outcome (disabled button, message, dialog opens) is recorded per combination [Q-L-19]

AC-L-30 (REQ-L-11, BR-L-04, BR-L-08) [happy] [P1] [blocked B-L1] [gated: opt-in single run]
Given all four boxes are checked
When I click SUBMIT APPLICATION, then SUBMIT APPLICATION in the confirmation dialog
Then the next screen with "Skip feedback & continue" is shown

AC-L-31 (REQ-L-11, BR-L-04) [alternate] [blocked B-L1]
Given the confirmation dialog is open
When I dismiss it (close, Cancel or Escape; control names TBC)
Then no application is submitted and the page behind keeps all data

AC-L-32 (REQ-L-11) [happy] [blocked B-L1]
Given the post-submit screen
When I click "Skip feedback & continue"
Then the destination (for example the dashboard or application list) is recorded and the submitted application is listed with a status [Q-L-23]

AC-L-33 (REQ-L-11) [concurrency] [blocked B-L1]
Given the confirmation dialog
When I double click the dialog's SUBMIT APPLICATION
Then exactly one application is created and no error is shown

AC-L-34 (REQ-L-11) [integration] [blocked B-L1]
Given the submit request is delayed or fails (5xx, timeout, simulated by network interception)
When I submit
Then the user sees an error, can retry, and no duplicate application results [Q-L-26]
```

### 4.7 Navigation, save/resume, session

```gherkin
AC-L-35 (REQ-L-15) [alternate] [blocked B-L1]
Given I completed several steps
When I use the in-page Back control and the browser Back button, then Continue
Then previously entered values are retained as the confirmed rule says [Q-L-27]

AC-L-36 (REQ-L-15) [alternate] [blocked B-L1]
Given a partly completed application
When I sign out (or close the tab) and sign in again
Then whether the draft is resumable, and from which step, is recorded [Q-L-27]

AC-L-37 (REQ-L-16) [state] [blocked B-L1]
Given a partly completed application and an expired session
When I click Continue or SUBMIT APPLICATION
Then the user is returned to sign-in or shown a message, nothing is submitted, and the outcome for entered data is recorded [Q-L-28]
```

### 4.8 Data impact

```gherkin
AC-L-38 (REQ-L-13, BR-L-08, BR-L-07) [policy] [manual / process]
Given the e2e-full submit scenario is configured
When the suite runs
Then it runs only when explicitly opted in, serially, with one submission, SSN read from LOAN_TEST_SSN, no SSN literal in logs, traces or screenshots, and the created record identifier is logged for cleanup [Q-L-24, Q-L-25]
```

### 4.9 Signed-out route access (executable now, no account)

```gherkin
AC-L-39 (REQ-L-12, BR-L-06) [negative] [P1] [executable now]
Given I am signed out
When I open CUSTOMER_BASE_URL + /apply-for-a-loan
Then the final URL path is still /apply-for-a-loan (no redirect)
And the page shows buttons "SIGN IN" and "CREATE PROFILE"
And no loan application form control is present

AC-L-40 (REQ-L-12, BR-L-06) [negative] [P1] [executable now]
Given I am signed out
When I open CUSTOMER_BASE_URL + /loan-application-creation/loan-information
Then the final URL path is still /loan-application-creation/loan-information
And the page shows buttons "SIGN IN" and "CREATE PROFILE"
And none of "Purchase or refinance?", "How many acres?" or a Continue button is present

AC-L-41 (REQ-L-12) [alternate] [executable now]
Given I am signed out on /loan-application-creation/loan-information
When I click "SIGN IN", and separately "CREATE PROFILE" (from a fresh load each time)
Then the destination of each is recorded (expected /login and /create-profile as on the landing page; not observed from this route) [Q-L-02]

AC-L-42 (REQ-L-12, REQ-L-14) [a11y] [executable now]
Given I am signed out on either loan route
When scanned with axe and tabbed through
Then the SIGN IN and CREATE PROFILE controls have accessible names, are reachable by keyboard, and findings are recorded against the signed-out public page only
```

## 5. Edge cases

| ID | Edge case | Category | Covered by | Notes |
|---|---|---|---|---|
| EDGE-L-01 | Acres 0, 0.01, 4.99, 5, 5.01, 5.11 (story), more than 2 decimals, thousand separator, very large | Boundary | AC-L-06 | AG Fast threshold >= 5 is a question (Q-L-06) |
| EDGE-L-02 | Acres empty, negative, text, comma as decimal (5,11) | Data | AC-L-06 | locale |
| EDGE-L-03 | Dwelling Yes with acres >= 5 versus Dwelling No (story) | Data combination | AC-L-08 | Q-L-04 |
| EDGE-L-04 | Borrow equal to value, one above, one below (story 160500 vs 160599) | Boundary | AC-L-10 | Q-L-07 |
| EDGE-L-05 | Borrow or value 0, negative, decimals, very large, thousands separator, currency symbol | Boundary | AC-L-10 | |
| EDGE-L-06 | Value changed after borrow entered (borrow now exceeds value) | Data combination | AC-L-10 | order of validation |
| EDGE-L-07 | Description text: empty, whitespace, max length, max+1, emoji, non-Latin, HTML/script-like, newline, paste | Boundary / input safety | AC-L-11 | Q-L-09 |
| EDGE-L-08 | Property county differs from Residence/HQ county | Data combination | AC-L-12 | Q-L-10 |
| EDGE-L-09 | County not selected (default option) | Mandatory | AC-L-13 | |
| EDGE-L-10 | Branch Office verify control not acted on | Mandatory | none | control unobserved (Q-L-10) |
| EDGE-L-11 | DOB: exactly 18 today, 18 tomorrow, 17y 364d, 100+, future | Boundary | AC-L-15 | Q-L-14 |
| EDGE-L-12 | DOB invalid calendar dates, leap day, wrong format, date picker vs typing, locale (dd/mm vs mm/dd) | Locale | AC-L-15 | 09/09/2001 is ambiguous-proof; use 13/09 variants |
| EDGE-L-13 | Years with employer 11 vs applicant age (about 24 on test date) | Data combination | AC-L-18 | Q-L-18 |
| EDGE-L-14 | Years fields 0, 1, max, max+1, decimal, negative, text | Boundary | AC-L-16 | Q-L-15 |
| EDGE-L-15 | Years in profession (4) greater than Years with employer, or greater than age minus 14 | Data combination | none | Q-L-18 |
| EDGE-L-16 | Year began farming before birth year (2000 vs 2001, story), equal to birth year, future year, 4-digit vs 2-digit | Data combination | AC-L-18, AC-L-16 | Q-L-18 |
| EDGE-L-17 | SSN with dashes, without, 8 or 10 digits, letters, spaces, all same digit, leading/trailing space (generated from `LOAN_TEST_SSN`, no literals) | Boundary / input safety | AC-L-17 | Q-L-16 |
| EDGE-L-18 | SSN masked or shown in summary, in network payload, in DOM, copy/paste | Access | AC-L-17, AC-L-27 | Q-L-17 |
| EDGE-L-19 | Employer/Profession text: empty, max length, special characters, non-Latin | Boundary | AC-L-14 | Q-L-09 |
| EDGE-L-20 | Mandatory fields left empty on each step, one at a time and all together | Mandatory | AC-L-07, 13, 20, 25 | Q-L-12 |
| EDGE-L-21 | Salary/Wages 0, negative, decimals, very large, separators, currency symbol | Boundary | AC-L-23 | Q-L-21 |
| EDGE-L-22 | Co-Applicant: Continue with no data; adding a co-applicant | Alternate | AC-L-21 | Q-L-20 |
| EDGE-L-23 | Balance Sheet: Yes to any declaration; one declaration left unanswered | Alternate | AC-L-25 | Q-L-22 |
| EDGE-L-24 | In-page Back and browser Back/Forward between steps; values retained | State | AC-L-35 | Q-L-27 |
| EDGE-L-25 | Direct URL to a later step skipping earlier steps | State | none | Q-L-27; signed-out equivalent is AC-L-40 |
| EDGE-L-26 | Refresh mid-step: data lost or kept | State | AC-L-35, AC-L-36 | Q-L-27 |
| EDGE-L-27 | Save/resume: sign out and back in, resume step, draft age, multiple drafts | State | AC-L-36 | Q-L-27 |
| EDGE-L-28 | Two browser tabs editing the same application | Concurrency | none | stale data |
| EDGE-L-29 | Double click on Continue (creates duplicate steps or records) | Concurrency | none | |
| EDGE-L-30 | Double click on dialog SUBMIT APPLICATION; click page SUBMIT twice | Concurrency | AC-L-33 | Q-L-26 |
| EDGE-L-31 | Submit then Back or Refresh on the confirmation: resubmission | State | none | Q-L-23 |
| EDGE-L-32 | Session expiry mid-application, at submit, while dialog open | State | AC-L-37 | Q-L-28 |
| EDGE-L-33 | Submit request timeout, 5xx, partial failure (record created, UI error) | Integration | AC-L-34 | Q-L-26 |
| EDGE-L-34 | Hover-only menu: keyboard, touch (no hover), narrow viewport | Accessibility / UI | AC-L-03, AC-L-42 | Q-L-03 |
| EDGE-L-35 | Large lists: county dropdown length, typeahead, scroll | Volume | AC-L-12 | |
| EDGE-L-36 | Signed-out direct access with query string, trailing slash, uppercase path, expired session cookie | Access | AC-L-39, 40 partly | |

Not covered by any AC: EDGE-L-10, 25, 28, 29, 31 (and 36 only partly). Add ACs after Q-L-03, Q-L-10, Q-L-27 are answered.

## 6. Testability score

Requirements clarity (REQs with no open question / all REQs): REQ-L-01 and REQ-L-12 = 2 of 16 = **12.5 %** (below 70 %). REQ-L-01 counts as clear because it is fully stated and its blocker is a data issue, not an ambiguity.

| Area | Score /10 | Rationale |
|---|---|---|
| Signed-out route access | 9 | Observed, stable, no account needed |
| Precondition (sign-in to `/apply-for-a-loan`) | 1 | B-L1; account does not exist |
| Navigation to Start Application | 3 | Labels stated, menu behaviour (hover) unobserved |
| Loan Information | 3 | Values stated, control types and rules unobserved |
| Collateral & Loan Amount | 2 | Values stated, borrow/value, length and county mapping unknown |
| Applicant Details | 2 | Values stated, age, SSN, years rules unknown, story data inconsistent |
| Co-Applicant, Income, Balance Sheet, Summary | 2 | Only the Continue path and values known |
| Terms and submission | 3 | Flow stated; dialog and confirmation unobserved; data impact |
| Back/continue, save/resume, session | 1 | Entirely unknown |
| Accessibility | 2 (signed-out 7) | Post-login unobserved; public page observable |
| Data impact | 4 | Policy stated; lineage and cleanup owner unknown |

Overall: **3 / 10**. Only 4 of 42 ACs (AC-L-39 to AC-L-42) plus AC-L-02 (by reference) are executable now.

## 7. Implicit rules (with reasoning)

| # | Rule | Reasoning |
|---|---|---|
| I-L-1 | The loan routes require an authenticated session for the loan form to appear. | Signed out, the form is absent and a public page shows [O]. The enforcement mechanism is not a redirect. [I] |
| I-L-2 | Each step has at least one mandatory field. | Typical for multi-step forms; the brief says "mandatory fields" under required coverage but names none. Not asserted, see Q-L-12. |
| I-L-3 | The Summary reflects entered values. | A summary step is named in the brief; content unobserved. |
| I-L-4 | A confirmation dialog implies a point of no return for the draft. | Two-step submit [B]; consequences unknown. |
| I-L-5 | Applicant age is about 24 on 2026-11-10 for DOB 09/09/2001. | Arithmetic on stated data, not a rule. |

## 8. Ambiguities and open questions

| ID | Question | Linked | Suggested resolution | Owner |
|---|---|---|---|---|
| Q-L-01 | Is "no redirect, public page with SIGN IN and CREATE PROFILE" at the loan routes the intended design (sign-in Q-12)? | REQ-L-12, BR-L-06, AC-L-39, AC-L-40 | Product confirms; update signin AC-40 | Product owner / Dev |
| Q-L-02 | Where do SIGN IN and CREATE PROFILE on the public loan routes go, and does SIGN IN return the user to the requested loan route after login? | AC-L-41 | Observe and confirm | QA / Dev |
| Q-L-03 | What is the exact main-menu structure, and is there a keyboard or touch alternative to hovering "Land & Home"? | REQ-L-02, REQ-L-14, AC-L-03, EDGE-L-34 | Observe once account exists | QA (after Q-L-29 resolved via B-L1) |
| Q-L-04 | What do Refinance, Principal residence No and Dwelling Yes change (extra fields, different steps)? | REQ-L-03, AC-L-08, EDGE-L-03 | Product spec | Product owner |
| Q-L-05 | What are the min, max and decimal precision for acres? Are 0 and negatives rejected? | REQ-L-03, AC-L-06, EDGE-L-01 | Product spec | Product owner |
| Q-L-06 | Is "AG Fast" an acres >= 5 programme (scenario text: "Acres more than / equal to 5, with AG Fast (160599)")? What differs for acres below 5, and what does "160599" in the label mean? | REQ-L-03, REQ-L-04, AC-L-06 | Product confirms threshold and effect | Product owner |
| Q-L-07 | Must Borrow amount be <= Estimated property value (story: 160500 vs 160599)? Is there an LTV limit, minimum or maximum loan? | REQ-L-04, AC-L-10, EDGE-L-04 | Product spec | Product owner |
| Q-L-08 | What currency format and decimals do value and borrow accept (separators, symbol)? | REQ-L-04, EDGE-L-05 | Observe and confirm | QA / Dev |
| Q-L-09 | What are the maximum lengths for the financing description, Employer name and Profession; is there a character counter; are special characters allowed? | REQ-L-04, REQ-L-05, AC-L-11, EDGE-L-07 | Observe field attributes; product confirms | QA / Dev |
| Q-L-10 | What is the county-to-branch mapping; what does "Verify the Branch Office" require; what does "Contact with different branch/lender" change? | REQ-L-04, AC-L-12, EDGE-L-08, EDGE-L-10 | Product supplies mapping | Product owner |
| Q-L-11 | What do the Mailing address different Yes, Marital status values and Contact preference options change (extra fields)? | REQ-L-05, AC-L-19 | Observe | QA |
| Q-L-12 | Which fields are mandatory on each step, what is the error message and its position, and does Continue stay enabled? | All step REQs, AC-L-07, 13, 20, 25, EDGE-L-20 | Product spec or observe | Product owner / QA |
| Q-L-13 | When Continue is blocked by a validation error, is the user kept on the step; does validation run on blur, on Continue, or both? | BR-L-03 | Observe | QA |
| Q-L-14 | What are the minimum and maximum applicant age and the date format for DOB? | REQ-L-05, AC-L-15, EDGE-L-11, EDGE-L-12 | Product spec | Product owner |
| Q-L-15 | What are the limits (min, max, decimals) for Years with employer, Years in profession and Year began farming? | REQ-L-05, AC-L-16, EDGE-L-14 | Product spec | Product owner |
| Q-L-16 | What SSN format (digits only, dashes), validation (area/group/serial rules), and uniqueness check apply? | REQ-L-05, AC-L-17, EDGE-L-17 | Product spec; format of `LOAN_TEST_SSN` stays in test data | Product owner / Security |
| Q-L-17 | Is SSN masked in the field, the summary, and the API payload; is it stored encrypted? | AC-L-17, AC-L-27, EDGE-L-18, BR-L-07 | Security confirms | Security / Dev |
| Q-L-18 | **Story data inconsistency**: DOB 09/09/2001 vs Year began farming 2000 (farming began before birth), and Years with employer 11 (employment since about 2015, applicant about 14 years old; also Years in profession 4 < 11). Is the data intentionally invalid to test, or a story error; must the system reject it; which cross-field rules exist (year-began-farming >= birth year, years <= age minus a minimum working age)? If no rule exists, the story runs on invalid data and the dataset should be corrected. | REQ-L-05, AC-L-14, AC-L-18, EDGE-L-13, 15, 16 | Product owner confirms rules and corrected test data | Product owner |
| Q-L-19 | Are all four agreement boxes mandatory for submit; is SUBMIT APPLICATION disabled until all are checked; are the agreements links with full text? (19a: what does "US citizen No" change?) | REQ-L-10, BR-L-05, AC-L-29, AC-L-19 | Product spec | Product owner |
| Q-L-20 | What fields does Co-Applicant Details contain, is it optional, and how is a co-applicant added? | REQ-L-06, AC-L-21, EDGE-L-22 | Observe | QA |
| Q-L-21 | Is Salary/Wages monthly or annual; what are limits and format; can other income types be added? | REQ-L-07, AC-L-23, EDGE-L-21 | Product spec | Product owner |
| Q-L-22 | What happens on Balance Sheet when any declaration is Yes (block, extra questions, referral)? | REQ-L-08, AC-L-25, EDGE-L-23 | Product spec | Product owner |
| Q-L-23 | What does the confirmation show (application number, status, email/SMS notification)? Where does "Skip feedback & continue" go? Can the application be viewed or withdrawn afterwards? | REQ-L-11, AC-L-32, EDGE-L-31 | Observe once account exists | Product owner / QA |
| Q-L-24 | Data lineage: which Dev records does a submit create (application, applicant, SSN, documents, notifications), in which systems? | REQ-L-13, BR-L-08, AC-L-38 | Dev lists records and keys | Dev |
| Q-L-25 | Who owns cleanup of submitted applications (script, DB job, manual), how often, and can the customer account be reused for repeated submits? | REQ-L-13, AC-L-38 | Name owner; agree schedule | Dev / Test lead |
| Q-L-26 | Is the submit idempotent (double click, retry after timeout)? What is the retry rule? | REQ-L-11, AC-L-33, AC-L-34, EDGE-L-30, 33 | Product / Dev | Dev |
| Q-L-27 | Does the app save drafts automatically; can the customer resume after sign-out; do in-page Back and browser Back preserve values; can steps be reached by direct URL? | REQ-L-15, AC-L-35, AC-L-36, EDGE-L-24 to 27 | Product spec | Product owner |
| Q-L-28 | What is the session timeout, and what happens to entered data and an open submit dialog when it expires? | REQ-L-16, AC-L-37, EDGE-L-32 | Dev / identity tenant config | Dev |
| Q-L-29 | Who creates or restores the account behind `CUSTOMER_EMAIL` and the MFA number so steps 1 to 45 can be explored (B-L1; same as signin Q-01, Q-02)? Is a pre-seeded customer, an allowed SMS route, or a Cloudflare-whitelisted inbox available? | REQ-L-01, B-L1 | Provide a registered, MFA-ready test account | Product owner / Dev / DevOps |

## 9. Traceability

| REQ | BR | AC | EDGE |
|---|---|---|---|
| REQ-L-01 | BR-L-01 | AC-L-01, AC-L-02 | none (see Signin EDGE-01 to 28) |
| REQ-L-02 | BR-L-02 | AC-L-03, AC-L-04 | EDGE-L-34 |
| REQ-L-03 | BR-L-02, BR-L-03 | AC-L-05 to AC-L-08 | EDGE-L-01 to 03, 20 |
| REQ-L-04 | BR-L-03 | AC-L-09 to AC-L-13 | EDGE-L-04 to 10, 20, 35 |
| REQ-L-05 | BR-L-03, BR-L-07 | AC-L-14 to AC-L-20 | EDGE-L-11 to 20 |
| REQ-L-06 | BR-L-03 | AC-L-21 | EDGE-L-22 |
| REQ-L-07 | BR-L-03 | AC-L-22, AC-L-23 | EDGE-L-21 |
| REQ-L-08 | BR-L-03 | AC-L-24, AC-L-25 | EDGE-L-23 |
| REQ-L-09 | BR-L-03 | AC-L-26, AC-L-27 | EDGE-L-18 |
| REQ-L-10 | BR-L-05 | AC-L-28, AC-L-29 | none |
| REQ-L-11 | BR-L-04, BR-L-05, BR-L-08 | AC-L-30 to AC-L-34 | EDGE-L-29 to 31, 33 |
| REQ-L-12 | BR-L-01, BR-L-06 | AC-L-39 to AC-L-42 | EDGE-L-25 (post-login analogue), EDGE-L-36 |
| REQ-L-13 | BR-L-07, BR-L-08 | AC-L-38 | EDGE-L-33 |
| REQ-L-14 | n/a | AC-L-42 (signed-out); post-login a11y [TBC, to add in Phase 2] | EDGE-L-34 |
| REQ-L-15 | BR-L-02 | AC-L-35, AC-L-36 | EDGE-L-24 to 28 |
| REQ-L-16 | BR-L-01 | AC-L-37 | EDGE-L-32 |

BR coverage: BR-L-01 (AC-L-01, 02, 39), BR-L-02 (AC-L-05, 35), BR-L-03 (AC-L-05, 09, 21, 22, 24, 26), BR-L-04 (AC-L-30, 31, 33), BR-L-05 (AC-L-28, 29), BR-L-06 (AC-L-39, 40), BR-L-07 (AC-L-14, 17, 38), BR-L-08 (AC-L-30, 38).

Note on REQ-L-14: a post-login keyboard and screen-reader AC cannot be written without observing the screens; one signed-out AC (AC-L-42) satisfies the minimum, and post-login accessibility ACs are a Phase 2 gap listed under open work.

Cross-references to sign-in work (not re-raised): Q-12 (signed-out no redirect), S-F-01 / B-S1 (user_not_found), B-S2 / F-02 (receive-smss Cloudflare), AC-02 to AC-05.
