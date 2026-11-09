import { type Page, expect } from '@playwright/test';
import { Toast } from './Toast';

/** Profile form, SMS (MFA) step on `/sign-up`: 6-digit code, button "Complete Profile". */
export class SmsVerificationStepPage {
  constructor(protected readonly page: Page) {}

  /** Only the first of 6 boxes is named (F-13). */
  readonly firstCodeBox = this.page.getByRole('textbox', { name: 'Enter Verification Code below:' });
  readonly completeProfileButton = this.page.getByRole('button', { name: 'Complete Profile' });
  /** A span, not a button or link (F-13). */
  readonly resendCode = this.page.getByText('Resend code');
  /** Unnamed icon button: id locator is the only option (F-13). */
  readonly backButton = this.page.locator('#go-back-button');
  readonly toast = new Toast(this.page.locator('body'));

  async enterCode(code: string): Promise<void> {
    await this.firstCodeBox.click();
    await this.page.keyboard.type(code);
  }

  async completeProfile(code: string): Promise<void> {
    await this.enterCode(code);
    await this.completeProfileButton.click();
  }

  async requestNewCode(): Promise<void> {
    await this.resendCode.click();
  }

  async goBack(): Promise<void> {
    await this.backButton.click();
  }

  async enteredCode(): Promise<string> {
    const values = await this.page
      .locator('input[inputmode="numeric"]')
      .evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
    return values.join('');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.firstCodeBox).toBeVisible({ timeout: 20_000 });
    await expect(this.completeProfileButton).toBeVisible();
  }

  async expectCompleteEnabled(enabled: boolean): Promise<void> {
    if (enabled) await expect(this.completeProfileButton).toBeEnabled();
    else await expect(this.completeProfileButton).toBeDisabled();
  }
}
