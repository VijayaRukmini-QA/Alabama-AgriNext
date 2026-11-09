# Acceptance Criteria: Create Customer Profile

App: Customer app, `CUSTOMER_BASE_URL` (dev: https://alabama-dev-customer.agrinextcloud.ai/). Separate from the Lender app.
Status: DRAFT, derived from the brief only. Nothing here has been observed live yet.
Legend: **[B]** = stated in the brief, **[I]** = inferred / assumed, **[TBC]** = to be confirmed by exploration. All field labels, button names, messages and URLs other than `/apply-for-a-loan` are [TBC].
Secrets (`CUSTOMER_EMAIL`, `CUSTOMER_PASSWORD`, `CUSTOMER_PHONE`, `CUSTOMER_FIRST_NAME`, `CUSTOMER_LAST_NAME`, `CUSTOMER_BASE_URL`, `SMS_INBOX_URL`) live in `.env`. No value appears in this document.

---

## 1. User story

As a **new customer** of Alabama Ag Credit, I want to **create a verified profile (email, personal details, consents, password, phone verification)**, so that I can **continue to apply for a loan**.

## 2. Requirements

| ID | Requirement | Basis |
|---|---|---|
| REQ-01 | The customer starts registration by entering an email address. The system sends an account verification code to that email. | [B] |
| REQ-02 | The customer enters the email verification code and validates it before reaching the profile form. | [B] |
| REQ-03 | The profile form collects first name, last name, street address (street1 with address autocomplete), phone, consents, password and confirm password. | [B] |
| REQ-04 | All consent checkboxes must be selected to continue. | [B], enforcement [I] |
| REQ-05 | Password and confirm password must match and satisfy a password policy; both have Show/Hide toggles. | [B] toggle, policy [TBC] |
| REQ-06 | On Continue, an SMS code is sent to the phone (sender "Alabama Ag Credit"). The customer enters it and selects "Complete verification". | [B] |
| REQ-07 | On successful verification the user is navigated to `/apply-for-a-loan`. | [B] |
| REQ-08 | Resend code and Forgot password links exist and navigate or act correctly. | [B] |
| REQ-09 | An email that is already registered is rejected or redirected to sign-in, with no duplicate profile created. | [I] from data contract |
| REQ-10 | Mandatory fields show clear validation messages; invalid codes are rejected. | [B] |
| REQ-11 | The UI is usable by keyboard and assistive technology. | [B] |
| REQ-12 | Sensitive data (password, codes) is masked, not exposed in URL, and transported over HTTPS. | [I] |

---

## 3. Acceptance criteria (Given / When / Then)

### 3.1 Functional: email and verification (Step 1)

**AC-01** (REQ-01) Given I am on the customer start page, When I enter a new, valid, unregistered email and submit, Then the app advances to the verification-code step and states the code was sent to that email.

**AC-02** (REQ-01, REQ-02) Given a code has been sent to a yopmail inbox, When I open the yopmail inbox, search for the account verification mail and refresh until it arrives, Then the mail contains a code I can read (format [TBC], e.g. 6 digits).

**AC-03** (REQ-02) Given I am on the verification-code step, When I enter the valid code and click validate, Then the profile form (Step 2) is displayed and the email is retained or shown read-only [TBC].

**AC-04** (REQ-02, REQ-10) Given I am on the verification-code step, When I enter a wrong code, Then an error is shown, I remain on the step, and the profile form is not shown.

**AC-05** (REQ-08) Given I am on the verification-code step, When I click Resend code, Then a new mail is sent, a confirmation is shown, and the old code is invalidated or both are accepted [open question Q-04].

### 3.2 Functional: profile form (Step 2)

**AC-06** (REQ-03) Given I am on the profile form, When I fill first name, last name, and street1 with "Alabama" and choose the last autocomplete option, Then the street field (and any dependent city/state/zip fields, [TBC]) are populated from the chosen option.

**AC-07** (REQ-03) Given the profile form, When I enter a valid phone number, Then the field accepts it with the accepted format [TBC] and no error is shown.

**AC-08** (REQ-04) Given the profile form, When I select all consent checkboxes (count and wording [TBC]), Then each is checked and Continue becomes enabled (or accepted) once all other fields are valid.

**AC-09** (REQ-05) Given the profile form, When I enter a policy-compliant password and the identical confirm password, Then no mismatch or policy error is shown.

**AC-10** (REQ-03, REQ-04, REQ-05, REQ-06) Given all fields are valid and all consents are checked, When I click Continue, Then the SMS verification step is shown and states a code was sent to the phone (masked display [TBC]).

### 3.3 Functional: SMS verification (Step 3) and completion

**AC-11** (REQ-06) Given the SMS step is shown, When I read the public SMS inbox and pick the newest "Alabama Ag Credit" message received after the code was requested, Then I obtain a code that was issued by this run.

**AC-12** (REQ-06, REQ-07) Given the SMS step, When I enter that code and click "Complete verification", Then the browser navigates to a URL whose path is `/apply-for-a-loan` and the profile exists.

**AC-13** (REQ-06, REQ-10) Given the SMS step, When I enter a wrong or empty code and click "Complete verification", Then an error is shown and I remain on the SMS step.

**AC-14** (REQ-08) Given the SMS step, When I click Resend code, Then a new SMS is requested; only a message newer than the resend time is accepted by the test.

### 3.4 Negative / duplicate

**AC-15** (REQ-09) Given `CUSTOMER_EMAIL` (the base email) is already registered, When I submit it at the start step, Then the app shows an "already registered" style message or redirects to sign-in, and does not send a registration code or create a duplicate [exact behaviour TBC].

**AC-16** (REQ-10) Given the start step, When I submit an empty email or malformed email (`notanemail`, `user@`, `@domain.com`, `a b@c.com`), Then a validation message is shown and no code is sent.

**AC-17** (REQ-08) Given the sign-in or password step of the customer app, When I click "Forgot password", Then I am taken to the reset flow (URL/page [TBC]); no reset is submitted.

### 3.5 Validation (mandatory fields and format)

**AC-18** (REQ-10) Given the profile form is empty, When I click Continue, Then each mandatory field shows a "required" message (first name, last name, street1, phone, password, confirm password, consents) and the form is not submitted.

**AC-19** (REQ-10) Given the profile form, When I leave exactly one mandatory field empty and fill the rest, Then only that field shows an error and Continue does not proceed.

**AC-20** (REQ-04) Given all fields are valid, When at least one consent checkbox is unchecked, Then Continue is blocked with a consent error (or disabled).

**AC-21** (REQ-05) Given the password field, When I enter a password violating the policy (too short, no digit, no uppercase, no special character, [policy TBC]), Then the policy error is shown.

**AC-22** (REQ-05) Given password and confirm password differ, When I leave the confirm field or click Continue, Then a "passwords do not match" error is shown and Continue does not proceed.

**AC-23** (REQ-10) Given the phone field, When I enter letters, too few or too many digits, Then an invalid phone error is shown [format rules TBC].

**AC-24** (REQ-03) Given the street1 field, When I type "Alabama", Then an autocomplete list appears with at least one option; selecting the last option fills the field. If I type text with no match (`zzzzzz`), then the list shows no options or a "no results" message and the form either accepts free text or blocks [TBC, Q-07].

**AC-25** (REQ-10) Given the name fields, When I enter leading/trailing spaces, apostrophes or hyphens (O'Neil, Anne-Marie), Then values are accepted and trimmed; when I enter `<script>alert(1)</script>`, Then it is rejected or stored inert and never executed.

### 3.6 UI

**AC-26** (REQ-05) Given password or confirm password has text, When I click Show, Then the value is visible (`type=text`) and the control name changes to Hide; When I click Hide, Then the value is masked again (`type=password`). Each field's toggle works independently [TBC].

**AC-27** Given each step, Then the expected elements are present: heading, labelled inputs, primary button, and links (Resend code, Forgot password) [exact inventory TBC by exploration].

**AC-28** Given a validation error, When I correct the field, Then the error clears.

**AC-29** Given a mobile viewport (375x667), Then every step renders without horizontal scroll and the primary button is reachable.

**AC-30** Given I refresh during Step 2 or 3, Then the app shows a valid step, with no error page, and does not leak entered values [resulting state TBC, Q-09].

### 3.7 Accessibility

**AC-31** (REQ-11) Every input (email, code, first name, last name, street1, phone, password, confirm password, SMS code) has an accessible name via label or aria-label; every checkbox is named by its consent text; every button, link and Show/Hide toggle has an accessible name.

**AC-32** (REQ-11) The Show/Hide toggle is a button, keyboard operable, and exposes state (`aria-pressed` or a changing accessible name).

**AC-33** (REQ-11) Tab order follows visual order on each step, with a visible focus indicator and no focus trap; the autocomplete list is operable by keyboard (arrows + Enter) [TBC].

**AC-34** (REQ-11) Validation errors are associated to their field (`aria-describedby` / `aria-invalid`) or exposed in a `role=alert` / live region.

**AC-35** (REQ-11) Enter submits the email step, the code step and the SMS step.

**AC-36** (REQ-11) An automated axe scan (WCAG 2.1 A/AA) on each step reports no critical or serious violations [threshold agreed; known issues listed in a baseline].

### 3.8 Security

**AC-37** (REQ-12) Passwords and codes are never present in the URL, query string, or browser console output; the app is served over HTTPS.

**AC-38** (REQ-12) Password and confirm password fields are masked by default; browser autocomplete attributes are sensible (`autocomplete="new-password"`) [TBC].

**AC-39** (REQ-12) The verification code is single-use and time-limited: reusing an accepted code is rejected [Q-03, exploratory only because it consumes a registration].

**AC-40** (REQ-12) Duplicate-email response does not allow trivially enumerating accounts beyond what the product owner accepts [Q-05; observation only].

**AC-41** (REQ-12) Repeated wrong codes are throttled or locked out after N attempts [Q-06; exploratory only, not automated].

### 3.9 Third-party dependencies

**AC-42** yopmail: the verification mail is retrievable within a bounded time (target 90 s) by searching the inbox and refreshing; if it does not arrive, the test fails with a clear "mail not received" message, not a generic timeout.

**AC-43** SMS inbox: the code is taken only from the newest "Alabama Ag Credit" message whose received time is after the request timestamp; messages older than the request are ignored; polling is bounded (target 120 s) by repeatedly clicking "update message".

**AC-44** If a captcha, bot challenge or consent wall appears on yopmail, the SMS site or the customer app, the run stops and reports "BLOCKED: captcha" instead of attempting to bypass it. Ads and cookie-consent banners on third-party sites are dismissed or ignored without failing the test.

**AC-45** The shared public SMS number may receive messages from other people or runs; the test must not consume or assert on another run's message.

---

## 4. Edge cases

1. Email case: `AgCustomer...@YOPMAIL.COM` treated as the same account as lower case.
2. Email with surrounding spaces is trimmed.
3. Yopmail address with plus-tag or uppercase; yopmail ignores case.
4. Verification code with spaces or pasted with a dash; paste of full code into first box if the UI uses split boxes [TBC].
5. Code expired (time-based) [Q-03], and code from a previous Resend.
6. User clicks browser Back from Step 2 to code step, then forward.
7. Double-click on Continue or Complete verification (duplicate submission).
8. Autocomplete: slow response, zero results, last option differs per run; selecting an option, then editing the text.
9. Phone number already used by another profile (shared public number) [Q-01].
10. Very long first/last names (50, 100, 256 chars); unicode names (Jose, Zoe with accents).
11. Password at policy boundary: minimum length exact, minimum minus one, maximum, maximum plus one; password containing the email or name.
12. Network drop between Continue and SMS step: no duplicate SMS, clear error.
13. Session timeout while waiting for the SMS (inbox polling can take a minute or two).
14. Consent text links open (terms, privacy) in a new tab without losing form state.
15. Autofill / password manager interaction with the confirm field.

---

## 5. Open questions and ambiguities

| ID | Question | Why it matters | Owner |
|---|---|---|---|
| Q-01 | Is the phone number required to be unique across profiles? The SMS inbox number is public and shared. | If unique, only one registration per phone ever succeeds, so the happy path cannot repeat with the same phone. Need a pool of numbers or a test bypass. | Product / Dev |
| Q-02 | What is the password policy (min/max length, character classes, blacklist) and is it shown to the user? | Needed for AC-21 and boundary tests. | Product |
| Q-03 | Code expiry duration and single-use rule for the email code and the SMS code. | AC-39 and stale-code tests. | Dev |
| Q-04 | Does Resend invalidate the previous code? Is there a cooldown or max count? | Resend tests and rate-limit risk. | Dev |
| Q-05 | Exact duplicate-email behaviour (message, redirect to sign-in, or silent). | AC-15, enumeration risk. | Product / Security |
| Q-06 | Attempt limits and lockout for wrong codes. | AC-41. | Security |
| Q-07 | Is street1 free text allowed, or must a suggestion be selected? What fields are auto-filled? | AC-06, AC-24. | Product |
| Q-08 | Is there a test-only bypass (fixed code, API for deleting the profile, API to seed an email-verified user)? | Registration is one-time, so cleanup and seeding decide whether E2E can scale. | Dev |
| Q-09 | State after refresh or Back at each step (is progress kept server-side)? | AC-30. | Dev |
| Q-10 | Is a captcha or bot protection planned on dev or present on the customer app? | Automation feasibility (AC-44). | Dev |
| Q-11 | Which consents exist, and are any optional? Brief says select all. | AC-08, AC-20. | Product |
| Q-12 | Where does "Forgot password" live (start page, after registration, sign-in page)? And "Resend code" on which steps? | AC-05, AC-14, AC-17. | Product |
| Q-13 | Is the SMS sender label always "Alabama Ag Credit", and what is the message format (regex for the code)? | AC-11 parsing. | Dev |
| Q-14 | Data retention: can dev profiles be deleted so `agcustomer<timestamp>@yopmail.com` accounts do not accumulate? | Cleanup. | Dev / Ops |
| Q-15 | Is yopmail and receive-smss.com use acceptable for the CI network (IP blocks, ToS)? | Third-party risk. | QA lead |
