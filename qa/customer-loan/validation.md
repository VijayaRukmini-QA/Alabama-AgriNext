# Validation: Customer Loan Application - Land & Home test cases

Scope: `docs/TEST-CASES-Customer-Loan-Application.md` (TC-L-01..66, TS-L-01..11, DT-L-01..03, EXP-L-01..10) checked against `docs/ACCEPTANCE-CRITERIA-Customer-Loan-Application.md`, `docs/TEST-PLAN-Customer-Loan-Application.md` and `qa/customer-loan/test-data.md` (TD-L-01..25, PC-L-1..12, DI-01..15). Read-only validation, Phase 5. Coverage was recomputed from each TC row's REQ, AC, BR and EDGE cells, not from the file's matrices. No secret value and no SSN literal appears in this file. House style: `qa/customer-signin/validation.md`.

## Verdict

Critical 0 | High 6 | Medium 13 | Low 14 (33 findings). Orphans 0. Gate (0 Critical and no orphans): **PASS, with conditions**.

Conditions: the six High items are rework items for the TC file, the AC doc and the plan. None blocks Cycle 0 (the 7 automatable-now TCs), except H5, which would make TC-L-57 fail on its first run against the repo docs.

Rework threshold (> 30% of TCs failing validation):
- Per-TC findings at Medium or above: 17 of 66 TCs (26%): TC-L-06, 20, 25, 38, 46, 48, 49, 53, 54, 57, 58, 59, 60, 61, 62, 63, 66.
- Observation-only oracles (finding M1) are a separate, systemic finding. 20 TCs have no pass/fail oracle at all, and 5 more have only a sanity assertion. Counted as failures, the union is 35 of 66 (53%). I do not count them as per-TC failures. The oracle gap is declared in every row with its Q-L link, is forced by B-L1 and the no-invented-rules constraint, and is closed by exploration. Under the strict reading the threshold is exceeded. The caller decides whether to apply it.

## Recomputed coverage

| Item | Covered | % | Note |
|---|---|---|---|
| REQ-L-01..16 | 16 / 16 | 100% | Only REQ-L-12 is fully executable today. REQ-L-01, 13 and 14 are partly executable (TC-L-06, 57, 04). The other 12 REQ are all blocked. REQ-L-14 post-login has no valid AC (H3). |
| AC-L-01..42 | 42 / 42 | 100% by trace | AC-L-42 is really covered only by TC-L-04. TC-L-58..63 cite it as an analogue (H3). 4 ACs plus AC-L-02 are executable now. |
| BR-L-01..08 | 8 / 8 | 100% | BR-L-05 is covered only by TC-L-41, 42 and 66, all blocked. |
| EDGE-L-01..36 | 36 / 36 | 100% | 6 EDGE have no AC: EDGE-L-10, 15, 25, 28, 29, 31 (see L4). EDGE-L-05 is only half covered in substance (M9). EDGE-L-36 is covered via the stale-cookie variant only. |

AC to TC check, recomputed (every row; AC-L-nn: TCs):
- 01: 07, 66 | 02: 06 | 03: 08, 10, 66 | 04: 09, 65, 66 | 05: 11, 65, 66 | 06: 12, 13 | 07: 14 | 08: 15 | 09: 18, 65, 66 | 10: 19, 20 | 11: 21 | 12: 22 | 13: 24
- 14: 25, 33, 66 | 15: 26 | 16: 27 | 17: 28, 29 | 18: 30 | 19: 31 | 20: 32 | 21: 34, 65, 66 | 22: 35, 65, 66 | 23: 36 | 24: 37, 65, 66 | 25: 38 | 26: 39, 65, 66 | 27: 29, 40
- 28: 41, 66 | 29: 42 | 30: 43, 44, 66 | 31: 45 | 32: 46, 66 | 33: 47 | 34: 48 | 35: 50, 51 | 36: 51, 52 | 37: 53, 54 | 38: 56, 57 | 39: 01, 05 | 40: 02, 05 | 41: 03 | 42: 04 (and 58..63, analogue only)

## Orphan check

