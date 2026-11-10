# Test Data — Customer Loan Application – Land & Home

Environment: Dev (the submit target, B-L3, test plan section 4). QA, Staging, UAT: not in scope of the test plan, TBC. Seed: 4242 (applies to any generated free text; all other values are fixed).
Status: DRAFT, Phase 4 (Data). Sources: `docs/ACCEPTANCE-CRITERIA-Customer-Loan-Application.md`, `docs/TEST-CASES-Customer-Loan-Application.md`, `docs/TEST-PLAN-Customer-Loan-Application.md`, story brief.
Blocker: B-L1 (no registered customer account). Every post-login value is defined here but cannot be executed until B-L1 clears.

Notation: TD-L-01..25 and PC-L-1..12 keep the IDs the TC file uses. `[TBC – Q-L-nn]` = not observed and not invented; the Q-L link says who answers. A "probe" is a value chosen to exercise a boundary; it is not a claim about a business rule. No secret value, password, or SSN literal appears in this file.

---

## 0. Gate result

| Class | TD-L IDs | Count | Gate status |
|---|---|---|---|
| Positive | 01, 02, 04, 05, 09, 10, 15, 17, 19, 20 | 10 | Ready as data. Story values are verbatim from the brief. Not executable until B-L1 clears and `LOAN_TEST_SSN` is provisioned. Outcomes `[TBC]`. |
| Negative | 13, 14, 22, 23 | 4 | Ready as inputs. Expected outcomes `[TBC]` (Q-L-12, 13, 16, 18, 19, 26). TD-L-23 is evidence of B-L1 only. |
| Boundary | 03, 06, 07, 11, 12, 16, 18, 25 | 8 | Probes ready. Every limit is `[TBC]` with its Q-L link (section 4). No limit invented. |
| Security-abuse | 08, 21, 24 | 3 | Ready. Injection and encoding members added to the numeric and text sets (section 3.2). Most of the new members have no TC yet (DI-07). |

Gate: PASS WITH FLAGS. Every positive, negative and boundary dataset is either ready or flagged `[TBC]` with a reason. No TD-L ID referenced by a TC is undefined. Four TD-L IDs are defined but have a required value still TBC (TD-L-09, 15, 22, 24; section 3.1). The `LOAN_TEST_SSN` source is TBC (section 1.3).

---

## 1. Data contract

### 1.1 Rules

- Tests read data by contract key. No literal names, emails, SSNs, or payloads in specs.
- Data comes from the data source at run time. The endpoint and any credential come from environment variables or the secret store. Nothing is committed as a payload file (see DI-09 for the test plan conflict).
- Missing configuration fails fast with a message naming the variable (section 1.4). The test plan (section 4) says a missing key skips dependent TCs instead; see DI-10.

### 1.2 Contract keys

| Contract key | Resolves to | Source | Used by |
|---|---|---|---|
| `loanCustomerAccountRef` | env names `CUSTOMER_EMAIL`, `CUSTOMER_PASSWORD` (values never stored here) | env or secret store | TD-L-01, TD-L-23 |
| `loanSmsInboxRef` | env name `SMS_INBOX_URL`; sender label "Alabama Ag Credit" | env; sender label from data source | TD-L-01 |
| `loanBaseUrlRef` | env name `CUSTOMER_BASE_URL` | env | all UI TCs |
| `loanTestSsnRef` | `LOAN_TEST_SSN` | see section 1.3 | TD-L-10, TD-L-13 |
| `loanStoryLoanInfo` | TD-L-02 | data source | TC-L-09, 11, 14, 15, 17, 39, 40, 58, 61..66 |
| `loanStoryCollateral` | TD-L-05 | data source | TC-L-18, 23, 24, 39, 40, 50, 55, 58, 61, 65, 66 |
| `loanStoryApplicant` | TD-L-10 | data source | TC-L-25, 29, 31, 32, 39, 40, 50, 51, 55, 59, 61, 65, 66 |
| `loanStoryIncome` | TD-L-17 | data source | TC-L-35, 39, 40, 59, 61, 65, 66 |
| `loanStoryBalanceSheet` | TD-L-19 | data source | TC-L-37..40, 59, 61, 65, 66 |
| `loanStoryAgreements` | TD-L-20 | data source | TC-L-41..45, 47, 56, 60, 61, 66 |
| `loanProbeSet.<TD-L-id>` | probe lists keyed by TD-L ID (TD-L-03, 06, 07, 08, 11, 12, 16, 18) | data source | boundary TCs |
| `loanBranchForCounty` | county to Branch Office mapping | data source `[TBC – Q-L-10]` | TD-L-05, TD-L-09 |
| `loanRunId` | generated once per run (section 8) | runner | run log, lineage |
| `loanSubmitOptIn` | opt-in switch; env name `[TBC – Q-L-24]` | env | TC-L-43, 47, 49, 66 |
| `loanCleanupOwner` | named owner `[TBC – Q-L-25]` | config | lineage (section 8) |
| `loanProposalApplicantAlt` | PROPOSAL only, not active (section 5.2) | data source | none until product confirms |

### 1.3 LOAN_TEST_SSN contract

- **Key:** `LOAN_TEST_SSN` (contract key `loanTestSsnRef`). This is the only SSN string allowed in specs, TD files, docs, logs, traces, screenshots, and reports.
- **Source:** `[TBC – Q-L-16, Q-L-17; name to be agreed with the Security contact]`. Two options:
  - (a) An env var injected by the runner from the secret store.
  - (b) A data loader that reads the secret store at run start and hands the spec the contract key only.
  - Recommendation: (b). The value then never sits in the repo, a shell profile, or a spec file.
