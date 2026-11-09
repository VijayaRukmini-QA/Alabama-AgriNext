import { test, expect } from '../../fixtures/pages.fixture';
import { getLenderEmail } from '../../config/env';
import { messages, malformedEmails, whitespaceCases, longEmail, overLongEmail } from '../../test-data/login.data';
import { openEmailStep, openPasswordStep } from './helpers';

test.describe('Lender login - validation', () => {
  for (const value of malformedEmails) {
    test(`TC-05 @regression @login malformed email "${value}" is rejected`, async ({ appEntryPage, emailPage, passwordPage }) => {
      await openEmailStep(appEntryPage, emailPage);
      await emailPage.submitEmail(value);
      await emailPage.expectError(new RegExp(`${messages.accountNotFound.source}|${messages.emptyEmail.source}`));
      await expect(passwordPage.heading).toBeHidden();
    });
  }

  test('TC-06 @regression @login empty password is rejected', async ({ appEntryPage, emailPage, passwordPage }) => {
    await openPasswordStep(appEntryPage, emailPage, passwordPage);
    await passwordPage.submitEmptyPassword();
    await passwordPage.expectError(messages.emptyPassword);
    await expect(passwordPage.heading).toBeVisible();
  });

  test('TC-20 @regression @login validation errors are announced via an alert region', async ({ appEntryPage, emailPage }) => {
    await openEmailStep(appEntryPage, emailPage);
    await emailPage.submitEmptyEmail();
    await expect(emailPage.error).toHaveAttribute('aria-live', 'assertive');
    await expect(emailPage.error).toContainText(messages.emptyEmail);
    await expect(emailPage.inlineErrorText).toBeVisible();
  });

  test('TC-21 @regression @login error clears after correcting the email', async ({ appEntryPage, emailPage, passwordPage }) => {
    await openEmailStep(appEntryPage, emailPage);
    await emailPage.submitEmptyEmail();
    await emailPage.expectError(messages.emptyEmail);
    await emailPage.submitEmail(getLenderEmail());
    await passwordPage.waitUntilReady();
    await expect(passwordPage.error).toBeHidden();
  });

  test('TC-22 @regression @login email with surrounding spaces and uppercase is normalised', async ({ appEntryPage, emailPage, passwordPage }) => {
    await openEmailStep(appEntryPage, emailPage);
    await emailPage.submitEmail(whitespaceCases.pad(whitespaceCases.upper(getLenderEmail())));
    await passwordPage.waitUntilReady();
  });

  const special: Record<string, string> = {
    'very long email (over maxlength)': overLongEmail,
    'email at maxlength': longEmail,
    'script tag': '<script>alert(1)</script>@agrinextqa-nodomain-test.com',
    'sql injection string': "' OR 1=1 --",
  };
  for (const [name, value] of Object.entries(special)) {
    test(`TC-23 @regression @login ${name} is rejected without crash`, async ({ appEntryPage, emailPage, passwordPage, page }) => {
      let dialogSeen = false;
      page.on('dialog', async (d) => {
        dialogSeen = true;
        await d.dismiss();
      });
      await openEmailStep(appEntryPage, emailPage);
      await emailPage.submitEmail(value);
      // Entra rejects these either inline or via its account-picker interstitial; both are acceptable, a password step is not.
      await expect(emailPage.inlineErrorText.or(emailPage.accountPicker)).toBeVisible();
      await expect(passwordPage.heading).toBeHidden();
      expect(dialogSeen).toBe(false);
    });
  }
});