- **TC to upstream:** 0 orphan TCs. All 66 TCs cite at least one existing REQ, AC, BR or EDGE ID. TCs with AC "none" (16, 17, 23, 49, 55, 64) each cite an EDGE or BR. No cited ID is outside REQ-L-01..16, AC-L-01..42, BR-L-01..08 or EDGE-L-01..36. Every cited Q-L is within 01..29, with no Q-L-30 or higher.
- **Upstream to TC:** 0 orphan REQ, AC, BR or EDGE. 0 TS without a TC. DT-L-01 R1..R24, DT-L-02 R1..R16 and DT-L-03 R1..R4 each map to at least one TC.
- **Weak traces, not orphans:** TC-L-58..63 cite AC-L-42, which does not describe them (H3).
- **TD references:** all TD-L ids in the TC "Test data" column (01..25) resolve in both the TC file register and `test-data.md`. No TD-L-26 or higher. All PC-L-1..12 are defined and used. TC-L-34, 46 and 49 use "none", which is acceptable.

## Cross-artefact consistency

| Check | Result |
|---|---|
| TC file totals (11 TS, 66 TC, 3 DT, 10 EXP) | Match the table counts. |
| Priority P0 8 / P1 32 / P2 25 / P3 1 | Match the table, plan section 10 and plan section 12. |
| Type counts (15, 14, 8, 6, 4, 5, 3, 8, 1, 2 = 66) | Match the table. |
| Status 7 / 58 / 1 | Match the TC file, plan header, section 12 and section 12.1. |
| Tags: smoke 6, regression 65, negative 20, a11y 8, e2e-full 1 | Match plan section 11. TC-L-66 carries no @regression. |
| Plan section 12 status table vs TC file | All 66 rows match on title, tags, priority and status. The blocking reason for TC-L-48 and TC-L-54 does not match the TC steps (L12, H2). |
| AC doc counts (REQ 16, BR 8, AC 42, EDGE 36) | Match. Q-L is 29 rows, summary says 28 (L1). |
| Q-L numbering | 01..29, continuous, no duplicates. Pseudo-ID "Q-L-19a" is used (L5). The opt-in switch is attached to the wrong Q-L (M2). |
| TC file TD register vs `test-data.md` | Drift (M13). |
| Plan vs data contract | Conflicts on committed TD files and on skip vs fail-fast (M5, M6). |

## Producer-reported issues: confirm or reject

| Item | Verdict | Severity | Owner |
|---|---|---|---|
| AC summary says Q-L 28 | **Confirmed.** The section 8 table has Q-L-01..29. | Low (L1) | AC doc |
| DI-01 "about 24" | **Confirmed.** 2026 minus 2001 is 25 and the 09/09 birthday has passed. It also appears in TC file DT-L-03 condition C2 ("about age 24"), which the producers did not list. | Low (L2) | AC doc, TC file |
| DI-02 EDGE-L-15 reversed | **Confirmed.** 4 is less than 11. | Low (L3) | AC doc |
| DI-03 TC-L-48 retry | **Confirmed**, and widened to TC-L-54. | High (H2) | TC file, plan |
| Opt-in switch linked to Q-L-24 | **Confirmed.** Q-L-24 is data lineage. | Medium (M2) | AC doc |
| TC-L-58..63 cite only AC-L-42 (G-L-1) | **Confirmed.** | High (H3) | AC doc |
| DI-05 run ID vs verbatim text | **Confirmed.** | Medium (M4) | Plan |
| DI-09 committed TD files | **Confirmed.** | Medium (M5) | Plan, test data |
| DI-10 skip vs fail-fast | **Confirmed.** | Medium (M6) | Plan |
| DI-06 "Active loan = Yes" needs a Q-L | **Confirmed.** | Medium (M3) | AC doc |
| DI-07 security-input gap | **Confirmed.** | High (H4) | AC doc, TC file |
| DI-04, DI-08, DI-12, DI-13, DI-14, DI-15 | Confirmed. DI-04 is only fixed in `test-data.md`, not in the TC file (M13). DI-08 is a risk to the happy path, owned by Q-L-16 (noted in H1). DI-12, 13 and 14 are Low (L6, L7, L8). DI-15 is a valid TBC and not a defect. | | |
| DI-11 | **Confirmed and still open** in the TC file (H5). | High | TC file |

