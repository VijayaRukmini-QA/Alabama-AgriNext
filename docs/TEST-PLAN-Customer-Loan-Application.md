# Test Plan: Customer Loan Application - Land & Home (Customer app)

Runner: Playwright Test (TypeScript, Page Object Model), Playwright UI mode, Chrome channel | App: `CUSTOMER_BASE_URL` (Dev) | Date: 2026-11-10
Companions: `docs/ACCEPTANCE-CRITERIA-Customer-Loan-Application.md` (REQ-L-01..16, BR-L-01..08, AC-L-01..42, EDGE-L-01..36, Q-L-01..29, B-L1..B-L3, gap G-L-1), `docs/TEST-CASES-Customer-Loan-Application.md` (TC-L-01..66, TS-L-01..11, DT-L-01..03, TD-L-01..25, PC-L-1..12, EXP-L-01..10). House style: `docs/TEST-PLAN-Customer-Signin.md`, `docs/TEST-EXECUTION-SUMMARY-Customer-Signin.md`. Sign-in is the precondition of this story (TC-S-60 / REQ-L-01).

Legend: **[TBC]** = unknown, owned by a Q-L item in the AC doc. Every label, control type, rule, limit and message behind the sign-in is unobserved and is written `[TBC – exploration blocked by B-L1]`. No limit or business rule is invented in this plan. Values such as 4.99, 5, 5.01 are probes, not claims. No secret value appears here. Secrets are referenced by env var name only: `CUSTOMER_EMAIL`, `CUSTOMER_PASSWORD`, `CUSTOMER_BASE_URL`, `SMS_INBOX_URL`. SSN is only the test-data reference `LOAN_TEST_SSN`.

Status today (2026-11-10): real sign-in with `CUSTOMER_EMAIL` returns 400 `user_not_found` (AADSTS50034). There is no registered customer account (B-L1). Steps 1 to 45 cannot be executed or explored live. 58 of 66 TCs are blocked. 7 TCs run now with no account. 1 is manual.

---

## 1. Objectives
- Prove now, with no account, that the two loan routes (`/apply-for-a-loan`, `/loan-application-creation/loan-information`) show the public page with "SIGN IN" and "CREATE PROFILE" at the same URL, with no redirect and no loan form (REQ-L-12, BR-L-06); that their entry controls are named and keyboard reachable; and that no literal SSN exists in specs, data, logs or reports (7 automatable-now TCs).
- Be ready to run the 58 blocked TCs the moment B-L1 is resolved: the 45-step happy path (TC-L-66), per-step functional, boundary, mandatory-field, negative, navigation, session and accessibility cases, with oracles that stay "record the observed outcome" until the Q-L questions are answered.
- Create at most one real Dev application per run, only when opted in, serially, with the record logged for cleanup (B-L3, BR-L-08).
- Never write a secret or an SSN literal into any file, log, trace, screenshot or report (BR-L-07).
- Record, not judge, the story-data inconsistency (DOB 09/09/2001 vs Year began farming 2000; Years with employer 11) as an observation for Q-L-18 (TC-L-30).
- Leave the sign-in, Lender and Create Customer Profile suites untouched.

## 2. Scope

| In scope | Out of scope | Reason for out |
|---|---|---|
| Signed-out access to the two loan routes (REQ-L-12) | Rules of the identity provider and SMS delivery | Owned by the Sign-in plan (TC-S-xx) |
| Precondition sign-in and menu path to Start Application (REQ-L-01, 02) | Sign-in MFA edge cases (wrong, expired codes, lockout) | Covered by TC-S-42..56 |
| Steps 1-45: Loan Information, Collateral & Loan Amount, Applicant Details, Co-Applicant, Income, Balance Sheet, Application Summary, Additional Terms & Agreements, submit, confirmation (REQ-L-03..11) | Creating an account | Create Customer Profile plan; blocked by Cloudflare (B-L1) |
| Functional, negative, boundary (acres, value vs borrow, DOB, years, SSN shape, text length), mandatory fields, validation, navigation (Back, Continue, refresh, draft, tabs), session expiry | Lender-side processing, underwriting, notification delivery, back-office views of the submitted application | Not in the story |
| Data impact and SSN handling (REQ-L-13) | Performance, load, penetration testing | Not requested |
| UI and accessibility, post-login keyboard, focus, axe (REQ-L-14; AC gap G-L-1) | Full WCAG audit, visual design sign-off | No design reference |
| Exploratory charters EXP-L-01..10 | Firefox, WebKit, production | Chrome channel on Dev only |

Test types: functional, negative, boundary, validation, mandatory, navigation, a11y, UI, e2e, exploratory. Each is listed with its reason in the TC file (Type column).

## 3. Test items and features

Test items: the Customer portal loan application flow on Dev, step headings and routes as listed in BR-L-02.

| ID | Feature | REQ | TS | TCs |
|---|---|---|---|---|
| F-01 | Signed-out route access | REQ-L-12 | TS-L-01 | 01..06 |
| F-02 | Precondition sign-in, menu, Start Application | REQ-L-01, 02 | TS-L-02 | 07..10 |
| F-03 | Loan Information | REQ-L-03 | TS-L-03 | 11..17 |
| F-04 | Collateral & Loan Amount | REQ-L-04 | TS-L-04 | 18..24 |
| F-05 | Applicant Details | REQ-L-05 | TS-L-05 | 25..33 |
| F-06 | Co-Applicant, Income, Balance Sheet, Application Summary | REQ-L-06..09 | TS-L-06 | 34..40 |
| F-07 | Agreements, submission, confirmation | REQ-L-10, 11 | TS-L-07 | 41..49 |
| F-08 | Navigation, draft resume, session, concurrency | REQ-L-15, 16 | TS-L-08 | 50..55 |
| F-09 | Data impact, SSN handling | REQ-L-13 | TS-L-09 | 56, 57 |
| F-10 | Accessibility (post-login) and UI | REQ-L-14 | TS-L-10 | 58..65 |
| F-11 | End-to-end happy path, steps 1-45 | REQ-L-01..11, 13 | TS-L-11 | 66 |

### 3.1 Traceability summary

