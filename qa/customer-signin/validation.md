# Validation: Customer Sign in test cases

Scope: `docs/TEST-CASES-Customer-Signin.md` checked against `docs/ACCEPTANCE-CRITERIA-Customer-Signin.md`. Read-only validation. Coverage was recomputed from each TC row's Traceability cell, not from the file's matrix.

## Verdict

Critical 0 | High 2 | Medium 7 | Low 8. Gate: pass. There are 0 Critical findings and well under 30% of TCs fail validation, which is 11 of 65 TCs or about 17% (TC-S-06, 14, 15, 37, 40, 43, 47, 50, 56, 59, 65 carry at least one Medium or High finding). Rework is still recommended for the High items.

## Recomputed coverage

| Item | Covered | % | Note |
|---|---|---|---|
| REQ-01..16 | 16 / 16 | 100% | REQ-13 is only partly covered in substance (see H2, M7). |
| AC-01..47 | 47 / 47 | 100% by trace | AC-38 and AC-45 are only partly covered (H1, H2). AC-02, 03, 04, 43 and 44 reach the real flow only through blocked or manual TCs. |
| BR-01..12 | 12 / 12 | 100% | |

- No orphan TCs. Every cited AC, BR, REQ, EDGE and Q ID exists in the AC doc. No reference to a non-existent ID was found.
- The file's own matrices agree with the recomputed traces, except for the Low item L5.

## Summary counts

Match. The priority, status and tag counts at the top of the file equal the table counts.
- Priority: P0 11, P1 16, P2 28, P3 10.
- Status: automatable 34, mocked 20, manual 7, blocked 4.
- Tags: @customer 65, @signin 65, @smoke 6, @regression 61, @negative 21, @a11y 8, @e2e-full 2, @mobile 1.
- Totals of 11 scenarios, 65 TCs and 2 DTs are correct.

## Other checks

- **IDs:** TC-S-01..65 are sequential with no gaps or duplicates. The scenario TC ranges are consistent.
- **Required fields:** every TC has preconditions, steps, data, expected result, priority and tags including @customer @signin. Every status is in the allowed set.
- **Secrets:** none present. Env var names are used, and the literals are non-secret test inputs.
- **Cloudflare:** no bypass. TC-S-37 and TC-S-60 step 8 stop with BLOCKED. TC-S-61 uses a human pass, which the AC doc allows.
- **Real account:** the only wrong-password attempt against the real account is TC-S-14, capped at 1 and status blocked. TC-S-55 is mocked. TC-S-56 is blocked and uses a dedicated account, not `CUSTOMER_EMAIL`.
- **Status:** no TC needing the real account or the inbox past Cloudflare is marked automatable or mocked. TC-S-37 is automatable but only detects the challenge.

## High

- **H1: AC-45 is half covered.** AC-45 says "Sign in" or "verify code" with an identity-provider 5xx or timeout, then an error, usable controls and no duplicate request. Only TC-S-40 (Sign in) and TC-S-41 exist. Nothing covers the verify-code step.
  - Fix: add a mocked TC with PC-2 on the code step, where the verify call returns 500, 503, abort or timeout. Expect an error message, "verify code" usable again, one request per click and no navigation to `/apply-for-a-loan`. Trace it to AC-45, REQ-15, REQ-16.
- **H2: AC-38 and REQ-13 are only partly covered for the code.** AC-38 says neither password nor code appears in the URL, history or requests. REQ-13 says the code is masked. TC-S-33 checks the password only, and no TC checks the code.
  - Fix: extend TC-S-48 (mocked correct code) or add a mocked TC. After "verify code", assert that the code is absent from the URL and query string, that all requests are https, and that the code input is masked or does not echo the code outside its input.

## Medium

- **M1: TC-S-06 and DT-S-01 R4.** R4 (whitespace email, empty password) is mapped to TC-S-06, but no step exercises it. The steps use whitespace email with a filled password (R3), then a valid-looking email with whitespace password.
  - Fix: add a step with whitespace email and empty password, expected disabled. Specify the second email as `unknown.user@example.test`, since "valid-looking" is ambiguous and could be read as the real account.