## High

- **H1: The story data is a single point of failure, and two P0 TCs have no pass/fail oracle.** (Owner: TC file; AC doc for Q-L-18.)
  - TC-L-25 and TC-L-66 (P0) expect "outcome is recorded", or "stop and record, no pass/fail". Plan 7.2 requires 100% of P0 to be "passing".
  - PC-L-6..12 are built by replaying TD-L-10, which Q-L-18 says may be rejected. Every TC that depends on those blocks inherits the risk. That is about 30 TCs: 34..45, 47..49, 50, 52..54, 56, 58..66 (the plan acknowledges the risk as R-L-06).
  - No fallback precondition is defined. The corrected dataset is a PROPOSAL only (`loanProposalApplicantAlt`, test data 5.2).
  - Fix: split TC-L-25 into the story-data observation (keep as exploratory, no verdict) and a TC with a confirmed-valid dataset, with a deterministic expected result of "Co-Applicant Details shown" once the product owner supplies it. Add a PC-L-6 variant "PC-L-6-alt", built from the corrected data, and name which one the gated runs use. Add a plan entry criterion that Q-L-18 is answered before the first gated run.
- **H2: DI-03 confirmed, widened. TC-L-48 and TC-L-54 can create real Dev records outside the gated set.** (Owner: TC file; plan 5.3, 10 and 12; test data section 9.)
  - TC-L-48 step 3 retries the submit once the fault is lifted. If the retry reaches the real endpoint, it creates a record. TC-L-48 is not in the gated list (43, 47, 49, 66). TC-L-56 does not check it. Plan section 10 schedules it in the ordinary P2 batch. Its plan blocking reason says "needs no real submit", which contradicts the step.
  - TC-L-54 (P1) clicks the dialog SUBMIT APPLICATION on an "expired" session. If the cookie clearing does not invalidate the server session, the submit succeeds and a record is created. The plan says TC-L-54 uses `page.route`, but the TC steps and TD-L-24 use cookie clearing only (L12).
  - Fix: either fulfil the TC-L-48 retry with a route mock (a mock success, never the real endpoint) and state so in the steps, or add TC-L-48 and TC-L-54 to the writes-record set (TC-L-56, the plan section 5.3 list, and the data tag `writes-record`). For TC-L-54 add a step that intercepts the submit request and fails the TC if the request reaches the real endpoint.
- **H3: G-L-1 confirmed. TC-L-58..63 have no valid AC.** (Owner: AC doc.)
  - Six a11y TCs, five of them P1 on a regulated lending form, cite AC-L-42 (signed-out public page only). Expectations such as dialog focus trap, announced validation errors and post-login names cannot be traced to any AC. Gate math is unaffected because they also cite REQ-L-14.
  - Fix: add post-login a11y ACs (keyboard operability per step, accessible names, announced errors, dialog focus management), for example AC-L-43..45 after exploration. Re-trace the TCs to them. Until then, change the AC column to "none (G-L-1)" instead of citing a non-matching AC, so the coverage matrix does not over-claim AC-L-42.
- **H4: DI-07 confirmed. Security-input coverage gap.** (Owner: AC doc, TC file.)
  - The data owner added security members for numeric inputs, DOB and years (test data 3.2). The TC file has no TC that runs them. Only the description, employer/profession, signed-out routes and session surfaces are covered. Acres, borrow, value, DOB, years, salary and SSN V14 have none.
  - The AC doc has no security AC for these inputs, only EDGE-L-07 and 17 for text and SSN shape.
  - Fix:
    - Add an AC for input-safety on every numeric and date field. Expected: no script runs, no stack trace and no 5xx, and the value is accepted or rejected per the rule.
    - Add TCs (type negative, technique EG or EP) for TD-L-03, 06, 07, 11, 12 and 18 members and SSN V14.
    - Make the TC-L-12, 19, 20, 26, 27, 28 and 36 data columns reference those members.
    - Raise TC-L-33 to P2 as DI-07 suggests.