| REQ | BR | AC | EDGE | TCs (primary) |
|---|---|---|---|---|
| REQ-L-01 | BR-L-01 | AC-L-01, 02 | Signin EDGE-01..28 | 06, 07, 66 |
| REQ-L-02 | BR-L-02 | AC-L-03, 04 | EDGE-L-34 | 08, 09, 10, 64, 65 |
| REQ-L-03 | BR-L-02, 03 | AC-L-05..08 | EDGE-L-01..03, 20 | 11..17 |
| REQ-L-04 | BR-L-03 | AC-L-09..13 | EDGE-L-04..10, 20, 35 | 18..24 |
| REQ-L-05 | BR-L-03, 07 | AC-L-14..20 | EDGE-L-11..20 | 25..33 |
| REQ-L-06 | BR-L-03 | AC-L-21 | EDGE-L-22 | 34 |
| REQ-L-07 | BR-L-03 | AC-L-22, 23 | EDGE-L-21 | 35, 36 |
| REQ-L-08 | BR-L-03 | AC-L-24, 25 | EDGE-L-23 | 37, 38 |
| REQ-L-09 | BR-L-03 | AC-L-26, 27 | EDGE-L-18 | 29, 39, 40 |
| REQ-L-10 | BR-L-05 | AC-L-28, 29 | none | 41, 42 |
| REQ-L-11 | BR-L-04, 05, 08 | AC-L-30..34 | EDGE-L-29..31, 33 | 43..49 |
| REQ-L-12 | BR-L-01, 06 | AC-L-39..42 | EDGE-L-25, 36 | 01..05 |
| REQ-L-13 | BR-L-07, 08 | AC-L-38 | EDGE-L-33 | 56, 57 |
| REQ-L-14 | n/a | AC-L-42 (signed-out); post-login a11y AC is gap G-L-1 | EDGE-L-34 | 04, 10, 58..64 |
| REQ-L-15 | BR-L-02 | AC-L-35, 36 | EDGE-L-24..28 | 16, 50..52, 55 |
| REQ-L-16 | BR-L-01 | AC-L-37 | EDGE-L-32 | 53, 54 |

All 16 REQ have at least one TC. 12 REQ (REQ-L-02..11, 15, 16) have all their TCs blocked. REQ-L-12 is fully executable now; REQ-L-13 (TC-L-57), REQ-L-14 (TC-L-04) and REQ-L-01 (TC-L-06, evidence of B-L1, not a functional pass) are only partly executable now. Gap G-L-1: no post-login accessibility AC exists; TC-L-58..63 trace to AC-L-42 as a signed-out analogue only. Cross-references to sign-in work (not re-raised): Q-12, S-F-01 / B-S1, B-S2 / F-02, AC-02..05.

## 4. Environment

| Item | Value |
|---|---|
| Environment | Dev |
| App | `CUSTOMER_BASE_URL` (all paths relative: `/apply-for-a-loan`, `/loan-application-creation/loan-information`, `/login`, `/create-profile`) |
| Build | Dev build current at run time; build identifier recorded in each execution record |
| Third party | `SMS_INBOX_URL` (shared public inbox, sender "Alabama Ag Credit", Cloudflare in front, intermittent): used only by the sign-in precondition of the blocked suite (TC-L-07 and the fixture that builds PC-L-2) |
| Identity provider | Real, for the blocked suite. TC-L-06 makes one real attempt with the unregistered account (evidence of B-L1) |
| Runner | Playwright Test in **UI mode**: `npx playwright test --ui` |
| Browser | Chrome channel: `channel: 'chrome'` in the Playwright project `use` block. The sign-in plan lists Chromium as primary; switching the customer projects to the Chrome channel is a config change to confirm when specs are written (not verified here) |
| Projects | Reuse the existing customer projects as in the sign-in plan (`customer-chromium` with `grepInvert /@e2e-full|@mobile/`, `customer-e2e` with `grep /@e2e-full/` and retries 0). No new project is planned. To be confirmed against `playwright.config.ts` at build time |
| Concurrency | Data-creating TCs (43, 47, 49, 66) run serial, workers 1, retries 0, no `--repeat-each`. The rest of the blocked suite is also serial per session (one signed-in session at a time, PC-L-2) because the SMS inbox is shared. Automatable-now TCs have no state and may run in parallel |
| Viewports | 1280x720 default; 375x667 touch for TC-L-64 (TD-L-25) |
| Env keys (presence only, never values) | `CUSTOMER_BASE_URL` for TC-L-01..05, 57; `CUSTOMER_EMAIL`, `CUSTOMER_PASSWORD` for TC-L-06 and the blocked suite; `SMS_INBOX_URL` for the blocked suite. `LOAN_TEST_SSN` (TD reference) for TC-L-25, 28, 29, 66. A missing key skips the dependent TCs with a reason, it does not fail them |

Note on UI mode: `--ui` is an interactive run, suitable for authoring, observation and the opt-in gated runs. Unattended CI execution (headless) is not part of this request and is not planned here.

## 5. Test data and lineage

Synthetic data only. No production data, no real person's data. Datasets are the TD-L-01..25 of the TC file.

