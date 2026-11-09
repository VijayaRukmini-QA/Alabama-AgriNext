import { type Page, expect } from '@playwright/test';

/** Microsoft Entra password step. */
export class MicrosoftSignInPasswordPage {
  readonly heading = this.page.getByRole('heading', { name: 'Enter password' });
  readonly passwordInput = this.page.getByRole('textbox', { name: /Enter the password/ });
  readonly signInButton = this.page.getByRole('button', { name: 'Sign in' });
  readonly forgotPasswordLink = this.page.getByRole('link', { name: 'Forgot my password' });
  readonly backButton = this.page.getByRole('button', { name: 'Back' });
  readonly error = this.page.getByRole('alert');
  /**
   * OPTIONAL: no show/hide toggle exists on Entra as of 2026-11-06 (F-08).
   * Locator is a best guess; use hasPasswordToggle() to gate the conditional test.
   */
  readonly passwordToggle = this.page.getByRole('checkbox', { name: /show password/i });

  constructor(protected readonly page: Page) {}

  async waitUntilReady(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 30_000 });
  }

  async enterPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async submitPassword(password: string): Promise<void> {
    await this.enterPassword(password);
    await this.signInButton.click();
  }

  async submitPasswordWithEnter(password: string): Promise<void> {
    await this.enterPassword(password);
    await this.passwordInput.press('Enter');
  }

  async submitEmptyPassword(): Promise<void> {
    await this.passwordInput.clear();
    await this.signInButton.click();
  }

  async startPasswordRecovery(): Promise<void> {
    await this.forgotPasswordLink.click();
  }

  async goBackToEmailStep(): Promise<void> {
    await this.backButton.click();
  }

  /** Entra echoes the entered email on the password step. */
  async expectEmailDisplayed(email: string): Promise<void> {
    await expect(this.page.getByText(email, { exact: true }).first()).toBeVisible();
  }

  async hasPasswordToggle(): Promise<boolean> {
    return (await this.passwordToggle.count()) > 0;
  }

  async passwordInputType(): Promise<string | null> {
    return this.passwordInput.getAttribute('type');
  }

  async errorText(): Promise<string> {
    return (await this.error.first().textContent())?.trim() ?? '';
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.signInButton).toBeVisible();
    await expect(this.forgotPasswordLink).toBeVisible();
    await expect(this.backButton).toBeVisible();
  }

  async expectError(message: string | RegExp): Promise<void> {
    await expect(this.error).toContainText(message);
  }

  async expectPasswordMasked(): Promise<void> {
    await expect(this.passwordInput).toHaveAttribute('type', 'password');
  }
}
