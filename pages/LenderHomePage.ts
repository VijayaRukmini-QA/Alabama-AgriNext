import { type Page, expect } from '@playwright/test';
import { BASE_URL } from '../config/env';

/**
 * UNVERIFIED PLACEHOLDER: post-login landing could not be explored (credentials rejected, F-01).
 * Replace locators once a working account is available.
 */
export class LenderHomePage {
  /** UNVERIFIED: Entra "Stay signed in?" prompt (not observed). */
  readonly staySignedInNoButton = this.page.getByRole('button', { name: 'No' });
  /** UNVERIFIED: main landmark of the app shell. */
  readonly main = this.page.getByRole('main');
  /** UNVERIFIED: logout control name is a guess. */
  readonly logoutControl = this.page.getByRole('button', { name: /sign out|log ?out/i });

  constructor(protected readonly page: Page) {}

  /** Dismiss the optional "Stay signed in?" prompt if it shows up. */
  async dismissStaySignedInIfShown(): Promise<void> {
    if (await this.staySignedInNoButton.isVisible()) await this.staySignedInNoButton.click();
  }

  async signOut(): Promise<void> {
    await this.logoutControl.click();
  }

  /** UNVERIFIED heuristic: back on the app origin, off Microsoft. */
  async expectLoaded(): Promise<void> {
    const origin = new URL(BASE_URL).origin;
    await expect(this.page).toHaveURL((url) => url.origin === origin, { timeout: 60_000 });
    await expect(this.page).not.toHaveURL(/login\.microsoftonline\.com/);
  }
}
