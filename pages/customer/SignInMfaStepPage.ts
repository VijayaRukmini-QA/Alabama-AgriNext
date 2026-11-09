import { type Page, expect } from '@playwright/test';
import { Toast } from './Toast';

/** MFA (SMS code) step rendered inside `/login` after valid credentials. Only code box 0 has an accessible name (S-F-06). */
export class SignInMfaStepPage {
  constructor(protected readonly page: Page) {}

  readonly heading = this.page.getByRole('heading', { name: 'Multi-factor authentication' });
  /** "We sent a text message to •••• 89." (observed with mocks). */
  readonly smsStatement = this.page.getByText(/We sent a text message to/);
  readonly codeBox = this.page.getByRole('textbox', { name: 'Enter verification code' });
  /** All six boxes. Only box 0 has an id/label; boxes 2 to 6 have neither, so they are located by input mode (S-F-06). */
  readonly allCodeBoxes = this.page.locator('input[inputmode="numeric"]');
  readonly verifyButton = this.page.getByRole('button', { name: 'Verify code' });
  readonly cancelButton = this.page.getByRole('button', { name: 'Cancel' });
  readonly resendButton = this.page.getByRole('button', { name: 'Resend code' });
  /** The countdown is a plain span, not a button, until the timer ends (S-F-07). */
  readonly resendCountdown = this.page.getByText(/Resend code \(\d+s\)/);
  readonly toast = new Toast(this.page.locator('body'));

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.verifyButton).toBeVisible();
  }

  /** Click box 0, then type; the component auto-advances between boxes. */
  async enterCode(code: string): Promise<void> {
    await this.codeBox.click();
    await this.page.keyboard.type(code);
  }

  async verify(code: string): Promise<void> {
    await this.enterCode(code);
    await this.verifyButton.click();
  }

  async pressEnterToSubmit(): Promise<void> {
    await this.page.keyboard.press('Enter');
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /** Waits for the ~30 s timer to turn the span into a button, then clicks it. */
  async resendCode(): Promise<void> {
    await this.resendButton.click({ timeout: 45_000 });
  }

  /** Query: the digits currently in the six boxes. */
  async enteredCode(): Promise<string> {
    const values = await this.allCodeBoxes.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
    return values.join('');
  }

  async expectVerifyEnabled(enabled: boolean): Promise<void> {
    if (enabled) await expect(this.verifyButton).toBeEnabled();
    else await expect(this.verifyButton).toBeDisabled();
  }

  async expectResendCountingDown(): Promise<void> {
    await expect(this.resendCountdown).toBeVisible();
    await expect(this.resendButton).toHaveCount(0);
  }

  async expectResendAvailable(): Promise<void> {
    await expect(this.resendButton).toBeVisible({ timeout: 45_000 });
  }

  async expectCodeCleared(): Promise<void> {
    await expect.poll(() => this.enteredCode()).toBe('');
  }
}