| Need | Lineage class | How | TCs | Cleanup |
|---|---|---|---|---|
| Registered customer account | ENV-SECRET (blocked, B-L1) | `CUSTOMER_EMAIL`, `CUSTOMER_PASSWORD` (TD-L-01); account must exist and be MFA-ready (Q-L-29) | 07..66 (blocked set), 06 (evidence only) | None for reading; created applications see below |
| SMS code | THIRD-PARTY-LIVE | Newest "Alabama Ag Credit" message after request time from `SMS_INBOX_URL`; stop and report BLOCKED on a Cloudflare challenge, never bypass (Signin BR-12) | Blocked suite precondition | Message left in public inbox |
| SSN | ENV-REFERENCE | TD key `LOAN_TEST_SSN`, resolved at run time (contract below) | 25, 28, 29, 40, 57, 66 | None |
| Story values (TD-L-02, 05, 10, 17, 19, 20) | SYNTHETIC-LITERAL (non-secret, non-SSN) | As in the brief; kept in a TD file under `test-data/` when specs are written | 11, 18, 25, 34..43, 65, 66 | None |
| Probe sets (TD-L-03, 04, 06..09, 11, 12, 14..16, 18, 25) | SYNTHETIC-LITERAL | Probes from the AC. Not claims about rules | 12..15, 19..24, 26, 27, 30..33, 36, 38, 64 | None |
| SSN shape variants (TD-L-13) | DERIVED-AT-RUN-TIME | Computed from `LOAN_TEST_SSN` in memory; never stored, never logged | 28 | None |
| Signed-out routes and variants (TD-L-21) | SYNTHETIC-LITERAL | Paths only | 01..05 | None |
| Fault injection (TD-L-22) | SYNTHETIC-NETWORK | `page.route` on the submit request; request URL [TBC Q-L-26]; faults must not reach the real submit endpoint | 48, 54 | Per-test route, discarded |
| Session expiry (TD-L-24) | SYNTHETIC-STATE | Clear cookies/storage; timeout [TBC Q-L-28] | 53, 54 | Per-test context |
| Submitted application in Dev | DEV-RECORD-CREATED | See lineage and run policy below | 43, 47, 49, 66 (and 46 on the same submission) | Owner open (Q-L-25) |

### 5.1 LOAN_TEST_SSN contract
- The value is synthetic, supplied outside the repo and resolved at run time by the TD reference `LOAN_TEST_SSN`. Its source (env, secret store or TD loader) is to be agreed with the team that owns Q-L-16 / Q-L-17. The name `LOAN_TEST_SSN` is the only SSN-related string that may appear in a spec, TD file, doc, log, trace or report.
- No 9-digit or ddd-dd-dddd literal anywhere in the repository (TC-L-57 scans for it; any match is a Critical finding).
- Typed values never appear in output: no `console.log` of the field, `video: 'off'` and no trace for TCs that type the SSN, or the SSN field is masked in screenshots. Network payload checks (TC-L-29) compare presence and masking without printing.
- Shape variants for TC-L-28 are derived in memory from the reference value and discarded.
- Whether the synthetic value passes the app's SSN validation or uniqueness check is open (Q-L-16).

### 5.2 Record lineage of each submitted application
Every submit (TC-L-43, 47, 49, 66) creates real records in Dev. Which records and in which systems is open (Q-L-24). For each submitted application the run log records:
- Run ID, tester, build, timestamp, and the TC that submitted.
- Identifier shown on the confirmation, if any (Q-L-23), plus the customer account used (by env var name).
- A **run ID tag in the financing description text field** ("Help us understand what you are planning to finance") so the record can be found for cleanup, if the field allows it. This changes the story's fixed text and the field's maximum length is unknown, so it is **TBC** (Q-L-09, Q-L-24). If not allowed, the lineage falls back to account plus timestamp. Run ID format: to be agreed.
- Lineage is written to the run log and to the execution record, never the SSN and never the password.

Cleanup owner: **open** (Q-L-25). No gated run is executed until a named owner and a schedule exist. Whether the same customer account can be reused for repeated submits is also open (Q-L-25).

### 5.3 Run policy for data-creating TCs (B-L3, BR-L-08)
- Data-creating TCs: **TC-L-43, TC-L-47, TC-L-49, TC-L-66**. TC-L-46 reads the screen after a submit and rides on the single submission of its run.
- Opt-in: they are skipped unless an explicit opt-in switch is set. The name of the switch is **to be agreed** (the TC file attaches it to Q-L-24); no name is invented here. TC-L-56 verifies the gate.
- Serial, workers 1, retries 0, never `--repeat-each`, never in a loop, never retried automatically.
- At most one submission per run. The four TCs run in four separate opted-in runs.
- The record identifier and run ID are logged before the run ends.
- Not run in CI by default.
- TC-L-48 and TC-L-54 intercept the submit request. One step of TC-L-48 (retry once the fault is lifted) would create a real record if the retry reaches the real endpoint. Proposal, to be confirmed with Q-L-26: fulfil the retry by a mock as well, or count that run as the gated run.

## 6. Entry criteria

### 6.1 Automatable-now set (TC-L-01..06, 57)
- `CUSTOMER_BASE_URL` reachable; `/apply-for-a-loan` returns 200.
- Dev build identifier recorded.
- Chrome is installed and Playwright runs in UI mode with `channel: 'chrome'`.
- TC-L-06 additionally: `CUSTOMER_EMAIL` and `CUSTOMER_PASSWORD` present; exactly one attempt per run.
- TC-L-57 additionally: repository checked out.

### 6.2 Blocked suite (TC-L-07..55, 58..66): B-L1 resolved
All of these hold, each evidenced in the execution record:
1. A registered account exists behind `CUSTOMER_EMAIL`: a sign-in attempt returns the code step, not 400 `user_not_found` (Q-L-29).
2. SMS is reachable: `SMS_INBOX_URL` loads with no Cloudflare challenge and the newest "Alabama Ag Credit" message after the request time can be read.
3. TC-L-07 passes once and lands on `/apply-for-a-loan`.
4. The automatable-now set has run and TC-L-01 and TC-L-02 (smoke) pass on the build.
5. Exploration charters EXP-L-01..10 are executed first and their observations are written back to the Q-L items they cover (Q-L-03 to Q-L-23, 27, 28), so the "record the outcome" oracles can be tightened. This is a target, not a blocker for starting TC-L-08.

### 6.3 Gated set (TC-L-43, 47, 49, 66)
In addition to 6.2: the opt-in switch is named and agreed; a cleanup owner is named (Q-L-25); lineage of created records is documented (Q-L-24); the run ID tag decision is made (5.2); exactly one submission is planned for the run; `LOAN_TEST_SSN` resolves.

## 7. Exit criteria

### 7.1 Phase A: no account (achievable now)
- 7 of 7 automatable-now TCs executed (01, 02, 03, 04, 05, 06, 57); 100 percent of the P1 ones (01, 02, 57) pass.
- TC-L-57 reports 0 literal SSN matches.
- TC-L-01 and TC-L-02 pass on 3 consecutive runs.
- 59 TCs (58 blocked + 1 manual TC-L-56 not yet runnable) are listed with a blocking reason; none is reported as passed or failed.
- 0 open Critical or High defects from the executed set.
- Observations of TC-L-03 (SIGN IN and CREATE PROFILE destinations, return to loan route) written back to Q-L-02.

