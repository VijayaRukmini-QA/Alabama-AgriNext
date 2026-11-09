import { type Page, expect } from '@playwright/test';
import { Toast } from './Toast';

/** Forgot password `/forgot-password`. */
export class CustomerForgotPasswordPage {
  constructor(protected readonly page: Page) {}

  readonly heading = this.page.getByRole('heading', { name: 'Reset your password' });
  readonly email = this.page.getByRole('textbox', { name: 'Enter your email address' });
  readonly sendCodeButton = this.page.getByRole('button', { name: 'Send verification code' });
  readonly backToSignInButton = this.page.getByRole('button', { name: 'Sign in' });
  readonly toast = new Toast(this.page.locator('body'));

  async open(): Promise<void> {
    await this.page.goto('/forgot-password');
    await expect(this.heading).toBeVisible();
  }

  async requestCode(email: string): Promise<void> {
    await this.email.fill(email);
    await this.sendCodeButton.click();
  }

  async backToSignIn(): Promise<void> {
    await this.backToSignInButton.click();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.email).toBeVisible();
  }
}
