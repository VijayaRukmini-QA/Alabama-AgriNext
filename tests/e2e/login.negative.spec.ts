import { test, expect } from '../../fixtures/pages.fixture';
import { RUN_REAL_LOGIN } from '../../config/env';
import { messages } from '../../test-data/login.data';
import { openPasswordStep, REAL_LOGIN_SKIP_REASON } from './helpers';

// At most one wrong attempt against the real account; never retried.
test.describe('Lender login - negative (real account)', () => {
  test.describe.configure({ mode: 'serial', retries: 0 });

  test('TC-07 @regression @login wrong password for the real account is rejected', async ({ appEntryPage, emailPage, passwordPage }) => {
    test.skip(!RUN_REAL_LOGIN, REAL_LOGIN_SKIP_REASON);
    const email = await openPasswordStep(appEntryPage, emailPage, passwordPage);
    await passwordPage.submitPassword(`Wrong#Pass-${Math.random().toString(36).slice(2, 10)}`);
    await passwordPage.expectError(messages.wrongPassword);
    await expect(passwordPage.heading).toBeVisible();
    await passwordPage.expectEmailDisplayed(email);
  });
});