### 7.2 Phase B: after B-L1 (release sign-off for the loan application)
- 100 percent of REQ-L-01..16 covered by at least one executed TC.
- 100 percent of P0 TCs executed (07, 08, 11, 18, 25, 41, 43, 66) and passing, TC-L-43 and TC-L-66 each in its own gated run.
- 100 percent of P1 TCs executed; at least 95 percent passing; each failure has a defect.
- 100 percent of P2 TCs executed or deferred with a recorded reason; P3 (TC-L-33) executed or deferred with a reason.
- 0 open Critical or High defects; at most 3 open Medium defects, each with a workaround.
- Every "record the outcome" TC has its observation written back to its Q-L item, and each Q-L item is answered, or accepted as residual risk by the product owner.
- Exactly one submission in each gated run; each created record logged with its run ID and handed to the cleanup owner; 0 duplicate applications from TC-L-47, 48, 49.
- 0 literal SSN matches in specs, data, logs, traces and reports (TC-L-57 re-run after the last gated run).
- Accessibility: TC-L-58..63 executed; every serious or critical axe finding has a defect or an accepted waiver.
- Manual TC-L-56 executed with an execution record naming tester, build, timestamp and result.
- Playwright HTML report and execution summary archived.

Sign-off on REQ-L-03..11 is not claimed while their blocking Q-L items (Q-L-04 to Q-L-23) are unanswered; the plan reports that as residual risk.

## 8. Suspension and resumption criteria

| Condition | Suspend action | Resume when |
|---|---|---|
| Smoke (TC-L-01, 02) fails | Stop the regression | Smoke passes on the fixed build |
| 400 `user_not_found` for `CUSTOMER_EMAIL` | Mark the blocked suite blocked (B-L1); no retry; no loop | Account confirmed registered and MFA-ready (Q-L-29) |
| Cloudflare challenge on `SMS_INBOX_URL` | Stop sign-in dependent TCs with "BLOCKED: SMS inbox behind Cloudflare challenge"; no solve or evade attempt | An allowed SMS route exists, or a human performs the sign-in |
| A blocker stops more than 20 percent of the TCs planned for the run | Suspend and escalate. Today 58 of 66 (88 percent) of the full suite is stopped by B-L1, so the blocked suite is not planned until B-L1 is cleared | The blocker is cleared |
| More than one submission, or a duplicate record, seen in a run | Stop all gated TCs, notify the cleanup owner, no further submits | Owner confirms cleanup and Q-L-26 answered |
| Opt-in switch not set, cleanup owner not named, or lineage not logged | Skip TC-L-43, 47, 49, 66 with a reason | All three in place (6.3) |
| Account lockout or throttle message on any real account | Stop all real-account TCs, no further attempts | Owner confirms unlock |
| Dev outage or 5xx on unmocked pages (TC-L-01 unexpectedly gives an error page) | Stop unmocked TCs | Two consecutive TC-L-01 runs pass |
| A literal SSN found anywhere (TC-L-57) | Stop the run; treat as Critical; purge artefacts | Artefacts purged and TC-L-57 passes |
| Required env key missing | Skip that set with a reason | Key present |

## 9. Risks and mitigations

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| R-L-01 | B-L1: no registered account; 58 of 66 TCs cannot run | High | High | Run the 7 automatable-now TCs; keep blocked TCs skeletal and tagged; ask for a seeded account or an allowed SMS route (Q-L-29) | Product owner / Dev / DevOps |
| R-L-02 | All labels, controls, rules and messages unobserved; TCs and locators wrong when first run | High | High | Exploration charters first (6.2 item 5); role and label locators first; page objects written after observation; oracles are "record the outcome" until a Q-L is answered | QA |
| R-L-03 | Submitting creates real Dev records; duplicates; no cleanup | Medium | High | Opt-in, serial, one per run, retries 0, lineage log, run ID tag, named cleanup owner before any gated run (Q-L-24, Q-L-25) | Dev / Test lead |
| R-L-04 | SSN literal leaks into a spec, log, trace or screenshot | Low | High | `LOAN_TEST_SSN` reference only; derived variants in memory; no trace or video on SSN TCs; TC-L-57 scan before and after every gated run | QA |
| R-L-05 | SMS inbox is shared and public, behind Cloudflare, intermittent; stale or foreign code | High | High | Newest "Alabama Ag Credit" message after request time, bounded poll; stop and report BLOCKED on a challenge; sessions serialised | QA |
| R-L-06 | Story data is internally inconsistent (DOB 2001 vs began farming 2000; employer 11 years) and may be rejected, stopping TC-L-25 and TC-L-66 | Medium | High | Treat as observation (TC-L-30); stop and record the message for Q-L-18; obtain a corrected dataset from the product owner before gated runs | Product owner |
| R-L-07 | Business rules unknown (borrow vs value, acres threshold, county-branch mapping, age, SSN, mandatory fields); weak oracles | High | Medium | Record-only expected results; no pass or fail on an invented rule; update after Q-L answers | Product owner / QA |
| R-L-08 | Hover-only menu path blocks keyboard and touch automation | Medium | Medium | TC-L-10 and TC-L-64 record the alternative; fall back to `hover()` then click for the story path (Q-L-03) | QA |
| R-L-09 | Fault-injected retry in TC-L-48 reaches the real endpoint and creates a record | Medium | High | Fulfil the retry by a mock, or count that run as gated (5.3); Q-L-26 | QA / Dev |
| R-L-10 | Session expiry or timeouts interrupt a long 45-step run | Medium | Medium | PC-L-4..12 built by a fixture replaying data; one retry-free run; session timeout recorded (Q-L-28) | QA |
| R-L-11 | Public-page behaviour at loan routes is design or defect (Q-L-01); sign-in AC-40 expectation is superseded | Medium | Low | TC-L-01..05 assert the observed fact; ownership Q-L-01 | Product owner |
| R-L-12 | Post-login accessibility has no AC (G-L-1) | High | Medium | TC-L-58..63 record findings; add ACs after exploration | QA |
| R-L-13 | Chrome channel and UI mode differ from the existing Chromium project config | Medium | Low | Confirm and change config additively; run the sign-in suite baseline after the change | QA |
| R-L-14 | Unattended execution is not defined (UI mode is interactive) | Medium | Low | Agree separately if CI is wanted; gated TCs stay manual-trigger | Test lead |

