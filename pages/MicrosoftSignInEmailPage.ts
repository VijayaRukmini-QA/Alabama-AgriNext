import { type Page, expect } from '@playwright/test';

/** Microsoft Entra email step. */
export class MicrosoftSignInEmailPage {
  readonly heading = this.page.getByRole('heading', { name: 'Sign in', level: 1 });
  readonly emailInput = this.page.getByRole('textbox', { name: /Enter your email/ });
  readonly nextButton = this.page.getByRole('button', { name: 'Next' });
  readonly cantAccessLink = this.page.getByRole('link', { name: /access your account/ });
  readonly signInOptionsButton = this.page.getByRole('button', { name: 'Sign-in options' });
  readonly termsLink = this.page.getByRole('link', { name: 'Terms of use' });
  readonly privacyLink = this.page.getByRole('link', { name: /Privacy & cookies/ });
  readonly error = this.page.getByRole('alert');
  /** Entra's alert live region can have a zero height (floated children), so visibility is asserted on the message element inside it. */
  readonly inlineErrorText = this.error.getByText(/Enter a valid email address, phone number, or Skype name\./);
  /** Entra interstitial for unresolvable usernames (shown instead of an inline error for some inputs). */
  readonly accountPicker = this.page.getByText(/We're having trouble locating your account/);

  constructor(protected readonly page: Page) {}

  async waitUntilReady(): Promise<void> {
    await expect(this.emailInput).toBeVisible({ timeout: 30_000 });
  }

  async enterEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async submitEmail(email: string): Promise<void> {
    await this.enterEmail(email);
    await this.nextButton.click();
  }

  async submitEmailWithEnter(email: string): Promise<void> {
    await this.enterEmail(email);
    await this.emailInput.press('Enter');
  }

  async submitEmptyEmail(): Promise<void> {
    await this.emailInput.clear();
    await this.nextButton.click();
  }

  async emailValue(): Promise<string> {
    return this.emailInput.inputValue();
  }

  async emailMaxLength(): Promise<number | null> {
    const v = await this.emailInput.getAttribute('maxlength');
    return v === null ? null : Number(v);
  }

  async errorText(): Promise<string> {
    return (await this.error.first().textContent())?.trim() ?? '';
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.nextButton).toBeVisible();
    await expect(this.cantAccessLink).toBeVisible();
    await expect(this.signInOptionsButton).toBeVisible();
  }

  async expectError(message: string | RegExp): Promise<void> {
    await expect(this.error).toContainText(message);
  }

  async expectStillOnEmailStep(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
  }
}