- **M2: TC-S-47 is not atomic.** It covers two behaviours, an expired code and an already-used code, which are DT-S-02 R4 and R6.
  - Fix: split into two TCs, each with its own data row.
- **M3: Missing named setup block and cross-TC references.**
  - TC-S-44, 46, 47, 49, 50, 51, 53, 54, 57 and 58 start from "code step" with no steps or block that reach it.
  - TC-S-43 says "code step reached (TC-S-42 mock)", which reads as dependent on TC-S-42.
  - TC-S-15 cites TC-S-13 as the source of the mock variant.
  - Fix: define PC-5 = PC-2 valid-credentials variant plus the sign-in steps, and reference it by ID. Remove TC-ID references from preconditions.
- **M4: Real-account wrong-password budget is not explicit enough.**
  - TC-S-14 caps at 1 attempt per run, not per day or lockout window. Repeated runs can lock the only real account.
  - TC-S-56 allows "agreed small number" with no ceiling.
  - TC-S-65 (spaces around password, autofill, uppercase email, "as listed") does not say which account is used.
  - Fix: state a global budget, for example at most 1 wrong attempt per account per 24 h, shared across TC-S-14, 56 and 65. TC-S-65 must say it uses `unknown.user@example.test` only. TC-S-56 must cap attempts below the Q-07 threshold.
- **M5: No pass/fail assertion in TC-S-50 and TC-S-59.** Expected is "behaviour recorded" only.
  - Fix: TC-S-59 should assert that no error page or stack trace appears and the user is never shown a broken state. TC-S-50 should assert that no navigation to `/apply-for-a-loan` happens and the entered digits are not lost silently.
- **M6: TC-S-37 expected result is not deterministic.** The "run stops" outcome cannot fail or pass in a normal runner. Behaviour when no challenge appears is undefined, and the TC is automatable against a live third-party site.
  - Fix: assert "challenge detected leads to BLOCKED status for dependents, zero interactions with the page beyond load". Add an else branch: "no challenge, proceed to TC-S-60 polling". Keep the status as automatable, but note the TC is environment-dependent.
- **M7: REQ-13 "logs or storage" has no TC.** Nothing checks that the password does not persist in localStorage, sessionStorage, cookies or console logs.
  - Fix: add an automatable TC. After a failed sign-in, scan storage and console output for `Aa1!wrongPass`. Trace it to REQ-13.

## Low

- **L1: Line 53 is a garbled sentence.** It is known and being fixed separately.
- **L2: The Technique column is embedded in the title as `[tech]`, not a separate column.** The spec asks for a mandatory Technique column. Fix: add the column.
- **L3: Technique label mismatches.** TC-S-45 is labelled BVA but tests an arbitrary wrong code, so it should be EP. TC-S-23 and TC-S-21 labels are loose.
- **L4: Hidden setup steps.** TC-S-22 says "password visible" as a precondition with no step to make it so. TC-S-17 says "At `/forgot-password`" with no navigation. Fix: reference a block, or add the steps.
- **L5: Traceability cells omit REQs that the matrix attributes.** TC-S-10 and TC-S-13 do not cite REQ-03, although the REQ-03 matrix lists TC-S-10 and TC-S-13. TC-S-46 does not cite REQ-06, although the REQ-06 matrix lists it. This is harmless, but align the two.
- **L6: Compound TCs.** TC-S-05, 23, 33, 38, 39 and 40 (four failure modes plus recovery), 64 and 65 bundle several checks. Acceptable as data rows or charters, but failure localisation is weaker.
- **L7: Near-duplicate assertion.** TC-S-35 and TC-S-43 both assert AC-40 (direct access to `/apply-for-a-loan` refused). TC-S-43 adds the code-step state, so keep both but state the difference in the titles.
- **L8: DT-S-02 and fixtures.**
  - The R3 note refers to a "C5" that is not in the condition inventory.
  - R1 collapses 8 combinations under one assumed reason ([I]).
  - TC-S-38 and 39 use saved inbox HTML fixtures. Fix: state that fixtures are hand-built, not captured past Cloudflare.
- The file's own "Validation findings" Low items (assert-recorded-behaviour TCs, DT-S-02 assumption) are agreed. This validation does not repeat them as separate findings.