## 10. Priorities and execution order

Priority is that given in the TC file (not re-scored here): P0 blocks release, P1 high, P2 medium, P3 cosmetic or recording only.

| Priority | Count | TCs |
|---|---|---|
| P0 | 8 | 07, 08, 11, 18, 25, 41, 43, 66 |
| P1 | 32 | 01, 02, 09, 12, 14, 19, 24, 26, 28, 29, 30, 32, 34, 35, 37, 39, 40, 42, 44, 45, 46, 47, 48, 49, 53, 54, 56, 57, 58, 59, 60, 61 |
| P2 | 25 | 03, 04, 05, 06, 10, 13, 15, 16, 17, 20, 21, 22, 23, 27, 31, 36, 38, 50, 51, 52, 55, 62, 63, 64, 65 |
| P3 | 1 | 33 |

Risk areas (score = likelihood x impact, 1 to 3 each; 6 to 9 = P0, 3 to 4 = P1, 2 = P2, 1 = P3; plan convention as in the sign-in plan):

| ID | Area | L | I | Score | Priority | Reason | Main TCs |
|---|---|---|---|---|---|---|---|
| FA-01 | Happy path steps 1-45 and submit | 3 | 3 | 9 | P0 | Core outcome, real data, fully unobserved | 66, 07, 08, 11, 18, 25, 41, 43 |
| FA-02 | Data impact, duplicate submit, SSN handling | 2 | 3 | 6 | P0 | Real Dev records, sensitive data | 43, 47, 48, 49, 56, 57, 29 |
| FA-03 | Access control: signed-out routes, session expiry | 2 | 3 | 6 | P0 | Access gate; observed fact | 01, 02, 53, 54 |
| FA-04 | Validation and boundary rules | 3 | 2 | 6 | P1 in TC list | Rules TBC; risk is weak oracles | 12, 19, 24, 26, 28, 32 |
| FA-05 | Step flow and summary integrity | 2 | 2 | 4 | P1 | Data loss or reformatting | 34, 35, 37, 39, 40 |
| FA-06 | Accessibility post-login | 2 | 2 | 4 | P1 in TC list | No AC (G-L-1) | 58..63 |
| FA-07 | Navigation, draft, tabs | 2 | 2 | 4 | P2 | Entirely TBC | 50..52, 55 |
| FA-08 | Mandatory fields, alternates, text content | 2 | 1 | 2 | P2/P3 | Cosmetic or recording | 13, 21, 23, 31, 33, 36 |

Execution order:
1. **Now, no account:** TC-L-01, 02 (P1 smoke), 57 (P1), then 03, 04, 05, 06 (P2). TC-L-06 last, single attempt.
2. **After B-L1 (6.2):** EXP-L-01..10 charters; TC-L-07 (decides whether the suite proceeds); then P0 non-gated: 08, 11, 18, 25, 41.
3. P1 non-gated: 09, 12, 14, 19, 24, 26, 28, 29, 30, 32, 34, 35, 37, 39, 40, 42, 44, 45, 53, 54, 58, 59, 60, 61 (TC-L-42 and 45 stop before confirming the dialog).
4. P2 and P3 non-gated: 10, 13, 15, 16, 17, 20, 21, 22, 23, 27, 31, 36, 38, 50, 51, 52, 55, 62, 63, 64, 65, 33. TC-L-48 (P1) runs here after the retry decision (5.3).
5. TC-L-56 (manual process check) before the first gated run.
6. **Gated, last, one per run:** TC-L-43, then TC-L-66, then TC-L-47, then TC-L-49 (TC-L-46 observed on the post-submit screen of one of these runs).

## 11. Test suites

Every TC carries `@customer @loan`. Playwright `--grep` is a regular expression, so AND is written with look-aheads. Example selector: `--grep "(?=.*@customer)(?=.*@loan)(?=.*@smoke)"`. The sign-in house form `"@loan.*@smoke"` also works when the tags appear in that order in the title.

| Suite | Tag expression | TCs | Count | Runs now |
|---|---|---|---|---|
| Smoke | `@customer @loan @smoke` | 01, 02, 07, 08, 11, 18 | 6 | 2 (01, 02); 07, 08, 11, 18 blocked |
| Regression | `@customer @loan @regression` | 01..65 (all except 66) | 65 | 7 (01, 02, 03, 04, 05, 06, 57) |
| Negative | `@customer @loan @negative` | 01, 02, 05, 06, 13, 14, 16, 17, 23, 24, 28, 32, 38, 42, 45, 47, 48, 49, 53, 54 | 20 | 4 (01, 02, 05, 06) |
| A11y | `@customer @loan @a11y` | 04, 10, 58, 59, 60, 61, 62, 63 | 8 | 1 (04) |
| E2E full | `@customer @loan @e2e-full` | 66 | 1 | 0 (blocked, gated) |

TC-L-57 is regression-tagged but is a static scan, no browser.

Gated TCs inside Regression (43, 47, 49) are excluded from a plain regression run unless the opt-in is set; `@e2e-full` (TC-L-66) is never part of a default run.

Non-tag selections: automatable-now set = TC-L-01..06 and 57. Manual: TC-L-56 (no spec).

## 12. Status of every TC

Status vocabulary: **automatable-now** runs live with no account; **blocked** needs the registered account (B-L1); **manual** is a human or process step. Tags shown are those of the TC file, as is (all also carry `@customer @loan`). Totals: 7 automatable-now, 58 blocked, 1 manual = 66.

