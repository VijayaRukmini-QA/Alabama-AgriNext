import { test, expect } from '../../fixtures/customer.fixture';
import { fillValidProfile, reachProfileForm, type Steps } from './helpers';
import { addressQuery, messages, mockUser, phones } from '../../test-data/customer.data';
import type { Consent } from '../../pages/customer/SignUpProfileFormPage';

test.describe('Customer - sign-up profile form (mocked auth, real Google Places)', () => {
  let steps: Steps;
  test.beforeEach(async ({ page, emailStepPage, codeStepPage, profileFormPage, smsStepPage }) => {
    steps = { page, emailStepPage, codeStepPage, profileFormPage, smsStepPage };
    await reachProfileForm(steps);
  });

  test('TC-C-15 @customer @regression Street 1 "Alabama": last suggestion autofills City, State and Zip', async ({ profileFormPage }) => {
    await profileFormPage.chooseLastAddressSuggestion(addressQuery);
    await expect(profileFormPage.street1).not.toHaveValue('');
    await expect(profileFormPage.city).not.toHaveValue('');
    await expect(profileFormPage.state).not.toHaveValue('');
    await expect(profileFormPage.zipCode).not.toHaveValue('');
    await expect(profileFormPage.county).not.toHaveValue('');
  });

  test('TC-C-15 @customer @regression @negative free text without a chosen suggestion keeps Continue disabled', async ({ profileFormPage }) => {
    await profileFormPage.fillProfile({ firstName: mockUser.firstName, lastName: mockUser.lastName, phone: phones.mock, password: 'Abcdefg1', confirmPassword: 'Abcdefg1' });
    await profileFormPage.checkRequiredConsents();
    await profileFormPage.street1.pressSequentially('zzzzzz');
    await expect(profileFormPage.addressSuggestions).toHaveCount(0);
    await profileFormPage.expectContinueEnabled(false);
  });

  test('TC-C-10 @customer @regression @negative each required consent left unchecked keeps Continue disabled', async ({ profileFormPage }) => {
    await fillValidProfile(profileFormPage);
    await profileFormPage.expectContinueEnabled(true);
    for (const consent of ['electronic', 'terms', 'textMessaging'] as Consent[]) {
      await profileFormPage.uncheckConsent(consent);
      await profileFormPage.expectConsentChecked(consent, false);
      await profileFormPage.expectContinueEnabled(false);
      await profileFormPage.checkConsent(consent);
      await profileFormPage.expectContinueEnabled(true);
    }
  });

  test('TC-C-10 @customer @regression Marketing consent is optional: Continue is enabled with and without it', async ({ profileFormPage }) => {
    await fillValidProfile(profileFormPage);
    await profileFormPage.expectConsentChecked('marketing', false);
    await profileFormPage.expectContinueEnabled(true);
    await profileFormPage.checkConsent('marketing');
    await profileFormPage.expectContinueEnabled(true);
    await profileFormPage.uncheckAllConsents();
    await profileFormPage.expectContinueEnabled(false);
    await profileFormPage.checkAllConsents();
    await profileFormPage.expectContinueEnabled(true);
  });

  for (const missing of ['firstName', 'lastName', 'phone'] as const) {
    test(`TC-C-09 @customer @regression @negative only the empty mandatory field "${missing}" is flagged and Continue stays disabled`, async ({ profileFormPage }) => {
      await profileFormPage.fillProfile({
        firstName: missing === 'firstName' ? undefined : mockUser.firstName,
        lastName: missing === 'lastName' ? undefined : mockUser.lastName,
        phone: missing === 'phone' ? undefined : phones.mock,
        password: 'Abcdefg1',
        confirmPassword: 'Abcdefg1',
      });
      await profileFormPage.chooseLastAddressSuggestion(addressQuery);
      await profileFormPage.checkRequiredConsents();
      const field = { firstName: profileFormPage.firstName, lastName: profileFormPage.lastName, phone: profileFormPage.mobilePhone }[missing];
      await profileFormPage.touch(field);
      await expect(profileFormPage.fieldErrors).toHaveCount(1);
      await expect(profileFormPage.fieldErrors).toHaveText(messages.requiredField);
      await profileFormPage.expectContinueEnabled(false);
    });
  }

  test('TC-C-19 @customer @regression the "Required field" error clears once the field is corrected', async ({ profileFormPage }) => {
    await profileFormPage.touch(profileFormPage.firstName);
    await profileFormPage.expectFieldError('firstName', messages.requiredField);
    await profileFormPage.firstName.fill(mockUser.firstName);
    await expect(profileFormPage.fieldError('firstName')).toHaveCount(0);
  });

  test('TC-C-14 @customer @regression @negative phone "123" shows the 10-digit error; a valid 10-digit number is accepted', async ({ profileFormPage }) => {
    await profileFormPage.mobilePhone.pressSequentially(phones.invalid);
    await profileFormPage.touch(profileFormPage.mobilePhone);
    await profileFormPage.expectFieldError('phoneNumber', messages.invalidPhone);
    await profileFormPage.mobilePhone.clear();
    await profileFormPage.mobilePhone.pressSequentially(phones.mock);
    await profileFormPage.touch(profileFormPage.mobilePhone);
    await expect(profileFormPage.fieldError('phoneNumber')).toHaveCount(0);
  });

  test('TC-C-14 @customer @regression @negative letters never end up as a valid phone number', async ({ profileFormPage }) => {
    await profileFormPage.mobilePhone.pressSequentially('abcdefghij');
    await profileFormPage.touch(profileFormPage.mobilePhone);
    const value = await profileFormPage.mobilePhone.inputValue();
    expect(value).not.toMatch(/[a-z]/i); // masked to digits, otherwise the error must show
    if (value.replace(/\D/g, '').length < 10) {
      await profileFormPage.expectAnyErrorShown(/Required field|valid 10-digit/);
    }
  });

  test('TC-C-16 @customer @regression @negative apostrophes and hyphens are accepted; script-like input never executes', async ({ page, profileFormPage }) => {
    let dialogs = 0;
    page.on('dialog', (d) => {
      dialogs += 1;
      void d.dismiss();
    });
    await profileFormPage.fillProfile({ firstName: "O'Neil", lastName: 'Anne-Marie' });
    await profileFormPage.touch(profileFormPage.lastName);
    await expect(profileFormPage.fieldErrors.filter({ hasText: messages.requiredField })).toHaveCount(0);
    await profileFormPage.firstName.fill('<script>alert(1)</script>');
    await profileFormPage.touch(profileFormPage.firstName);
    await profileFormPage.touch(profileFormPage.lastName);
    expect(dialogs).toBe(0);
    await expect(profileFormPage.firstName).toBeVisible();
  });
});