- **Synthetic-only rule:** the area component (first three digits) must come from a range the SSA never issues: 000, 666, or 900 to 999. The value therefore cannot be a real issued number. `[TBC – Q-L-16]` for the product validation rule. Uniqueness against real records is also `[TBC – Q-L-16]`.
- **Conflict to resolve (DI-08):** if product validates the area component, a reference value from an invalid range will be rejected, and the happy path (TD-L-10, TC-L-25, TC-L-66) will stop at Applicant Details. In that case a different synthetic-only strategy is needed, such as a test-issuance range agreed with product. Decide before any gated run.
- **Shape variants:** derived in memory from the reference value at run time, never stored, never logged. The run log records only the variant ID.

| Variant | Transformation applied to the reference value |
|---|---|
| V00 | Reference value as provided (its form, digits or dashed, is `[TBC – Q-L-16]`) |
| V01 | Dashed form: hyphens inserted after the 3rd and 5th digits |
| V02 | Digits only: all hyphens and spaces removed |
| V03 | Last digit removed (8 digits) |
| V04 | One fixed digit appended (10 digits) |
| V05 | Last digit replaced by a letter |
| V06 | One space inserted after the 3rd digit |
| V07 | One leading space and one trailing space added |
| V08 | Field cleared (empty) |
| V09 | Every digit replaced by the reference's first digit (all the same digit) |
| V10 | Area component replaced by 000 |
| V11 | Area component replaced by 666 |
| V12 | Area component replaced by 900 (the 9xx range) |
| V13 | Hyphens in wrong positions (after the 2nd and 6th digits) |
| V14 | Non-digit string with SQL metacharacters; not derived from the reference (security-abuse member) |

- **Masking:** typed values are never printed. No `console.log` of the field. Video off and trace masking on for any TC that types the SSN. Screenshots of the summary show the masked field only. Network payload checks (TC-L-29) compare presence and masking without printing the value (test plan 5.1).

### 1.4 Fail-fast message (example, names only)

```
Missing configuration: LOAN_TEST_SSN is not set. Resolve the loan test SSN from the secret store
(contract key loanTestSsnRef) before running loan specs.
```

### 1.5 Review checklist

| Check | Status |
|---|---|
| No hard-coded names or emails in specs | Pass for this design. The account comes from an env var name only. |
| No checked-in payload files | Open: the test plan (section 5) proposes a TD file under `test-data/` with story values. Conflicts with the contract (DI-09). |
| Every reference resolves to a contract key | Pass for TD-L. The branch for Barbour is `[TBC – Q-L-10]`. |
| No SSN literal (9 digits or ddd-dd-dddd) | Pass for this file. Re-scan after write (TC-L-57). |
| No secret values | Pass. |

---

## 2. Setup state chain (PC-L-1..12)

Each post-login block is rebuilt from the chain by a shared fixture that replays the story data. No TC reuses another TC's draft. If product rejects TD-L-10 (Q-L-18), PC-L-6 and every block after it cannot be built with the story data. Then the proposed alternative (section 5.2) would be needed for the chain, and only after product confirms it.

| PC-L | Built from | Adds | State reached |
|---|---|---|---|
| PC-L-1 | none | nothing | Anonymous, signed out. Automatable now. |
| PC-L-2 | PC-L-1 | Sign-in per TD-L-01 (credentials, SMS code, Verify code) | URL path `/apply-for-a-loan`. Blocked (B-L1). One session at a time. |
| PC-L-3 | PC-L-2 | Main menu, apply for loan, Land & Home, Start Application | Loan Information open. Nothing entered. |
| PC-L-4 | PC-L-3 | TD-L-02 entered, Continue | "Collateral & Loan Amount" shown. |
| PC-L-5 | PC-L-4 | TD-L-05 entered, Continue | "Applicant Details" shown. |
| PC-L-6 | PC-L-5 | TD-L-10 entered, Continue | "Co-Applicant Details" shown. Acceptance `[TBC – Q-L-18]`. |
| PC-L-7 | PC-L-6 | Continue on Co-Applicant Details | "Income" shown. |
| PC-L-8 | PC-L-7 | TD-L-17 entered, Continue | "Balance Sheet" shown. |
| PC-L-9 | PC-L-8 | TD-L-19 (all No), Continue | "Application Summary" shown. |
| PC-L-10 | PC-L-9 | Continue | "Additional Terms & Agreements" shown. No box checked. |
| PC-L-11 | PC-L-10 | TD-L-20, all four boxes checked. Opt-in gate set (name `[TBC – Q-L-24]`). | No submit yet. Cleanup owner named (Q-L-25) or the run is not started. |
| PC-L-12 | PC-L-11 | Page "SUBMIT APPLICATION" clicked | Confirmation dialog open. Not confirmed. |

---

## 3. TD-L datasets

### 3.1 Dataset register

Class is the primary class. Security and negative members inside a positive or boundary set are listed inline. "Used by" lists the TCs that name the TD-L ID in their Test data column.

