import { type Page, expect } from '@playwright/test';
import { Toast } from './Toast';

/** Create profile, step 1 `/create-profile`: email entry. */
export class CreateProfileEmailStepPage {
  constructor(protected readonly page: Page) {}

  readonly heading = this.page.getByRole('heading', { name: 'Welcome to the Alabama Ag Credit Customer Portal' });
  readonly email = this.page.getByRole('textbox', { name: 'To create a profile, enter your email address.' });
  readonly sendCodeButton = this.page.getByRole('button', { name: 'Send verification code' });
  readonly signInLink = this.page.getByRole('link', { name: 'Sign in' });
  /** Inline validation text; shown on blur (not announced, F-04). */
  readonly inlineError = this.page.getByTestId('error_text');
  readonly toast = new Toast(this.page.locator('body'));

  async open(): Promise<void> {
    await this.page.goto('/create-profile');
    await expect(this.heading).toBeVisible();
  }

  async enterEmail(email: string): Promise<void> {
    await this.email.fill(email);
  }

  /** Types the email and moves focus away so validation runs. */
  async enterEmailAndBlur(email: string): Promise<void> {
    await this.email.fill(email);
    await this.email.blur();
  }

  async requestCode(email: string): Promise<void> {
    await this.email.fill(email);
    await this.sendCodeButton.click();
  }

  async goToSignIn(): Promise<void> {
    await this.signInLink.click();
  }

  async emailValue(): Promise<string> {
    return this.email.inputValue();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.email).toBeVisible();
    await expect(this.sendCodeButton).toBeVisible();
  }

  async expectSendCodeEnabled(enabled: boolean): Promise<void> {
    if (enabled) await expect(this.sendCodeButton).toBeEnabled();
    else await expect(this.sendCodeButton).toBeDisabled();
  }

  async expectInlineError(message: string | RegExp): Promise<void> {
    await expect(this.inlineError.filter({ hasText: message })).toBeVisible();
  }
}