- **H5: DI-11 is still open in the TC file. TC-L-57 would fail on its first run.** (Owner: TC file.)
  - TC-L-57 scans docs and TD files for 9 or more digits. TD-L-07 and TD-L-18 in the TC file contain an 11-digit and a 12-digit run of nines. The plan says any match is Critical and suspends the run (section 8). A false positive stops all of Cycle 0.
  - `test-data.md` already describes these probes as generated at run time. The TC file, which the plan names as the source of truth, was not updated.
  - Fix: replace the two literals in TC-L-07/TD-L-18 text of the TC file with "generated at run time (11 and 12 digits)". Anchor the TC-L-57 pattern (word boundaries, exclude the generated-probe markers). Re-run after the edit.
- **H6: TC-L-46 and TC-L-49 are not independent.** (Owner: TC file.)
  - Both start from "post-submit screen reached (opt-in gated run, one submission)". No PC block builds that state. TC-L-46 "rides on the single submission of its run", so it depends on another TC's run. TC-L-49 is tagged data-creating, yet its steps contain no submit.
  - Fix: add PC-L-13 "PC-L-12 plus dialog SUBMIT APPLICATION clicked; post-submit screen shown (writes a record; gated)". Reference it from TC-L-46 and TC-L-49. State that each TC owns its own opt-in run (TC-L-46 becomes a fifth gated TC, or is merged into TC-L-43 as one step, which is cleaner for the one-submission-per-run rule).

## Medium

- **M1: Observation-only oracles (systemic).** (Owner: TC file; AC doc for Q-L answers.)
  - 20 TCs have no failable expectation: 03, 12, 14, 15, 16, 19, 20, 22, 23, 24, 26, 27, 30, 31, 32, 36, 38, 42, 51, 52.
  - 5 more have only a sanity assertion (no crash, no script run): 13, 21, 28, 33, 55.
  - AC-L-06, 07, 10..18, 20 and 25 are themselves written as "outcome recorded", so the root cause is upstream.
  - This follows the no-invention rule and is bounded by Q-L-04..28, but a TC that cannot fail is not a regression test.
  - Fix:
    - Add an interim assertable layer to each: no page error, user stays on the step or advances (one of the two), no console error, no stack trace.
    - After exploration, replace "recorded" with the observed result.
    - Plan 7.2 already requires write-back to the Q-L items. Add a TC-file revision step to the plan.
- **M2: The opt-in switch is attached to the wrong question.** (Owner: AC doc.)
  - PC-L-11, plan 5.3 and 13.2, and test data 8 and 15 say the switch name is open under Q-L-24. Q-L-24 is data lineage. No Q-L asks for the switch.
  - Fix: add a Q-L to the AC doc, appended as Q-L-30 so that no number moves, or extend the Q-L-24 text to include the switch name and default. Update the four references.
- **M3: DI-06 needs a new Q-L.** (Owner: AC doc.)
  - Question: is "Active loan with Alabama Ag Credit = Yes" self-declared or verified against account state? If verified, the test account must hold an active loan (test data referential integrity row 12).
  - Fix: add Q-L-31 (or Q-L-30 if M2 extends Q-L-24). Link it to REQ-L-04, AC-L-09 and AC-L-12. Add it to plan 13.2 and to the test data open-items table.
- **M4: DI-05 plan vs verbatim story text.** (Owner: plan 5.2.)
  - The plan proposes a run ID inside the description. That changes the verbatim text that TC-L-18 and TC-L-66 enter, and the TD-L-05 text embeds the value 160599 (test data 5.3). Test data section 8 rejects it. The two artefacts disagree.
  - Fix: adopt the data decision (account plus run-log timestamp). Reword plan 5.2 to "run ID tag only if product allows a non-story field (Q-L-24)". Keep the story text verbatim for TC-L-18 and TC-L-66.
- **M5: DI-09 committed TD files.** (Owner: plan 5 and 13.3.)
  - The plan creates a TD file under `test-data/` with story values. The data contract says no committed payloads.
  - Fix: pick one. Recommended: keep the story values in the data source only. Otherwise document a committed non-secret file as an explicit exception with a no-SSN check.