| TD ID | Class | Values | Used by TCs | Open link |
|---|---|---|---|---|
| TD-L-01 | Positive | Sign-in by name only: `CUSTOMER_EMAIL`, `CUSTOMER_PASSWORD`; SMS from `SMS_INBOX_URL`, sender "Alabama Ag Credit"; base `CUSTOMER_BASE_URL`; Verify code lands on `/apply-for-a-loan`. Values are never written here. | TC-L-07, 08, 10, 16, 52, 56, 66 | Q-L-29 (account); B-L1 |
| TD-L-02 | Positive | Story, verbatim: Purchase or refinance? = Purchase; Principal residence? = Yes; Dwelling on the property? = No; How many acres? = 5.11 | TC-L-09, 11, 14, 15, 17, 39, 40, 58, 61, 62, 63, 64, 65, 66 | Q-L-03, Q-L-12 (labels, control types) |
| TD-L-03 | Boundary (+ security) | Acres probes: 0, 0.01, 4.99, 5, 5.01, 5.11, 5.111, 1,000, 5,11, -1, abc, empty, a very large 8-digit probe (generated at run time). Security members: SQL metacharacter string; null-byte suffix on 5.11; full-width-digit form of 5.11 (encoding bypass). | TC-L-12, 13 | Q-L-05, Q-L-06 `[TBC]` |
| TD-L-04 | Positive (+ negative band A) | Alternates: Refinance; Principal residence = No; Dwelling = Yes. DT-L-01 band representatives: band A = empty (invalid); band B = 4.99; band C = 5.11. | TC-L-15 | Q-L-04, Q-L-05, Q-L-06 `[TBC]` |
| TD-L-05 | Positive | Story, verbatim. Description: "Scenario : Customer apply for loan- Land & Home, with dwelling No and Acres more than / equal to 5, with AG Fast (160599)". Estimated property value = 160599; Borrow amount = 160500; Property county = Barbour; Residence/HQ county = Barbour; Branch Office verified; Contact with different branch/lender = No; Active loan with Alabama Ag Credit = Yes. | TC-L-18, 23, 24, 39, 40, 50, 55, 58, 61, 65, 66 | Branch for Barbour `[TBC – Q-L-10]`. Text embeds 160599 and the acres/dwelling claim (section 5.3). |
| TD-L-06 | Boundary (+ security) | Borrow probes with value 160599: 160598, 160599, 160600, 0, -1, abc, empty, 160500.50, "160,500", "$160500". Security members: SQL metacharacter string; null-byte suffix. | TC-L-19 | Q-L-07 (borrow vs value), Q-L-08 (format) `[TBC]` |
| TD-L-07 | Boundary (+ security) | Value probes: 0, -1, 160599.99, a very large 11-digit probe (generated), empty. Order-edit probe: borrow 160500 entered first, then value edited to 160000. Security member: SQL metacharacter string. | TC-L-20 | Q-L-07, Q-L-08, Q-L-13 `[TBC]` |
| TD-L-08 | Security-abuse | Description probes: empty; "A"; story text (from TD-L-05); a 5000-character run of the letter "a" (long probe, generated); whitespace only; `<script>alert(1)</script>`; `& < > " ' %`; emoji; non-Latin text; newline; path traversal string `../../`; SQL metacharacter string `' OR '1'='1`. Max and max+1 after Q-L-09. | TC-L-21 | Q-L-09 (max length) `[TBC]` |
| TD-L-09 | Positive (+ negative) | County: Barbour / Barbour (positive). Second pair of two other counties from the dropdown (names `[TBC]`). Negative member: nothing selected (default). First and last list option (names `[TBC]`). | TC-L-22, 24 | Q-L-10 (list, branch) `[TBC]` |
| TD-L-10 | Positive | Story, verbatim: US citizen = Yes; DOB = 09/09/2001; Marital status = MARRIED; SSN = `LOAN_TEST_SSN` (reference; variants from TD-L-13); Mailing address different = No; Contact preference = ANY; Employer name = Techwave; Years with employer = 11; Profession = Team Lead; Years in profession = 4; Year began farming = 2000. | TC-L-25, 29, 31, 32, 39, 40, 50, 51, 55, 59, 61, 65, 66 | Q-L-18 (inconsistent, section 5); Q-L-20 (MARRIED vs co-applicant) |
| TD-L-11 | Boundary (+ security) | DOB probes, computed from the run date in the app's timezone `[TBC]`: today; age 17 years 364 days (day before the 18th birthday; the same probe as the TC file's "18 tomorrow"); exactly 18 years today; 19 years; 99 years; 100 years or more; future date (run date + 1 day); 02/30/2001 (invalid day); 02/29/2000 (valid leap day); 31/12/2001 (valid only day-first); 2001-09-09 (ISO); 13/09/2001 (day-first proof); empty. Security member: SQL metacharacter string. | TC-L-26 | Q-L-14 (min and max age, format, picker) `[TBC]` |
| TD-L-12 | Boundary (+ security) | Years probes (employer, profession, farming start): 0, 1, 99, 100, -1, 1.5, abc, empty. Farming-start extras: current year + 1 (computed; DI-04), 200 (3-digit), 20000 (5-digit), 2001 (equal to the story birth year). Security member: SQL metacharacter string. | TC-L-27, 30 | Q-L-15 `[TBC]` |
| TD-L-13 | Negative (+ V00 positive) | SSN variants V00 to V14, derived at run time from `LOAN_TEST_SSN` (section 1.3). V14 is the SQL metacharacter member. | TC-L-25, 28, 29, 57, 66 | Q-L-16, Q-L-17 `[TBC]` |
| TD-L-14 | Negative | Story inconsistency set: DOB 09/09/2001; Year began farming 2000; Years with employer 11; Years in profession 4. Variant: Year began farming = 2001 (equal to birth year). Observation only. | TC-L-30 | Q-L-18 `[TBC]` |
| TD-L-15 | Positive | Applicant alternates: US citizen = No; each other Marital status option (names `[TBC]`); Mailing address different = Yes; each other Contact preference option (names `[TBC]`). | TC-L-31 | Q-L-11, Q-L-19 `[TBC]` |
| TD-L-16 | Boundary (+ security) | Employer and profession texts: "Techwave", "Team Lead" (positive, story); empty (negative member); "O'Brien & Sons" (special characters); a non-Latin text sample; a 500-character run of "a" (long probe, generated); max and max+1 after Q-L-09. Security members: script tag string `<script>alert(1)</script>`; SQL metacharacter string; path traversal `../../`; zero-width-character string. | TC-L-33 (P3) | Q-L-09 `[TBC]`. Security members have no TC except TC-L-33 (DI-07). |
| TD-L-17 | Positive | Story, verbatim: Salary/Wages = 12000 | TC-L-35, 39, 40, 59, 61, 65, 66 | Q-L-21 (period, format) `[TBC]` |
| TD-L-18 | Boundary (+ security) | Salary probes: 0, 0.01, -1, 12000.50, "12,000", "$12000", abc, empty; a very large 12-digit probe (generated). Security members: SQL metacharacter string; null-byte suffix. | TC-L-36 | Q-L-21 `[TBC]` |
| TD-L-19 | Positive (+ negative variants) | Balance Sheet, story: all four declarations = No (FCA director, employee or relative; bankruptcy in 7 years; judgments or suits pending; foreclosure, deed in lieu, or debt forgiveness in 7 years). Negative variants: each declaration = Yes in turn; each left unanswered in turn. | TC-L-37, 38, 39, 40, 59, 61, 65, 66 | Q-L-12, Q-L-22 `[TBC]` |
| TD-L-20 | Positive (+ negative combinations) | Agreements: A1 Financial Report and Bylaw Disclosure; A2 Patronage and Investment Information; A3 right to receive an Appraisal Report; A4 authorization to run a credit check. Positive: all four checked (DT-L-02 R16). Negative: the other 15 combinations (DT-L-02 R1..R15). Only R16 may reach the submit dialog, and only in a gated run. | TC-L-41, 42, 43, 44, 45, 47, 56, 60, 61, 66 | Q-L-19 (mandatory) `[TBC]` |
| TD-L-21 | Security-abuse | Signed-out routes: `/apply-for-a-loan` and `/loan-application-creation/loan-information`. Variants: query string `?ref=test`; trailing slash; uppercase path `/APPLY-FOR-A-LOAN`; stale session cookie (cleared, or a garbage value). Expected: public page, no form, no open redirect, no loop. | TC-L-01, 02, 03, 04, 05 | Q-L-01, Q-L-02 `[TBC]` (return destination) |
| TD-L-22 | Negative | Fault injection on the submit request via `page.route`: HTTP 500; request abort (timeout); delayed response; success after a first failure. Fault cases never reach the real endpoint. | TC-L-48 | Request URL pattern `[TBC – Q-L-26]`. The retry step is a real submit (DI-03). |
| TD-L-23 | Negative | Unregistered-account evidence: `CUSTOMER_EMAIL` and `CUSTOMER_PASSWORD` used once at `/login` while the account does not exist. Single attempt per run; never looped (lockout risk). | TC-L-06 | B-L1; Q-L-29 |
| TD-L-24 | Security-abuse | Session expiry: clear cookies and web storage in the browser context mid-application; or wait for the timeout once known. Expected: no step transition and no submit on a stale session. | TC-L-53, 54 | Method and timeout `[TBC – Q-L-28]`. Clearing cookies is a proposed method, not confirmed. |
| TD-L-25 | Boundary | Viewports: desktop 1280x720; narrow 375x667 with touch emulation and no hover. | TC-L-64 | Breakpoints and menu design `[TBC – Q-L-03]` |

