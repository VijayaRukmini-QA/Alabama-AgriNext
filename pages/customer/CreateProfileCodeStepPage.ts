import { type Page, expect } from '@playwright/test';
import { Toast } from './Toast';

/** Create profile, step 2 `/create-profile`: 8-digit email code. */
export class CreateProfileCodeStepPage {
  constructor(protected readonly page: Page) {}

  readonly heading = this.page.getByRole('heading', { name: 'Check your email' });
  /** Only the first of the 8 OTP boxes has an accessible name (F-03); focus auto-advances. */
  readonly firstCodeBox = this.page.getByRole('textbox', { name: 'Enter verification code' });
  readonly verifyButton = this.page.getByRole('button', { name: 'Verify' });
  readonly changeButton = this.page.getByRole('button', { name: 'Change' });
  readonly resendButton = this.page.getByRole('button', { name: 'Resend code' });
  /** Countdown span "Resend code (30s)": a span, not a button, while the timer runs. */
  readonly resendCountdown = this.page.getByText(/Resend code \(\d+s\)/);
  readonly toast = new Toast(this.page.locator('body'));

  async enterCode(code: string): Promise<void> {
    await this.firstCodeBox.click();
    await this.page.keyboard.type(code);
  }

  async verify(code: string): Promise<void> {
    await this.enterCode(code);
    await this.verifyButton.click();
  }

  async changeEmail(): Promise<void> {
    await this.changeButton.click();
  }

  /** Waits (bounded) for the ~30 s timer to end, then clicks Resend code. */
  async resendCode(timeoutMs = 45_000): Promise<void> {
    await this.resendButton.click({ timeout: timeoutMs });
  }

  /** Concatenated value of all OTP boxes (query). */
  async enteredCode(): Promise<string> {
    const values = await this.page
      .locator('input[inputmode="numeric"]')
      .evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
    return values.join('');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.firstCodeBox).toBeVisible();
  }

  async expectVerifyEnabled(enabled: boolean): Promise<void> {
    if (enabled) await expect(this.verifyButton).toBeEnabled();
    else await expect(this.verifyButton).toBeDisabled();
  }

  async expectResendCountingDown(): Promise<void> {
    await expect(this.resendCountdown).toBeVisible();
  }

  async expectResendAvailable(timeoutMs = 45_000): Promise<void> {
    await expect(this.resendButton).toBeVisible({ timeout: timeoutMs });
  }
}