- **M6: DI-10 skip vs fail-fast.** (Owner: plan 4 and 8.)
  - The plan says a missing env key skips the dependent TCs. The data contract says fail fast naming the variable. A silent skip yields a green run with no coverage.
  - Fix: fail fast at suite start for the keys of the selected set. Skip with a reason only for the opt-in gate. Update plan section 4 (Env keys row) and section 8.
- **M7: TC-L-53 precondition is wrong.** (Owner: TC file.)
  - TC-L-53 cites PC-L-6 (Co-Applicant Details shown) but edits "a field on Income". Income is shown at PC-L-7.
  - Fix: use PC-L-7, or edit Co-Applicant. TC-L-51 also says "a few fields filled" instead of a block (Low, same fix pattern).
- **M8: TC-L-06 is time-bound and the attempt budget is per run.** (Owner: TC file, plan 5.)
  - Its expected result is valid only while the account does not exist (B-L1). After B-L1 clears, the same steps log in and reach the code step, and a @regression TC fails for the wrong reason. There is no retirement or flip condition.
  - A budget of "one attempt per run" does not protect the only account from lockout across runs (sign-in M4 raised the same).
  - Fix: add a precondition "run only while B-L1 is open" with an auto-skip when the code step appears. Add an attempt budget per account per 24 hours shared with the sign-in suite.
- **M9: EDGE-L-05 value side is not exercised.** (Owner: TC file.)
  - TD-L-07 value probes (0, -1, 160599.99, very large, empty) are listed in the data column of TC-L-20, but its steps run only the borrow-then-edit sequence. No step covers the property value as a boundary field, so EDGE-L-05 "borrow or value" is half covered.
  - Fix: add a BVA TC for Estimated property value, or add a "for each value" loop to TC-L-20 and split the order-edit scenario out.
- **M10: Atomicity.** (Owner: TC file.)
  - TC-L-38 runs two behaviours (a Yes answer and an unanswered declaration), which are EDGE-L-23 and EDGE-L-20.
  - TC-L-30 mixes the story data and the equal-birth-year variant. TC-L-22 mixes the branch mapping and the list scroll.
  - Fix: split TC-L-38. Split TC-L-30 and TC-L-22, or accept them as data-driven and say so in the title.
- **M11: Priority against the plan's own risk scoring.** (Owner: plan 10, TC file.)
  - FA-02 (data impact, SSN) and FA-03 (access control, session expiry) score 6 and are labelled P0. Their TCs are all P1: 01, 02, 29, 47, 48, 49, 53, 54, 56, 57. The plan convention (6..9 = P0) is not applied, and FA-04 acknowledges the same gap.
  - TC-L-57 is P1, but a literal SSN is treated as a Critical release blocker (plan 5.1, 8, 18).
  - Fix: either re-score the plan rows or raise TC-L-57 and TC-L-53/54 to P0 in the TC file. The priorities are still unconfirmed with the product owner (G-L-6).
- **M12: Gated TCs cannot be selected out by tag.** (Owner: TC file, plan 11.)
  - TC-L-43, 47 and 49 carry @regression. A plain regression run (65 TCs) includes data-creating cases. Safety depends on the code-level opt-in only. The `writes-record` and `opt-in` tags exist in the test data but not on the TCs.
  - Fix: add an @gated (or @writes-record) tag to TC-L-43, 47, 49, 66 (and 48, 54 per H2), and document `--grep-invert @gated` for the default run.
- **M13: TD drift between the TC file and the test data.** (Owner: TC file.)
  - TD-L-03, 06, 07, 08, 11, 12, 16 and 18 in the TC file lack the security members. The future-year probe is still fixed "2027" (DI-04). The SSN variants stop at 10 shapes while the test data has V00..V14. The plan calls the TC file the source of truth.
  - Fix: sync the TC file TD register to `test-data.md`, or state that `test-data.md` supersedes it. Do this together with H4 and H5.

## Low