### 3.2 Security members per input surface

The security rule requires coverage for each input surface. The members below are test inputs, not secrets. Expected for every member: no script runs, no dialog appears, no stack trace or 5xx is shown, and the value is accepted or rejected per the rule `[TBC]`.

| Input surface | Security member added in | Covered by a TC today |
|---|---|---|
| Acres (numeric) | TD-L-03 | No |
| Borrow amount | TD-L-06 | No |
| Estimated property value | TD-L-07 | No |
| Financing description (text) | TD-L-08 | TC-L-21 |
| DOB (typed) | TD-L-11 | No |
| Years fields (numeric) | TD-L-12 | No |
| SSN (typed) | TD-L-13, V14 | TC-L-28 |
| Employer and profession (text) | TD-L-16 | TC-L-33 (P3) |
| Salary / Wages (numeric) | TD-L-18 | No |
| Signed-out routes | TD-L-21 | TC-L-01..05 |
| Session and submit request | TD-L-22, TD-L-24 | TC-L-48, 53, 54 |
| County, Yes/No, checkbox controls | Not in any dataset; request-body tampering would need a TC | No (gap) |

---

## 4. Boundary register (every limit is TBC, none invented)

| Field | Probes (TD) | Unknown | Q-L |
|---|---|---|---|
| Acres | TD-L-03 | min, max, decimals, whether 0 and negatives are rejected; whether 5 is a programme threshold | Q-L-05, Q-L-06 |
| Estimated property value | TD-L-07 | min, max, decimals, format | Q-L-07, Q-L-08 |
| Borrow amount | TD-L-06 | borrow vs value (at most, or below), min, max, format | Q-L-07, Q-L-08 |
| Financing description | TD-L-08 | max length, counter, allowed characters | Q-L-09 |
| Employer and profession | TD-L-16 | max length | Q-L-09 |
| Date of birth | TD-L-11 | min and max age, date format, picker behaviour | Q-L-14 |
| Years fields | TD-L-12 | min, max, decimals, future-year rule | Q-L-15 |
| SSN | TD-L-13 | format, area, group and serial rules, uniqueness | Q-L-16, Q-L-17 |
| Salary / Wages | TD-L-18 | period (monthly or annual), min, max, format | Q-L-21 |
| Mandatory fields on each step | TD-L-02, 05, 10, 17, 19, 20 | mandatory set, message text and position | Q-L-12, Q-L-13 |
| County list and branch | TD-L-09 | list options, branch per county | Q-L-10 |
| Agreements | TD-L-20 | which boxes are mandatory | Q-L-19 |
| Session timeout | TD-L-24 | timeout length and expiry behaviour | Q-L-28 |
| Viewports and menu | TD-L-25 | breakpoints, menu alternative | Q-L-03 |