| ID | Title | Tags | Priority | Status | Blocking reason |
|---|---|---|---|---|---|
| TC-L-01 | [UC] Signed-out /apply-for-a-loan shows the public page, no redirect, no form | @customer @loan @smoke @regression @negative | P1 | automatable-now | none (no account needed) |
| TC-L-02 | [UC] Signed-out loan-information route shows the public page, no form | @customer @loan @smoke @regression @negative | P1 | automatable-now | none (no account needed) |
| TC-L-03 | [EP] SIGN IN and CREATE PROFILE on the signed-out loan route go to their destinations | @customer @loan @regression | P2 | automatable-now | none (no account needed) |
| TC-L-04 | [EP] Signed-out loan routes: SIGN IN and CREATE PROFILE are named and keyboard reachable | @customer @loan @regression @a11y | P2 | automatable-now | none (no account needed) |
| TC-L-05 | [EG] Signed-out route variants (query string, trailing slash, uppercase, stale cookie) still show the public page | @customer @loan @regression @negative | P2 | automatable-now | none (no account needed) |
| TC-L-06 | [EP] Unregistered CUSTOMER_EMAIL cannot sign in and no loan route is reachable as a customer | @customer @loan @regression @negative | P2 | automatable-now | none (no account needed); single real sign-in attempt, evidence of B-L1 |
| TC-L-07 | [UC] Verified SMS code lands the customer on /apply-for-a-loan | @customer @loan @smoke @regression | P0 | blocked (B-L1) | B-L1: no registered account |
| TC-L-08 | [UC] Menu path apply for loan, Land & Home, Start Application opens Loan Information | @customer @loan @smoke @regression | P0 | blocked (B-L1) | B-L1: no registered account |
| TC-L-09 | [UC] Loan Information page shows its four questions | @customer @loan @regression | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-10 | [EG] Land & Home menu has a keyboard alternative to hover | @customer @loan @regression @a11y | P2 | blocked (B-L1) | B-L1: no registered account |
| TC-L-11 | [UC] Loan Information story answers lead to Collateral & Loan Amount | @customer @loan @smoke @regression | P0 | blocked (B-L1) | B-L1: no registered account |
| TC-L-12 | [BVA] Acres boundary values around 5 and zero | @customer @loan @regression | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-13 | [EP] Acres invalid input (negative, text, comma decimal, empty, very large) | @customer @loan @regression @negative | P2 | blocked (B-L1) | B-L1: no registered account |
| TC-L-14 | [EP] Each Loan Information question left unanswered blocks or reports on Continue | @customer @loan @regression @negative | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-15 | [DT] Loan Information combinations of purchase/refinance, residence, dwelling and acres band | @customer @loan @regression | P2 | blocked (B-L1) | B-L1: no registered account |
| TC-L-16 | [EG] Direct URL to a later step is not usable without completing earlier steps | @customer @loan @regression @negative | P2 | blocked (B-L1) | B-L1: no registered account |
| TC-L-17 | [EG] Double click on Continue does not duplicate or skip steps | @customer @loan @regression @negative | P2 | blocked (B-L1) | B-L1: no registered account |
| TC-L-18 | [UC] Collateral & Loan Amount story data leads to Applicant Details | @customer @loan @smoke @regression | P0 | blocked (B-L1) | B-L1: no registered account |
| TC-L-19 | [BVA] Borrow amount around Estimated property value 160599 | @customer @loan @regression | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-20 | [DT] Value edited after borrow entered so borrow now exceeds value | @customer @loan @regression | P2 | blocked (B-L1) | B-L1: no registered account |
| TC-L-21 | [BVA] Financing description text length and content | @customer @loan @regression | P2 | blocked (B-L1) | B-L1: no registered account |
| TC-L-22 | [EP] Property and Residence/HQ county selection and Branch Office shown | @customer @loan @regression | P2 | blocked (B-L1) | B-L1: no registered account |
| TC-L-23 | [EG] Branch Office verify control not acted on | @customer @loan @regression @negative | P2 | blocked (B-L1) | B-L1: no registered account |
| TC-L-24 | [EP] Each Collateral & Loan Amount field left empty blocks or reports on Continue | @customer @loan @regression @negative | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-25 | [UC] Applicant Details story data is submitted with SSN from LOAN_TEST_SSN | @customer @loan @regression | P0 | blocked (B-L1) | B-L1: no registered account |
| TC-L-26 | [BVA] DOB boundaries, invalid dates and formats | @customer @loan @regression | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-27 | [BVA] Years with employer, Years in profession and Year began farming limits | @customer @loan @regression | P2 | blocked (B-L1) | B-L1: no registered account |
| TC-L-28 | [BVA] SSN shape variants derived from LOAN_TEST_SSN | @customer @loan @regression @negative | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-29 | [EP] SSN is masked on screen and in the Application Summary | @customer @loan @regression | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-30 | [DT] Story data inconsistency: DOB 2001 vs Year began farming 2000 and Years with employer 11 | @customer @loan @regression | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-31 | [PW] Applicant alternates: citizenship, marital status, mailing address, contact preference | @customer @loan @regression | P2 | blocked (B-L1) | B-L1: no registered account |
| TC-L-32 | [EP] Each Applicant Details field left empty blocks or reports on Continue | @customer @loan @regression @negative | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-33 | [BVA] Employer name and Profession text content and length | @customer @loan @regression | P3 | blocked (B-L1) | B-L1: no registered account |
| TC-L-34 | [UC] Continue on Co-Applicant Details with no data opens Income | @customer @loan @regression | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-35 | [UC] Income with Salary/Wages 12000 opens Balance Sheet | @customer @loan @regression | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-36 | [BVA] Salary/Wages boundaries and formats | @customer @loan @regression | P2 | blocked (B-L1) | B-L1: no registered account |
| TC-L-37 | [UC] Balance Sheet all four declarations No opens Application Summary | @customer @loan @regression | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-38 | [EP] Balance Sheet with a Yes answer or an unanswered declaration | @customer @loan @regression @negative | P2 | blocked (B-L1) | B-L1: no registered account |
| TC-L-39 | [UC] Application Summary lists entered values and Continue opens Additional Terms & Agreements | @customer @loan @regression | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-40 | [EP] Summary values equal the values entered, no loss or reformatting | @customer @loan @regression | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-41 | [DT] All four agreements checked makes SUBMIT APPLICATION available | @customer @loan @regression | P0 | blocked (B-L1) | B-L1: no registered account |
| TC-L-42 | [DT] Fewer than four agreements checked, per combination | @customer @loan @regression @negative | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-43 | [UC] Submit with four agreements: page then dialog SUBMIT APPLICATION shows the Skip feedback screen (gated) | @customer @loan @regression | P0 | blocked (B-L1) | B-L1: no registered account; data-creating, gated (B-L3, Q-L-25) |
| TC-L-44 | [ST] Page SUBMIT APPLICATION opens the dialog and does not submit by itself | @customer @loan @regression | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-45 | [ST] Dismissing the confirmation dialog submits nothing and keeps the data | @customer @loan @regression @negative | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-46 | [UC] Skip feedback & continue leaves the post-submit screen | @customer @loan @regression | P1 | blocked (B-L1) | B-L1: no registered account; rides on the single submission of a gated run |
| TC-L-47 | [EG] Double click on the dialog SUBMIT APPLICATION creates exactly one application (gated) | @customer @loan @regression @negative | P1 | blocked (B-L1) | B-L1: no registered account; data-creating, gated (B-L3, Q-L-25) |
| TC-L-48 | [EG] Submit fails (5xx, timeout): error shown, retry possible, no duplicate | @customer @loan @regression @negative | P1 | blocked (B-L1) | B-L1: no registered account; page.route fault injection, needs no real submit (Q-L-26) |
| TC-L-49 | [ST] Browser Back or Refresh after a successful submit does not resubmit (gated) | @customer @loan @regression @negative | P1 | blocked (B-L1) | B-L1: no registered account; data-creating, gated (B-L3, Q-L-25) |
| TC-L-50 | [ST] In-page Back and browser Back retain previously entered values | @customer @loan @regression | P2 | blocked (B-L1) | B-L1: no registered account |
| TC-L-51 | [ST] Refresh mid-step keeps or loses entered data | @customer @loan @regression | P2 | blocked (B-L1) | B-L1: no registered account |
| TC-L-52 | [ST] Partly completed application after sign out and sign in | @customer @loan @regression | P2 | blocked (B-L1) | B-L1: no registered account |
| TC-L-53 | [ST] Expired session on Continue returns to sign-in, nothing submitted | @customer @loan @regression @negative | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-54 | [ST] Expired session while the confirmation dialog is open, no submission | @customer @loan @regression @negative | P1 | blocked (B-L1) | B-L1: no registered account; page.route fault injection, needs no real submit (Q-L-26) |
| TC-L-55 | [EG] Two browser tabs editing the same application | @customer @loan @regression | P2 | blocked (B-L1) | B-L1: no registered account |
| TC-L-56 | [UC] Submit scenarios run only when opted in, serially, once, with the record logged | @customer @loan @regression | P1 | manual | process check by a human; opt-in, lineage and cleanup owner open (Q-L-24, Q-L-25) |
| TC-L-57 | [EG] No literal SSN in specs, test data, logs, traces or reports | @customer @loan @regression | P1 | automatable-now | none (no account needed); static scan, no browser |
| TC-L-58 | [UC] Loan Information and Collateral steps are operable by keyboard only | @customer @loan @regression @a11y | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-59 | [UC] Applicant Details to Balance Sheet are operable by keyboard only | @customer @loan @regression @a11y | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-60 | [ST] Agreements checkboxes and confirmation dialog: keyboard, focus trap and Escape | @customer @loan @regression @a11y | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-61 | [EP] Accessible names, labels and axe scan on every loan step | @customer @loan @regression @a11y | P1 | blocked (B-L1) | B-L1: no registered account |
| TC-L-62 | [EP] Validation errors are announced and associated with their field | @customer @loan @regression @a11y | P2 | blocked (B-L1) | B-L1: no registered account |
| TC-L-63 | [EP] Visible focus indicator and focus placement after each step change | @customer @loan @regression @a11y | P2 | blocked (B-L1) | B-L1: no registered account |
| TC-L-64 | [EG] Narrow viewport and touch (no hover) reach Start Application and complete a step | @customer @loan @regression | P2 | blocked (B-L1) | B-L1: no registered account |
| TC-L-65 | [UC] Each step shows its named heading in sequence | @customer @loan @regression | P2 | blocked (B-L1) | B-L1: no registered account |
| TC-L-66 | [UC] Full Land & Home application from menu to Skip feedback, steps 1-45 (opt-in, serial, single run) | @customer @loan @e2e-full | P0 | blocked (B-L1) | B-L1: no registered account; data-creating, gated (B-L3, Q-L-25) |

