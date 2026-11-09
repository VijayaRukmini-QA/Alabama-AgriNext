import { type Locator, type Page, expect } from '@playwright/test';
import { Toast } from './Toast';

export type ProfileFields = {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  street2?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
};

/** Input ids used for the `<id>-field-error` test ids. */
export type FieldId =
  | 'firstName'
  | 'lastName'
  | 'address'
  | 'phoneNumber'
  | 'password'
  | 'confirmPassword'
  | (string & {});

export type Consent = 'electronic' | 'terms' | 'textMessaging' | 'marketing';

const CONSENT_IDS: Record<Consent, string> = {
  electronic: 'ConsentToDoBusinessElectronically-checkbox', // required
  terms: 'TermsOfUse-checkbox', // required
  textMessaging: 'OptInForTextMessaging-checkbox', // required
  marketing: 'MarketingMessaging-checkbox', // optional
};
const REQUIRED_CONSENTS: Consent[] = ['electronic', 'terms', 'textMessaging'];
const ALL_CONSENTS: Consent[] = [...REQUIRED_CONSENTS, 'marketing'];

/** Profile form `/sign-up` (reached after the email code step). */
export class SignUpProfileFormPage {
  constructor(protected readonly page: Page) {}

  // text fields (accessible names from the findings)
  readonly firstName = this.page.getByRole('textbox', { name: 'First Name' });
  readonly middleName = this.page.getByRole('textbox', { name: 'Middle Name' });
  readonly lastName = this.page.getByRole('textbox', { name: 'Last Name' });
  readonly suffix = this.page.getByRole('textbox', { name: 'Suffix' });
  readonly email = this.page.getByRole('textbox', { name: 'Email', exact: true }); // disabled, prefilled
  readonly street1 = this.page.getByRole('textbox', { name: 'Street 1' });
  readonly street2 = this.page.getByRole('textbox', { name: 'Street 2' });
  readonly city = this.page.getByRole('textbox', { name: 'City' });
  readonly state = this.page.getByRole('textbox', { name: 'State' });
  readonly zipCode = this.page.getByRole('textbox', { name: 'Zip Code' });
  readonly county = this.page.getByRole('textbox', { name: 'County' }); // disabled until an address is selected
  readonly mobilePhone = this.page.getByRole('textbox', { name: 'Mobile Phone Number' });
  readonly password = this.page.getByRole('textbox', { name: 'Create password' });
  readonly confirmPassword = this.page.getByRole('textbox', { name: 'Confirm password' });

  // password toggles
  readonly showPasswordButton = this.page.getByRole('button', { name: 'Show password', exact: true });
  readonly hidePasswordButton = this.page.getByRole('button', { name: 'Hide password', exact: true });
  readonly showConfirmPasswordButton = this.page.getByRole('button', { name: 'Show confirm password' });
  readonly hideConfirmPasswordButton = this.page.getByRole('button', { name: 'Hide confirm password' });

  // address suggestions (Google Places; no listbox/option roles and duplicate ids, F-13)
  readonly addressSuggestions = this.page
    .getByTestId('suggestions_list')
    .locator('li[id="address-suggestion-item"]');

  // feedback
  readonly fieldErrors = this.page.getByTestId('error_text');
  readonly continueButton = this.page.getByRole('button', { name: 'Continue' });
  readonly toast = new Toast(this.page.locator('body'));

  /** Consent checkboxes have no accessible name (F-13): located by id as the findings prescribe. */
  consentCheckbox(consent: Consent): Locator {
    return this.page.locator(`[id="${CONSENT_IDS[consent]}"]`);
  }

  /**
   * Per-field error. FIX: the `<field>-field-error` test id does not exist in the app. Only `error_text` does, so the
   * error is located as the one inside the innermost container that holds both the field's input and an error_text.
   */
  fieldError(field: FieldId): Locator {
    const input = field === 'phoneNumber' ? this.mobilePhone : this.page.getByTestId(`${field}-field-input`);
    return this.page
      .locator('div')
      .filter({ has: input })
      .filter({ has: this.fieldErrors })
      .last()
      .getByTestId('error_text');
  }