---

## 5. Story data inconsistency (Q-L-18)

### 5.1 Brief values kept as they are

TD-L-10 and TD-L-14 keep the brief's values. TC-L-25, TC-L-30 and TC-L-66 use them. The app's decision on them is recorded as an observation, not a pass or fail.

| Item | Story value | Observation |
|---|---|---|
| Date of birth | 09/09/2001 | Age on 2026-11-10 is 25 (the 2026 birthday has passed). The AC says "about 24" (DI-01). Day equals month, so this value cannot prove the date format. |
| Year began farming | 2000 | One year before the birth year 2001. A consistency question, not a settled rule. |
| Years with employer | 11 | Employment since about 2015, when the applicant was about 14. Whether that is valid is unknown. |
| Years in profession | 4 | Less than years with employer (11). Whether profession years must be at least employer years is unknown. |
| Marital status | MARRIED | Co-Applicant Details is empty in the story. Whether a spouse must be a co-applicant is unknown (Q-L-20). |

### 5.2 Proposed consistent alternative (PROPOSAL ONLY)

Status: PROPOSAL, pending a product answer to Q-L-18. Not used by any TC. TC-L-25 and TC-L-66 keep the brief's values.

| Field | Story | Proposal | Reason |
|---|---|---|---|
| Date of birth | 09/09/2001 | 09/09/1981 (shifted by minus 20 years; day and month kept) | Age 45 on 2026-11-10. Birth precedes all other dates. |
| Year began farming | 2000 | 2003 | After the birth year. Farming starts at age 22. |
| Years with employer | 11 | 11 (unchanged) | Employment since 2015, at age 34. |
| Years in profession | 4 | 11 | Not shorter than years with employer. Assumption; product to confirm. |
| All other fields | story | story | No change. |

- Held under contract key `loanProposalApplicantAlt`, not as a TD-L ID, so TD-L-01..25 stay unchanged. If product confirms it, the next revision gives it a new TD ID.
- The proposal sets no age or year limit. Acceptance still depends on Q-L-14, Q-L-15 and Q-L-18.

### 5.3 Scenario text integrity

The TD-L-05 description embeds the value 160599 and the claim "dwelling No and acres more than or equal to 5". The verbatim text is valid only with the story's Loan Information (acres 5.11, dwelling No) and value (160599). In boundary runs the text must not be reused with different acres or value. Use generated text or no text claim there.

---

## 6. Referential integrity

| # | Relation | Rule | Status |
|---|---|---|---|
| 1 | Session to customer account | The session belongs to the account behind `CUSTOMER_EMAIL`. The account must be registered and MFA-ready. | B-L1, Q-L-29 |
| 2 | Application to customer account | Every application is owned by the test account. Ownership is the cleanup scope. | Q-L-24, Q-L-25 |
| 3 | Property county (Barbour) to Branch Office | Barbour maps to one branch. The spec reads the mapping; no branch name is hard-coded. | `[TBC – Q-L-10]`; branch name unknown |
| 4 | Residence/HQ county to Branch Office | Same mapping. Equal counties give equal branches. | `[TBC – Q-L-10]` |
| 5 | Verify Branch Office to mapping | The displayed branch equals the mapping result. | `[TBC – Q-L-10]` |
| 6 | Description text to acres, dwelling, value | Story text matches Loan Information and value (section 5.3). | Rule of this document |
| 7 | Application to step records | One Loan Information, Collateral, Applicant, Co-Applicant, Income, Balance Sheet and Agreements record per application. The application is the parent. | Q-L-24 (keys) |
| 8 | Applicant to SSN | One SSN per applicant per run. Uniqueness across records if product enforces it. | Q-L-16 |
| 9 | Agreements to SUBMIT | Submit is allowed only in the state the rule allows (all four, per the story). | Q-L-19 |
| 10 | Dates | DOB precedes Year began farming and the employment start. Story violates the first. On submitted records: created, then updated, then closed. | Q-L-18; record timestamps `[TBC – Q-L-23]` |
| 11 | Marital status to co-applicant | Compatibility unknown. | Q-L-20 |
| 12 | "Active loan with Alabama Ag Credit" = Yes to account state | If verified, the account must hold an active loan. If self-declared, no link. | `[TBC]`; new question (DI-06) |
| 13 | TC to TD-L and PC-L | Every TD-L-01..25 is named by at least one TC. Every PC-L-1..12 is referenced. No TC cites TD-L-26 or higher. | Pass (checked against the TC file) |
| 14 | Unique keys | TD-L IDs, PC-L IDs and TC IDs are unique. One `LOAN_TEST_SSN` reference per run. | Pass |