### 12.1 Automatable now, without an account (7)

| TC | Title (short) | Priority | Notes |
|---|---|---|---|
| TC-L-01 | Signed-out `/apply-for-a-loan` shows public page, no redirect, no form | P1 | smoke |
| TC-L-02 | Signed-out loan-information route shows public page, no form | P1 | smoke |
| TC-L-03 | SIGN IN and CREATE PROFILE destinations recorded | P2 | observation for Q-L-02 |
| TC-L-04 | Signed-out controls named and keyboard reachable, axe on public page | P2 | a11y |
| TC-L-05 | Route variants (query string, trailing slash, uppercase, stale cookie) | P2 | URL normalisation recorded |
| TC-L-06 | Unregistered `CUSTOMER_EMAIL` cannot sign in | P2 | one real attempt; evidence of B-L1, not a loan defect |
| TC-L-57 | No literal SSN in specs, data, logs, traces, reports | P1 | static scan, no browser |

## 13. Blockers, open questions and dependencies

### 13.1 Blockers

| ID | Item | Blocks | Clears when | Owner |
|---|---|---|---|---|
| B-L1 | `CUSTOMER_EMAIL` returns 400 `user_not_found` (AADSTS50034); no registered account; account creation blocked by Cloudflare on yopmail (email code) and receive-smss (SMS code, intermittent) | 58 TCs: every TC with status `blocked` in section 12 (07..55 except 56, 57 which are manual / automatable-now; 58..66) | A registered, MFA-ready account exists and SMS is reachable (Q-L-29) | Product owner / Dev / DevOps |
| B-L2 | Signed out, the loan routes render the public page at the same URL, no redirect (observed; supersedes sign-in AC-40 expectation) | Nothing: it makes TC-L-01..05 executable now | n/a (Q-L-01 asks product to confirm) | Product owner / Dev |
| B-L3 | Submit creates real Dev records | Gated TCs 43, 47, 49, 66 (run policy 5.3) | Opt-in, cleanup owner and lineage in place (Q-L-24, Q-L-25) | Dev / Test lead |

