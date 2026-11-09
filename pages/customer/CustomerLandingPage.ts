import { type Page, expect } from '@playwright/test';

/** Customer portal landing `/`. */
export class CustomerLandingPage {
  constructor(protected readonly page: Page) {}

  readonly signInButton = this.page.getByRole('button', { name: 'Sign in' });
  readonly createProfileButton = this.page.getByRole('button', { name: 'Create profile' });

  async open(): Promise<void> {
    await this.page.goto('/');
    await expect(this.createProfileButton).toBeVisible();
  }

  async startCreateProfile(): Promise<void> {
    await this.createProfileButton.click();
  }

  async startSignIn(): Promise<void> {
    await this.signInButton.click();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.signInButton).toBeVisible();
    await expect(this.createProfileButton).toBeVisible();
  }
}