---

## 7. Setup and teardown order

### 7.1 Setup (parents first)

| Step | Action |
|---|---|
| S0 | Configuration presence check, names only (fail fast, section 1.4). |
| S1 | Generate `loanRunId`; open the run log. |
| S2 | Verify the county-to-branch mapping (TD-L-05 and TD-L-09 depend on it). `[TBC – Q-L-10]` |
| S3 | Registered, MFA-ready test account (B-L1, Q-L-29). Parent of all customer data. |
| S4 | SMS inbox reachable at `SMS_INBOX_URL` with no Cloudflare challenge. Stop and report on a challenge; do not bypass (test plan section 8). |
| S5 | Resolve contract keys from the data source (TD-L-01..25). |
| S6 | Per TC: PC-L-2 sign-in, one session at a time. |
| S7 | Per TC: PC-L-3 to PC-L-12 replayed from TD-L-02 to TD-L-20. |
| S8 | Gated runs only: opt-in switch set; one submission; created record IDs logged before the run ends. |

### 7.2 Teardown (children first)

Applies to submitted applications (gated runs) and to drafts.

| Step | Action |
|---|---|
| T1 | Write the final run-log entries. Collect created record IDs from the run log, not from memory. |
| T2 | Remove child records in dependency order: notification records; agreement acceptance records; balance sheet declarations; income record; co-applicant record (none expected from the story); applicant and SSN-linked record; loan information and collateral records. Exact keys and order `[TBC – Q-L-24]`. |
| T3 | Remove the application (parent). Mechanism `[TBC – Q-L-25]`. If the application cannot be deleted, record the decision and hand the IDs to the cleanup job. |
| T4 | Abandon and delete unsubmitted drafts created by the run. Only applies if drafts persist `[TBC – Q-L-27]`. |
| T5 | Close browser contexts and sessions. Per test, handled by Playwright. |

Keep after teardown, for retest: the test account; the SMS route; the `LOAN_TEST_SSN` source; the county-to-branch mapping; the data-source entries and TD-L definitions.

Non-gated runs: T4 and T5 only.

---

## 8. Lineage, run ID, record logging, cleanup owner

- **Run ID:** format `[TBC]`. Proposed shape `LOAN-RUN-<yyyymmdd>-<hhmm>-<nn>` (UTC). Generated once per run and held as `loanRunId`.
- **Run log:** one JSON line per TC with `runId`, `tcId`, `tdIds`, `pcBlock`, `env`, the Dev build identifier, `startedUtc`, `endedUtc`, `outcome`, and `createdRecordIds` (gated runs only), plus a short note. Never write SSN values, SSN variants, secrets, or story values such as DOB. Log TD-L IDs instead. Redact any message that echoes input.
- **Application marker:** the test plan (5.2) proposes a run ID inside the financing description. Not adopted here. It changes the story text, which TC-L-18 expects verbatim, and the field's maximum length is unknown (Q-L-09). The fallback is account ownership plus the run-log timestamp. Decision open, Q-L-24 (DI-05).
- **Cleanup owner:** `[TBC – Q-L-25]`. Test plan section 15 names the Dev contact for cleanup and the Dev lead as sign-off owner. No gated run starts until a named owner and a schedule exist.
- **Cleanup cadence:** `[TBC – Q-L-25]`.
- **Opt-in switch:** name `[TBC – Q-L-24]`. Not invented here, matching the test plan (5.3).
- **Reuse of the test account for repeated submits:** `[TBC – Q-L-25]`.

---

## 9. Environment tags

| Tag | Meaning | Applies to |
|---|---|---|
| `env-dev` | The Dev environment, the only one in the test plan | All loan TCs |
| `env-qa`, `env-staging`, `env-uat` | Not in scope of the test plan | None `[TBC]` |
| `data-read` | Reads only; creates no record | All TCs except the writes-record set |
| `writes-record` | Creates a real Dev record | TC-L-43, 47, 49, 66; TC-L-48 if its retry reaches the real endpoint (DI-03) |
| `opt-in` | Skipped unless `loanSubmitOptIn` is set | The writes-record set |
| `serial` | Workers 1, retries 0, no repeat-each | The writes-record set and the blocked suite (one session) |
| `synthetic-ssn` | Resolves `LOAN_TEST_SSN` | TC-L-25, 28, 29, 40, 57, 66 |
| `proposal-data` | Uses section 5.2 data only | None until product confirms |

The existing TC tags (`@customer @loan @smoke @regression @negative @a11y @e2e-full`) do not change.

---

## 10. JSON fixture sketch (placeholders only, no values)

The sketch shows the shape of the data contract. Each placeholder is resolved from the data source or the secret store at run time. Nothing here is a payload.