### 13.2 Open questions

| Group | Q-L IDs | Affects |
|---|---|---|
| Access and routes | Q-L-01 (public page by design), Q-L-02 (SIGN IN and CREATE PROFILE destinations), Q-L-29 (account and SMS route) | 01..06, all blocked TCs |
| Menu and steps | Q-L-03 (menu, keyboard or touch alternative), Q-L-04 (what Refinance, residence No, dwelling Yes change), Q-L-20 (Co-Applicant fields), Q-L-23 (confirmation, Skip feedback destination) | 08..10, 15, 34, 43..46, 49, 58, 60, 63..65 |
| Loan Information and Collateral rules | Q-L-05 (acres limits), Q-L-06 (AG Fast threshold), Q-L-07 (borrow vs value), Q-L-08 (currency format), Q-L-09 (text lengths), Q-L-10 (county to branch mapping) | 12, 13, 15, 19..24, 33 |
| Applicant rules | Q-L-11 (alternates), Q-L-14 (DOB and age), Q-L-15 (years limits), Q-L-16 (SSN validation), Q-L-17 (SSN masking, storage), Q-L-18 (story-data inconsistency), Q-L-19 (agreements mandatory; US citizen No) | 25..33, 29, 40, 41, 42 |
| Validation behaviour | Q-L-12 (mandatory fields, messages), Q-L-13 (validation timing) | 13, 14, 20, 23, 24, 32, 38, 62 |
| Income and Balance Sheet | Q-L-21 (Salary period and format), Q-L-22 (Yes handling) | 35..38 |
| Data, lineage, cleanup | Q-L-24 (records created; opt-in switch name to be agreed), Q-L-25 (cleanup owner and schedule), Q-L-26 (idempotency, retry) | 43, 47..49, 56, 66 |
| Draft, navigation, session | Q-L-27 (draft, Back, direct URL), Q-L-28 (session timeout) | 16, 50..55 |

### 13.3 Dependencies
- Sign-in suite and its SMS code selector (TC-S-38, 39, 60) for the precondition; the sign-in page objects named in `docs/TEST-PLAN-Customer-Signin.md` section 12.
- `docs/TEST-CASES-Customer-Loan-Application.md` is the single source of TC IDs, tags, status and priority; this plan does not renumber or re-prioritise.
- Not yet built (to be created additively when specs are written): loan page objects (labels [TBC]), a loan TD file with no SSN literal, a fixture that builds PC-L-4..12 from the story data, the opt-in gate, the run log with record lineage.
- Existing Lender, Create Customer Profile and sign-in suites are not edited.

## 14. Cycles and schedule
- Cycle 0 (now): automatable-now set, 7 TCs. Date: on approval of this plan.
- Cycle 1 (after B-L1 and exploration): non-gated blocked suite in priority order (section 10, steps 2 to 5). Date: [TBC, starts after Q-L-29 is resolved].
- Fix window and Cycle 2: targeted retest of fixed defects plus the P0 and P1 non-gated set. Dates: [TBC].
- Gated runs: one per run, on separate occasions, after the cleanup owner is named. Dates: [TBC].
- Sign-off: after exit criteria 7.2. Dates cannot be given while B-L1 is open; none is invented.

## 15. Resources
- QA automation engineer: Playwright TypeScript, page objects, route mocking, axe.
- QA exploratory tester: runs EXP-L-01..10 and the manual TC-L-56 once an account exists.
- Dev contact: account, Dev data lineage and cleanup (Q-L-24, Q-L-25, Q-L-26).
- Product owner: rules, corrected story data (Q-L-04..22).
- Security contact: SSN masking and storage (Q-L-16, Q-L-17).
- Team size and hours are not stated here (see section 17).
- Training needs: the opt-in gated-run procedure and the SSN reference handling (5.1).

## 16. Deliverables
- Test cases: `docs/TEST-CASES-Customer-Loan-Application.md` (66 TCs, 3 DTs, 10 charters), unchanged.
- This test plan.
- Spec files, page objects, TD file, fixtures (additive), as in section 13.3.
- Smoke, regression, negative, a11y and e2e-full suites per section 11.
- Test data: TD-L-01..25 (non-secret, no SSN literal).
- Execution record per run: build, tester, timestamp, TC status, record lineage for gated runs.
- Execution summary: `docs/TEST-EXECUTION-SUMMARY-Customer-Loan-Application.md` in the house style, with counts by status and priority, blocked list with Q-L ID.
- Defect log, referencing Q-L items; RTM (section 3.1, updated with results).
- Exploration findings from EXP-L-01..10 and updated TCs once B-L1 is resolved.
- Closure report and sign-off record.
- Playwright HTML report archived under `reports/`.

## 17. Estimate
Not requested. No estimate is given: there are no historical metrics for this module and nothing after sign-in has been observed, so an estimate would not be evidence-based.

## 18. Assumptions and go/no-go

Assumptions:
- Dev stays reachable and the two loan routes keep the observed public-page behaviour.
- The synthetic `LOAN_TEST_SSN` can be supplied outside the repo.
- A registered account will be provided; no work-around for Cloudflare will be attempted.
- The TC file (66 TCs) is stable; changes after Q-L answers are made in the TC file first, then here.

Go / no-go:
- **Go for Cycle 0 now:** entry 6.1 met.
- **Go for the blocked suite:** entry 6.2 met (B-L1 resolved).
- **Go for a gated run:** entry 6.3 met.
- **No-go:** any suspension condition in section 8 is active. Release is not signed off while any P0 is unexecuted, any Critical or High defect is open, or a literal SSN exists in any artefact.

Sign-off roles: Test lead (execution and exit criteria), Product owner (rules, residual risk, corrected data), Dev lead (Dev data, cleanup), Security contact (SSN handling).
