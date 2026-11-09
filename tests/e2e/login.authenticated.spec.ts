import { test, expect } from '../../fixtures/pages.fixture';
import { RUN_REAL_LOGIN, getLenderEmail, getLenderPassword, BASE_URL } from '../../config/env';
import { urls } from '../../test-data/login.data';
import { openEmailStep, REAL_LOGIN_SKIP_REASON } from './helpers';

test.describe('Lender login - authenticated session', () => {
  test('TC-24 @regression @login logout returns to signed-out state', async ({ appEntryPage, emailPage, passwordPage, lenderHomePage, page }) => {
    test.skip(!RUN_REAL_LOGIN, REAL_LOGIN_SKIP_REASON);
    await openEmailStep(appEntryPage, emailPage);
    await emailPage.submitEmail(getLenderEmail());
    await passwordPage.waitUntilReady();
    await passwordPage.submitPassword(getLenderPassword());
    await lenderHomePage.dismissStaySignedInIfShown();
    await lenderHomePage.expectLoaded();
    test.skip(!(await lenderHomePage.logoutControl.isVisible()), 'Logout control not found (gap R-06)');
    await lenderHomePage.signOut();
    await page.goto(BASE_URL);
    await expect(page).toHaveURL(urls.entra, { timeout: 45_000 });
  });
});