```json
{
  "_note": "Placeholder sketch. Resolved at run time. No value is stored in this file.",
  "runId": "<loanRunId>",
  "environment": "env-dev",
  "seed": 4242,
  "credentials": {
    "customerEmailRef": "env:CUSTOMER_EMAIL",
    "customerPasswordRef": "env:CUSTOMER_PASSWORD",
    "smsInboxUrlRef": "env:SMS_INBOX_URL",
    "baseUrlRef": "env:CUSTOMER_BASE_URL",
    "smsSenderLabel": "<from data source: sender label>"
  },
  "loanInformation": {
    "purposeOrRefinance": "<TD-L-02.purpose>",
    "principalResidence": "<TD-L-02.principalResidence>",
    "dwellingOnProperty": "<TD-L-02.dwelling>",
    "acres": "<TD-L-02.acres>"
  },
  "collateralAndLoanAmount": {
    "financingDescription": "<TD-L-05.description>",
    "estimatedPropertyValue": "<TD-L-05.value>",
    "borrowAmount": "<TD-L-05.borrow>",
    "propertyCounty": "<TD-L-05.propertyCounty>",
    "residenceCounty": "<TD-L-05.residenceCounty>",
    "branchOffice": "<lookup: loanBranchForCounty [TBC Q-L-10]>",
    "differentBranchOrLender": "<TD-L-05.differentBranch>",
    "activeLoanWithAlabamaAgCredit": "<TD-L-05.activeLoan>"
  },
  "applicantDetails": {
    "usCitizen": "<TD-L-10.usCitizen>",
    "dateOfBirth": "<TD-L-10.dob>",
    "maritalStatus": "<TD-L-10.maritalStatus>",
    "ssn": "<secret-ref: loanTestSsnRef (LOAN_TEST_SSN)>",
    "mailingAddressDifferent": "<TD-L-10.mailingDifferent>",
    "contactPreference": "<TD-L-10.contactPreference>",
    "employerName": "<TD-L-10.employer>",
    "yearsWithEmployer": "<TD-L-10.yearsWithEmployer>",
    "profession": "<TD-L-10.profession>",
    "yearsInProfession": "<TD-L-10.yearsInProfession>",
    "yearBeganFarming": "<TD-L-10.yearBeganFarming>"
  },
  "income": {
    "salaryWages": "<TD-L-17.salaryWages>"
  },
  "balanceSheet": {
    "fcaDirectorEmployeeRelative": "<TD-L-19.answer>",
    "bankruptcyLast7Years": "<TD-L-19.answer>",
    "judgmentsOrSuitsPending": "<TD-L-19.answer>",
    "foreclosureDeedInLieuOrDebtForgiveness7Years": "<TD-L-19.answer>"
  },
  "agreements": {
    "financialReportAndBylawDisclosure": "<TD-L-20.A1>",
    "patronageAndInvestmentInformation": "<TD-L-20.A2>",
    "appraisalReportRight": "<TD-L-20.A3>",
    "creditCheckAuthorization": "<TD-L-20.A4>"
  },
  "proposalOnly_notActive": {
    "_status": "PROPOSAL pending Q-L-18; not used by any TC",
    "applicantAlt": "<loanProposalApplicantAlt>"
  }
}
```

---

## 11. Gherkin Examples (AC-L-06 and AC-L-17)

Scenario Outline for AC-L-06. Expected results are recorded, not asserted, until the limits are answered.

| acresProbe (TD-L-03) | Expected |
|---|---|
| 0 | Outcome recorded. Limit `[TBC – Q-L-05]` |
| 4.99 | Outcome recorded. Threshold `[TBC – Q-L-06]` |
| 5 | Outcome recorded. Threshold `[TBC – Q-L-06]` |
| 5.01 | Outcome recorded. Limit `[TBC – Q-L-05]` |
| 5,11 | Outcome recorded. Locale `[TBC – Q-L-08]` |
| -1 | Outcome recorded. Limit `[TBC – Q-L-05]` |
| (see TD-L-03 for the full list) | Outcome recorded |

Scenario Outline for AC-L-17. The variant is identified by ID only; the value is derived in memory and never printed.

| ssnVariant (TD-L-13) | Expected |
|---|---|
| V00 | Outcome recorded. Format `[TBC – Q-L-16]` |
| V03 | Outcome recorded. Rejected or accepted `[TBC – Q-L-16]` |
| V10 | Outcome recorded. Area rule `[TBC – Q-L-16]` (DI-08) |
| V14 | Outcome recorded. No script runs, no stack trace (security) |

---

## 12. Lifecycle and refresh

| Stage | Rule |
|---|---|
| Create | TD-L definitions are static. Contract keys resolve from the data source as an upsert keyed by TD-L ID, so re-runs create no duplicates. The test account is created once (B-L1). |
| Use | Each TC names its TD-L IDs. Post-login blocks are rebuilt from the chain (section 2). Drafts are not reused across TCs. The single account is shared by design because runs are serial, so no TC depends on its state beyond the answers it gives. |
| Date-relative values | DOB probes (TD-L-11), the future year (TD-L-12), and any "today" value are computed at run time in the app's timezone `[TBC]`. A fixed 2027 becomes stale in 2027 (DI-04). |
| Clean up | Per section 7.2. |
| Refresh | Cadence `[TBC – Q-L-25]`. Owners per test plan section 15: Dev contact for the account and data lineage; Dev lead for cleanup; Product owner for corrected story data (Q-L-18). The test plan states no refresh cadence. |
| Retain for retest | Test account; SMS route; `LOAN_TEST_SSN` source; county-to-branch mapping; TD-L definitions. |

