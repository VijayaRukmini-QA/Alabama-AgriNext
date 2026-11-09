import { type Page, expect } from '@playwright/test';

/** Microsoft self-service password reset (passwordreset.microsoftonline.com). */
export class PasswordResetPage {
  readonly heading = this.page.getByRole('heading', { name: 'Get back into your account', level: 1 });
  readonly userIdInput = this.page.getByRole('textbox', { name: 'Email or Username' });
  readonly nextButton = this.page.getByRole('button', { name: 'Next' });
  readonly cancelButton = this.page.getByRole('button', { name: 'Cancel' });

  constructor(protected readonly page: Page) {}

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async userIdValue(): Promise<string> {
    return this.userIdInput.inputValue();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/passwordreset\.microsoftonline\.com/, { timeout: 30_000 });
    await expect(this.heading).toBeVisible();
    await expect(this.userIdInput).toBeVisible();
    await expect(this.nextButton).toBeVisible();
    await expect(this.cancelButton).toBeVisible();
  }

  async expectPrefilledWith(email: string): Promise<void> {
    await expect(this.userIdInput).toHaveValue(email);
  }
}
