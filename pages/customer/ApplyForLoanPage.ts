import { type Page, expect } from '@playwright/test';

/** Post-registration landing `/apply-for-a-loan`. Content never observed (E2E blocked); only the URL is known. */
export class ApplyForLoanPage {
  constructor(protected readonly page: Page) {}

  static readonly urlPattern = /\/apply-for-a-loan/;

  async expectLoaded(timeoutMs = 45_000): Promise<void> {
    await expect(this.page).toHaveURL(ApplyForLoanPage.urlPattern, { timeout: timeoutMs });
  }
}