- **L1:** AC doc line 13 says Q-L 28. There are 29. Fix: change to Q-L 29.
- **L2:** DI-01. AC I-L-5 and EDGE-L-13 say "about 24"; the TC file DT-L-03 C2 says "about age 24". The age is 25 on 2026-11-10. Fix all three.
- **L3:** DI-02. EDGE-L-15 says "Years in profession (4) greater than Years with employer". For the story values 4 is less than 11. Reverse the comparison and keep Q-L-18.
- **L4:** The AC doc statement "Not covered by any AC" lists 5 EDGE (10, 25, 28, 29, 31). EDGE-L-15 also has "none" in its covered-by column. Add EDGE-L-15. TC-L-30 covers it through AC-L-18.
- **L5:** "Q-L-19a" is not an ID in the Q-L table (used by AC-L-19, TC-L-31). Fix: use Q-L-19 or a new number.
- **L6:** DI-12. TC-L-40 checks the SSN display but does not list TD-L-13. TC-L-26, 27 and 30 build on TD-L-10 in preconditions without listing it in the data column.
- **L7:** DI-13. EDGE-L-12 says 09/09/2001 is "ambiguous-proof". The value cannot prove the format. Reword the AC.
- **L8:** DI-14. Add "MARRIED with an empty Co-Applicant step" to Q-L-20.
- **L9:** Matrix gaps. The TC file BR matrix omits TC-L-08 (BR-L-02) and TC-L-48 (BR-L-04). The REQ-L-13 row omits TC-L-66. Plan 3.1 lists TC-L-64 under REQ-L-02, but TC-L-64 cites REQ-L-14 only. The data are right in the rows. Fix the matrices.
- **L10:** Plan 13.1 says B-L1 blocks "07..55 except 56, 57". 56 and 57 are outside 07..55. The count of 58 is correct. Reword as "07..55 and 58..66".
- **L11:** Plan section 4 lists `LOAN_TEST_SSN` for TC-L-25, 28, 29, 66. Plan section 5 and the test data also list 40 and 57. Align them.
- **L12:** Plan section 5 maps TD-L-22 to TC-L-48 and 54. The TC file and test data map TC-L-54 to TD-L-24. See H2.
- **L13:** Technique is a Title prefix and not a column. This is a documented deviation from the format. TC-L-31 is labelled PW, but its steps are one-factor-at-a-time. TC-L-20 is labelled DT, but it has a single condition.
- **L14:** EXP-L-09 is runnable now (no account) and TC-L-03 feeds it. The plan 6.2 item 5 schedules all charters after B-L1, and 7.1 does not list it. Add it to Cycle 0.

## Checks that passed

- **Format:** every TC is a tabular row with the full 14-column schema. No prose test cases.
- **Completeness:** every TC has REQ or AC, priority, tags (all carry @customer @loan), status in the allowed set, preconditions, steps, test data and expected result.
- **Independence:** each post-login TC names a PC block. Shared setup is by ID. Exceptions are H6, M7 and the free-text blocks of TC-L-51 and TC-L-55 (Low).
- **Atomic steps:** one action per step. TC-L-66 has 45 steps by design as the e2e case.
- **Titles state behaviour** in all TCs.
- **Secrets and SSN:** no password, email, URL value or SSN literal in the four artefacts (grep for 9-digit runs and ddd-dd-dddd found only the two generated-probe literals in H5). SSN is `LOAN_TEST_SSN` throughout.
- **Cloudflare and SMS:** stop-and-report, no bypass (plan 8).
- **Status and tag vs plan:** consistent (see the table above). Smoke runs 2 of 6 now. Negative runs 4 of 20 now. A11y runs 1 of 8 now.
- **DT rules:** DT-L-01 (24 rules, elimination log "none, no invented rule"), DT-L-02 (16) and DT-L-03 (4) each have at least one TC per rule. DT-L-01 R21 and DT-L-02 R16 carry the only known outcomes.
- **Categories:** positive, negative, boundary, integration (TC-L-48), state transition, data-driven and exploratory are all present.

## Gaps / questions

- Q-L-18 (story data) and Q-L-29 (account) gate the P0 set.
- New questions needed: opt-in switch name (M2) and the "Active loan = Yes" verification (M3).
- A post-login a11y AC and an input-safety AC are not yet written (H3, H4).
- Cleanup owner (Q-L-25) is unnamed. No gated run can start without one (plan 6.3).