---

## 13. Synthetic-data confirmation

| Check | Status |
|---|---|
| Story values come from the brief. No production data is copied. | Stated by the brief. Business analyst to confirm the DOB and employer values do not describe a real person. Open. |
| The account behind `CUSTOMER_EMAIL` is a synthetic test identity | Open. Account not yet created (B-L1). The address stays in the env var, never in this file. |
| Test email domains are reserved or test domains | Open. Env var content was not reviewed here. No address is written in this file. |
| `LOAN_TEST_SSN` is synthetic, from an invalid range by rule, never a literal | Designed. Pending Q-L-16 and the Security contact. |
| Phone numbers | None in the data. |
| Free text | Fixed probes or generated text. No real names. "Techwave" is the employer name from the brief; "Team Lead" is the profession from the brief. |
| Generated text seed | 4242. No generated output is stored in this file. |

---

## 14. Issues found in the source docs and plans

| ID | Issue | Action |
|---|---|---|
| DI-01 | AC I-L-5 and EDGE-L-13 say the applicant is "about 24" on 2026-11-10 for DOB 2001-09-09. Arithmetic gives 25. | Correct the AC. |
| DI-02 | AC EDGE-L-15 says "Years in profession (4) greater than Years with employer". With story values 4 is less than 11, so the clause is false for the story. The comparison is probably reversed. | Correct the AC and confirm with product (Q-L-18). |
| DI-03 | TC-L-48 step 3 retries the submit after the fault is lifted. That is a real submit, but TC-L-48 is not in the gated list (TC-L-43, 47, 49, 66) and TC-L-56 does not check it. The test plan (5.3) proposes either a mock retry or a gated run. | Decide. Add TC-L-48 to the writes-record set, or change the retry to a mock. |
| DI-04 | TD-L-12 uses a fixed "2027" as the future year. TD-L-11 DOB probes must also be computed from the run date. | Compute both at run time (done in this file). |
| DI-05 | The test plan proposes a run ID in the financing description. It conflicts with the verbatim story text (TC-L-18) and the unknown field length. | Not adopted. Decide under Q-L-24. |
| DI-06 | "Active loan with Alabama Ag Credit = Yes" may need checking against account state. No question covers it. | Add a Q-L entry. Number to be assigned by the AC owner. |
| DI-07 | Security coverage gap. Only TD-L-08 and the signed-out and session sets have security members in the TC file. Numeric, DOB, SSN, employer and salary inputs have no security TC. TC-L-33 (P3) is the only text-input TC. | Members added in section 3.2. Add security TCs for numeric and SSN inputs. Consider raising TC-L-33 to P2. |
| DI-08 | The SSN synthetic rule (invalid area range) may conflict with the happy path if product validates the area number. | Decide under Q-L-16 before any gated run. |
| DI-09 | The test plan (section 5) proposes a TD file under `test-data/` with story values. The data contract says no checked-in payload files. | Recommended: keep story values in the data source only. Otherwise accept a committed non-secret file as a documented exception. Decide. |
| DI-10 | The test plan (section 4) says a missing env key skips dependent TCs. The data contract says fail fast, naming the variable. | Recommended: fail fast at suite start for the keys of the selected set, and skip with a reason only for the opt-in gate. Decide. |
| DI-11 | The TC file writes very large numeric probes as long digit runs (TD-L-03, 07, 18). A scan for 9-digit runs (TC-L-57) would match them unless the pattern is anchored. | Probes now described as generated at run time (done in this file). Anchor the TC-L-57 scan. |
| DI-12 | TC-L-40 checks the SSN display, but its Test data column does not name TD-L-13. | Add TD-L-13 to TC-L-40 (minor). |
| DI-13 | EDGE-L-12 says 09/09/2001 is "ambiguous-proof". It is ambiguous (day equals month) and cannot prove the format. | Reword the AC. |
| DI-14 | MARRIED applicant with an empty Co-Applicant step. | Add to Q-L-20. |
| DI-15 | TD-L-09 (second county pair), TD-L-15 (option lists), TD-L-22 (URL pattern), and TD-L-24 (timeout) are defined but have required values not yet known. | Left as `[TBC]` with Q-L links. Not undefined. |

---

## 15. Open data items and owners

| Item | Q-L | Owner (per test plan section 15) |
|---|---|---|
| `LOAN_TEST_SSN` source, name, and validity rule | Q-L-16, Q-L-17 | Security contact; Test lead |
| Customer account and SMS route | Q-L-29 | Product owner; Dev; DevOps |
| Cleanup owner, cadence, mechanism | Q-L-25 | Dev lead |
| Records created and delete keys; opt-in switch name | Q-L-24 | Dev contact; Test lead |
| County-to-branch mapping | Q-L-10 | Product owner |
| Corrected or confirmed story data | Q-L-18 | Product owner |
| Limits (acres, amounts, text, DOB, years, salary) | Q-L-05 to Q-L-09, Q-L-14, Q-L-15, Q-L-21 | Product owner |
| Submit idempotency and retry | Q-L-26 | Dev |
| Session timeout | Q-L-28 | Dev |
| Drafts and Back behaviour | Q-L-27 | Product owner |
| Agreements mandatory | Q-L-19 | Product owner |
| Active loan verification against account state | New (DI-06) | AC owner to number |
