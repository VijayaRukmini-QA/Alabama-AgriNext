import { test, expect } from '../../../fixtures/customer.fixture';
import { SIGNIN_MESSAGES } from '../../../test-data/customer-signin.data';
import { mockSignInFailure } from '../../../utils/signInMocks';
import { INITIATE_URL, captureToastText, observe, submitAndExpectGeneric, uniqueUnknownEmail } from './signin.helpers';

const GENERIC = SIGNIN_MESSAGES.invalidCredentials;

test.describe('Customer Sign in - security', () => {
  // One real submit with a synthetic unknown email covers TC-S-33, TC-S-34 and TC-S-69 (rate limit: one request, one journey).
  test('TC-S-33 TC-S-34 TC-S-69 @customer @signin @regression the password never appears in URLs, DOM, storage, cookies or console, and every request uses HTTPS', async ({ page, loginPage }) => {
    const password = `Aa1!${Date.now().toString(36)}Zq`; // unique so a substring search cannot hit anything else
    const requestUrls: string[] = [];
    const navigations: string[] = [];
    const consoleTexts: string[] = [];
    page.on('request', (r) => requestUrls.push(r.url()));
    page.on('framenavigated', (f) => {
      if (f === page.mainFrame()) navigations.push(f.url());
    });
    page.on('console', (m) => consoleTexts.push(m.text()));

    await loginPage.open();
    await loginPage.fillCredentials(uniqueUnknownEmail(), password);
    await loginPage.expectPasswordMasked(true); // TC-S-34: masked before the toggle is used
    const response = page.waitForResponse((r) => INITIATE_URL.test(r.url()));
    await loginPage.signInButton.click();
    await response;
    const toastText = await captureToastText(loginPage.toast);
    expect(toastText).toContain(GENERIC); // the toast also carries a title ("Error")

    // TC-S-33
    expect(page.url()).not.toContain(password);
    expect(page.url()).not.toContain(encodeURIComponent(password));
    for (const url of [...navigations, ...requestUrls]) {
      expect(url, 'url must not carry the password').not.toContain(password);
      expect(url, 'url must not carry the encoded password').not.toContain(encodeURIComponent(password));
    }
    const insecure = requestUrls.filter((u) => !/^(https:|data:|blob:|about:)/.test(u));
    expect(insecure, 'non-HTTPS requests').toEqual([]);

    // TC-S-34: not echoed in toast, title or visible DOM text (input values are not part of innerText)
    expect(toastText).not.toContain(password);
    expect(await page.title()).not.toContain(password);
    expect(await page.locator('body').innerText()).not.toContain(password);
    await loginPage.expectPasswordMasked(true);

    // TC-S-69: not persisted
    const stored = await page.evaluate(() =>
      JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage }, cookie: document.cookie }),
    );
    expect(stored).not.toContain(password);
    expect(stored).not.toContain(encodeURIComponent(password));
    const cookies = JSON.stringify(await page.context().cookies());
    expect(cookies).not.toContain(password);
    expect(consoleTexts.join('\n')).not.toContain(password);
    observe('Real submit: synthetic unknown email, never CUSTOMER_EMAIL. S-F-03 (password kept in field after failure) is a separate low finding.');
  });

  test('TC-S-35 @customer @signin @regression @negative opening /apply-for-a-loan while signed out shows only the sign-in prompt, not an application', async ({ page, landingPage }) => {
    await page.goto('/apply-for-a-loan');
    // Observed (Q-12): no redirect. The public welcome page is served at the same URL with only Sign in / Create profile.
    await landingPage.expectLoaded();
    await expect(page.getByRole('textbox')).toHaveCount(0);
    observe('Q-12 recorded: signed-out /apply-for-a-loan stays on that URL and shows the public welcome page (Sign in / Create profile). Not a redirect to /login; no application content.');
  });

  test('TC-S-36 @customer @signin @regression @negative injection-like input gets the generic error, with no dialog or script execution', async ({ page, loginPage }) => {
    await mockSignInFailure(page, 'user_not_found');
    const dialogs: string[] = [];
    const errors: string[] = [];
    page.on('dialog', async (d) => {
      dialogs.push(d.message());
      await d.dismiss();
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await loginPage.open();
    for (const value of ["' OR 1=1 --", '<script>alert(1)</script>']) {
      await test.step(`both fields: ${value}`, async () => {
        await loginPage.email.fill(value);
        await loginPage.password.fill(value);
        await submitAndExpectGeneric(page, loginPage, GENERIC);
        await expect(page).toHaveURL(/\/login/);
        expect(await page.locator('body').innerText()).not.toMatch(/stack trace|TypeError|ReferenceError|SQL|syntax error/i);
      });
    }
    expect(dialogs, 'dialogs opened by injected script').toEqual([]);
    expect(errors, 'uncaught page errors').toEqual([]);
  });
});
