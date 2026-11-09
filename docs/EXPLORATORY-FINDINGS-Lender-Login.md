# Exploratory Findings - AgriNext Lender Login (dev)

## Charter
Explore https://alabama-dev-lender.agrinextcloud.ai/ login: validation, error text, forgot-password, keyboard behaviour, valid login landing, session storage. Date: 2026-11-06. Tool: Playwright 1.65 chromium (headless) via node scripts.

## Key discovery
The app has NO native login form. `/` renders only `img "Logo"` then redirects (MSAL.js 4.30, auth-code + PKCE, `response_mode=fragment`) to **Microsoft Entra ID** (tenant `d5cfed24-0813-47c8-944a-5d9b66994662`) at `https://login.microsoftonline.com/<tenant>/oauth2/v2.0/authorize?...redirect_uri=https://alabama-dev-lender.agrinextcloud.ai/`. All login UI is Microsoft-hosted (2 steps: email, then password). There is no show/hide toggle, no remember-me checkbox, no app-level heading.

## Session notes
- Redirect from `/` to Microsoft took ~7-10 s (cold, headless). Wait with `page.waitForURL(/login\.microsoftonline\.com/)`.
- Email step: empty submit, bad format, non-existent users, whitespace padding tested.
- Password step: empty submit, 1000-char input, Tab order, Forgot link, ONE wrong password tested.
- Valid login: ONE attempt with .env credentials was REJECTED by Microsoft ("Your account or password is incorrect..."). Not retried (lockout risk). Post-login landing, logout and auth storage could not be verified.
- Enter on the email field advances to the password step; Enter on password submits (wrong-password test used Enter).

## Findings
| ID | Severity | Observed | Expected |
|---|---|---|---|
| F-01 | Blocker (for automation) | Valid login with LENDER_EMAIL/LENDER_PASSWORD from .env failed: alert "Your account or password is incorrect. If you don't remember your password, reset it now." (.env parsed correctly: quoted value, 14 chars, no edge whitespace). | Login succeeds. Password in .env is likely stale/wrong, or account locked/disabled. Owner must confirm credentials; do not retry blindly. |
| F-02 | Info / design | Login is Entra SSO, not an app form. Page objects must target Microsoft DOM; MFA / "Stay signed in?" / conditional access may appear. Recommend a one-time storageState setup project rather than UI login per test. | n/a |
| F-03 | Low | App landing `/` shows a blank page with only `img "Logo"` for ~7-10 s before redirect, no loading indicator. | Visible loading/redirecting message. |
| F-04 | Low | Console error x2 on app page: "Permissions policy violation: unload is not allowed in this document." | No console errors. |
| F-05 | Low (Microsoft) | Bad email format ("notanemail") gives "We couldn't find an account with that username." not a format error; empty gives a different message. | Format-specific message. |
| F-06 | Low | Unauthenticated `/dashboard` did NOT redirect to Microsoft within 30 s (stayed on app, load never completed). Not investigated further. | Redirect to login or a 404 page. |
| F-07 | Info | An `@example.com` email on the email step navigated the browser to `chrome-error://chromewebdata/` instead of showing an error. Other synthetic domains show the normal error. Avoid example.com in tests. | Inline "couldn't find account" error. |
| F-08 | Info | No show/hide password toggle, no remember-me; password input has no maxlength (1000 chars accepted client side). Email input maxlength=113. | n/a |
| F-09 | Info | Whitespace around the email is trimmed; padded email proceeds to password step. | OK. |

## Exact message texts
| Case | Text |
|---|---|
| Empty email | `Enter a valid email address, phone number, or Skype name.` |
| Invalid format `notanemail` | `We couldn't find an account with that username.` |
| Non-existent user (`qa.nonexistent<ts>@agrinextqa-nodomain-test.com`, also `...@agrinextqa-nonexistent.onmicrosoft.com`) | `We couldn't find an account with that username.` |
| Empty password | `Please enter your password.` |
| Wrong password (real email, once) | `Your account or password is incorrect. If you don't remember your password, reset it now.` (contains link "reset it now.") |

All are field-level `role=alert` inside `main`, not toasts. Buttons are never disabled.

## URLs
- App: `https://alabama-dev-lender.agrinextcloud.ai/`
- Email step and password step: `https://login.microsoftonline.com/d5cfed24-0813-47c8-944a-5d9b66994662/oauth2/v2.0/authorize?...` then `.../login`
- Forgot password: `https://passwordreset.microsoftonline.com/?ru=...` (h1 "Get back into your account", h2 "Who are you?", textbox "Email or Username" prefilled with the email, buttons Next / Cancel, hint "Example: user@contoso.onmicrosoft.com or user@contoso.com")

## Tab order (password step)
password input, "Forgot my password", "Sign in", Terms of use, Privacy & cookies, "..." (troubleshooting).

## Validated locators (count == 1 on the stated page)
| Element | Locator | Tier | Page |
|---|---|---|---|
| App logo (pre-redirect) | `getByRole('img', { name: 'Logo' })` | 1 | app `/` (seen once; transient, do not wait on it) |
| Email input | `getByRole('textbox', { name: /Enter your email/ })` (full name "Enter your email, phone, or Skype."; placeholder "Email, phone, or Skype") | 1 | MS email step |
| Next button | `getByRole('button', { name: 'Next' })` | 1 | MS email step |
| Email step heading | `getByRole('heading', { name: 'Sign in', level: 1 })` | 1 | MS email step |
| Can't access link | `getByRole('link', { name: /access your account/ })` | 1 | MS email step |
| Sign-in options | `getByRole('button', { name: 'Sign-in options' })` | 1 | MS email step |
| Error alert | `getByRole('alert')` (assert text) | 1 | both steps |
| Password step heading | `getByRole('heading', { name: 'Enter password' })` | 1 | MS password step |
| Password input | `getByRole('textbox', { name: /Enter the password/ })` (type=password, id i0118) | 1 | MS password step |
| Sign in button | `getByRole('button', { name: 'Sign in' })` (input submit id idSIButton9) | 1 | MS password step |
| Forgot password link | `getByRole('link', { name: 'Forgot my password' })` | 1 | MS password step |
| Back button | `getByRole('button', { name: 'Back' })` | 1 | MS password step |
| Show/hide toggle | not present | - | gap |
| Remember me | not present (post-login "Stay signed in?" prompt not observed) | - | gap |
| Logout | not verified (login blocked) | - | gap |

Note: the email step also contains a hidden password input (id i0118, aria-hidden, offscreen); use role+name, not `input[type=password]`.

## Auth storage
Pre-login only: app cookies `ai_user`, `ai_session` (App Insights); Microsoft cookies on login.microsoftonline.com / login.live.com. localStorage and sessionStorage were empty (login failed). MSAL normally caches tokens in sessionStorage/localStorage after login; not verified.

## Console / network
Console: "Permissions policy violation: unload is not allowed in this document." (x2). No failed (>=400 or requestfailed) requests seen on the app page or login flow.

## Screenshots (docs/screenshots/)
login-initial.png, login-empty-password.png, login-password-step.png, login-forgot-password.png, login-wrong-password.png (dummy password only), plus login-nonexistent-tenant.png / login-nonexistent-domain.png where captured. No real password was shown in any screenshot.

## Hand-off
Blocked on credentials (F-01). Next: owner supplies a working lender account (and whether MFA applies); re-explore post-login landing, logout and storage; then hand to page-object-builder with a storageState auth setup.
