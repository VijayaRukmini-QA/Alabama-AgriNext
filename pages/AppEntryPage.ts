import { type Page, expect } from '@playwright/test';
import { BASE_URL } from '../config/env';
import { urls } from '../test-data/login.data';

/** App root: transient logo, then redirect to Microsoft Entra (~7-10 s). */
export class AppEntryPage {
  constructor(protected readonly page: Page) {}

  /** Navigate to the app and wait for the Entra redirect. */
  async openAndAwaitSignIn(): Promise<void> {
    await this.page.goto(BASE_URL);
    await this.page.waitForURL(urls.entra, { timeout: 45_000 });
  }

  async expectRedirectedToMicrosoft(): Promise<void> {
    await expect(this.page).toHaveURL(urls.entra);
  }
}