  async waitUntilReady(): Promise<void> {
    await expect(this.firstName).toBeVisible();
  }

  async fillProfile(fields: ProfileFields): Promise<void> {
    if (fields.firstName !== undefined) await this.firstName.fill(fields.firstName);
    if (fields.middleName !== undefined) await this.middleName.fill(fields.middleName);
    if (fields.lastName !== undefined) await this.lastName.fill(fields.lastName);
    if (fields.suffix !== undefined) await this.suffix.fill(fields.suffix);
    if (fields.street2 !== undefined) await this.street2.fill(fields.street2);
    // phone is typed key by key (as in the exploration)
    if (fields.phone !== undefined) await this.mobilePhone.pressSequentially(fields.phone);
    if (fields.password !== undefined) await this.password.fill(fields.password);
    if (fields.confirmPassword !== undefined) await this.confirmPassword.fill(fields.confirmPassword);
  }

  /** Types into Street 1, waits for Google suggestions, picks the LAST one (autofills city/state/zip/county). */
  async chooseLastAddressSuggestion(query: string): Promise<void> {
    await this.street1.click();
    await this.street1.pressSequentially(query, { delay: 60 });
    await expect(this.addressSuggestions.last()).toBeVisible({ timeout: 15_000 });
    await this.addressSuggestions.last().click();
    await expect(this.city).not.toHaveValue('');
  }

  async checkConsent(consent: Consent): Promise<void> {
    await this.consentCheckbox(consent).check({ force: true }); // custom-styled input
  }

  async uncheckConsent(consent: Consent): Promise<void> {
    await this.consentCheckbox(consent).uncheck({ force: true });
  }

  async checkRequiredConsents(): Promise<void> {
    for (const c of REQUIRED_CONSENTS) await this.checkConsent(c);
  }

  async checkAllConsents(): Promise<void> {
    for (const c of ALL_CONSENTS) await this.checkConsent(c);
  }

  async uncheckAllConsents(): Promise<void> {
    for (const c of ALL_CONSENTS) await this.uncheckConsent(c);
  }

  async showPassword(): Promise<void> {
    await this.showPasswordButton.click();
  }

  async hidePassword(): Promise<void> {
    await this.hidePasswordButton.click();
  }

  async showConfirmPassword(): Promise<void> {
    await this.showConfirmPasswordButton.click();
  }

  async hideConfirmPassword(): Promise<void> {
    await this.hideConfirmPasswordButton.click();
  }

  /** Focus then leave a field so its validation message appears. */
  async touch(field: Locator): Promise<void> {
    await field.focus();
    await field.blur();
  }

  async submit(): Promise<void> {
    await this.continueButton.click();
  }

  async errorTextOf(field: FieldId): Promise<string> {
    return (await this.fieldError(field).innerText()).trim();
  }

  async expectContinueEnabled(enabled: boolean): Promise<void> {
    if (enabled) await expect(this.continueButton).toBeEnabled();
    else await expect(this.continueButton).toBeDisabled();
  }

  async expectFieldError(field: FieldId, message: string | RegExp): Promise<void> {
    await expect(this.fieldError(field)).toContainText(message);
  }

  async expectAnyErrorShown(message: string | RegExp): Promise<void> {
    await expect(this.fieldErrors.filter({ hasText: message }).first()).toBeVisible();
  }

  async expectConsentChecked(consent: Consent, checked: boolean): Promise<void> {
    if (checked) await expect(this.consentCheckbox(consent)).toBeChecked();
    else await expect(this.consentCheckbox(consent)).not.toBeChecked();
  }

  async expectPasswordMasked(masked: boolean): Promise<void> {
    await expect(this.password).toHaveAttribute('type', masked ? 'password' : 'text');
  }

  async expectConfirmPasswordMasked(masked: boolean): Promise<void> {
    await expect(this.confirmPassword).toHaveAttribute('type', masked ? 'password' : 'text');
  }

  async expectEmailPrefilled(email: string): Promise<void> {
    await expect(this.email).toBeDisabled();
    await expect(this.email).toHaveValue(email);
  }
}
