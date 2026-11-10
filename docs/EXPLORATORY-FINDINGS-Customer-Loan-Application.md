# Exploratory Findings: Customer Loan Application (Land & Home)

- **App:** customer portal, Dev (`CUSTOMER_BASE_URL`)
- **Date:** 2026-11-10
- **Tooling:** Playwright 1.65 library scripts and Playwright Test (Chrome channel). No MCP.
- **Charters run:** EXP-L-09 (signed-out public page).
- **Charters not run:** EXP-L-01..08 and EXP-L-10. They need a signed-in customer (B-L1).

## Blocker

| ID | Observation | Impact |
|---|---|---|
| B-L1 | A real sign-in with `CUSTOMER_EMAIL`/`CUSTOMER_PASSWORD` fails today (2026-11-10). `POST /ciam-native-auth/oauth2/v2.0/initiate` returns 400 `user_not_found` (AADSTS50034). This is the same result as on 2026-11-09. | Steps 1-45 of the story (menu, Land & Home, Loan Information through Submit) cannot be reached, explored or automated. No post-sign-in locators exist yet, and none were guessed. |
| B-L1a | The account cannot be created through the app. Cloudflare bot checks block the yopmail inbox (email code) and receive-smss (SMS code, intermittent). See the Create Customer Profile findings, B1/B2. | Needs a human-registered account, or a test mail/SMS provider. |

## Signed-out behaviour of the loan routes (observed)

| Route | Result |
|---|---|
| `/apply-for-a-loan` | No redirect; the URL is unchanged. The public page has intro text and the buttons "Sign in" and "Create profile". There are no inputs, selects, textareas or headings. |
| `/loan-application-creation/loan-information` | Same as above. |
| Variants (`?ref=test`, trailing slash, uppercase path, stale/garbage cookie) | No normalisation or redirect. The public page is still shown, with no form. |
| "Sign in" button | Goes to `/login`, with no return path in the URL. After sign-in the user is not sent back to the loan route (Q-L-02). |
| "Create profile" button | Goes to `/create-profile`. |

## Findings

| ID | Severity | Type | Finding |
|---|---|---|---|
| L-F-01 | Low | UX / routing | Signed-out deep links to loan routes keep the protected URL and render a public gate instead of redirecting to `/login` with a return path. After sign-in the user does not come back to the loan step. Awaiting product decision Q-L-01/Q-L-02. |
| L-F-02 | Low | Accessibility | The public gate page has no heading or landmarks, only intro text and two buttons. Screen-reader users get no page title or structure. |
| L-F-03 | Info | UI | Buttons display as "SIGN IN" / "CREATE PROFILE" (CSS uppercase), while their accessible names are "Sign in" / "Create profile". Use case-insensitive locators. |
| L-F-04 | Info | Test data | The story data is internally inconsistent: born 2001, farming since 2000, 11 years with the employer. The expected app behaviour is unknown (Q-L-18, validation H1). |

## Not covered (needs an account)
- The main menu "Apply for loan" item, the Land & Home hover and Start Application.
- All 9 application steps: field validation, county to branch office mapping, the submission dialog, and "Skip feedback & continue".
- Keyboard and touch alternatives to the hover menu.
- Data impact of submission: each run creates a Dev record (B-L3).
