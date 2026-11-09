import { type Page, expect } from '@playwright/test';
import { Toast } from './Toast';

/** Sign in `/login`. */
export class CustomerLoginPage {
  constructor(protected readonly page: Page) {}

  readonly email = this.page.getByRole('textbox', { name: 'Email address' });
  readonly password = this.page.getByRole('textbox', { name: 'Password' });
  readonly showPasswordButton = this.page.getByRole('button', { name: 'Show password' });
  readonly hidePasswordButton = this.page.getByRole('button', { name: 'Hide password' });
  readonly signInButton = this.page.getByRole('button', { name: 'Sign in' });
  readonly forgotPasswordButton = this.page.getByRole('button', { name: 'Forgot password?' }); // a button, not a link (F-06)
  readonly createOneLink = this.page.getByRole('link', { name: 'Create one' });
  readonly toast = new Toast(this.page.locator('body'));

  async open(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.signInButton).toBeVisible();
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password);
    await this.signInButton.click();
  }

  async showPassword(): Promise<void> {
    await this.showPasswordButton.click();
  }

  async hidePassword(): Promise<void> {
    await this.hidePasswordButton.click();
  }

  async goToForgotPassword(): Promise<void> {
    await this.forgotPasswordButton.click();
  }

  async goToCreateProfile(): Promise<void> {
    await this.createOneLink.click();
  }

  async expectSignInEnabled(enabled: boolean): Promise<void> {
    if (enabled) await expect(this.signInButton).toBeEnabled();
    else await expect(this.signInButton).toBeDisabled();
  }

  async expectPasswordMasked(masked: boolean): Promise<void> {
    await expect(this.password).toHaveAttribute('type', masked ? 'password' : 'text');
  }

  async pressEnterToSubmit(): Promise<void> {
    await this.page.keyboard.press('Enter');
  }

  async expectEmailValue(value: string): Promise<void> {
    await expect(this.email).toHaveValue(value);
  }

  async expectPasswordValue(value: string): Promise<void> {
    await expect(this.password).toHaveValue(value);
  }

  /** While submitting the inputs are disabled and the button reads "Signing in…". */
  async expectSubmitting(): Promise<void> {
    await expect(this.page.getByRole('button', { name: /Signing in/ })).toBeVisible();
    await expect(this.email).toBeDisabled();
  }

  async expectOnLoginForm(): Promise<void> {
    await expect(this.signInButton).toBeVisible();
  }
}
