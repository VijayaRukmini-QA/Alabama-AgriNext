import { type Locator, type Page, expect } from '@playwright/test';

/**
 * Signed-out public page the customer portal shows at the loan routes (`/apply-for-a-loan`,
 * `/loan-application-creation/loan-information`). No redirect, no loan form (observed live).
 *
 * The accessible names are "Sign in" / "Create profile"; the UI renders them uppercase through CSS,
 * so the locators match case-insensitively and exactly (no substring hits).
 */
export class PublicLoanGatePage {
  constructor(protected readonly page: Page) {}

  readonly signInButton = this.page.getByRole('button', { name: /^sign in$/i });
  readonly createProfileButton = this.page.getByRole('button', { name: /^create profile$/i });

  /** Anything a loan application form would add: inputs, selects, textareas, comboboxes, radios. */
  private readonly formControls = this.page.locator('input, select, textarea, [role="combobox"], [role="radio"], [role="checkbox"]');

  async open(path: string): Promise<void> {
    await this.page.goto(path);
    await expect(this.signInButton).toBeVisible();
  }

  async expectPublicGate(): Promise<void> {
    await expect(this.signInButton).toHaveCount(1);
    await expect(this.createProfileButton).toHaveCount(1);
    await expect(this.signInButton).toBeVisible();
    await expect(this.createProfileButton).toBeVisible();
  }

  async expectNoLoanForm(): Promise<void> {
    await expect(this.formControls).toHaveCount(0);
    await expect(this.page.getByText('Purchase or refinance?')).toHaveCount(0);
    await expect(this.page.getByText('How many acres?')).toHaveCount(0);
    await expect(this.page.getByRole('button', { name: /^continue$/i })).toHaveCount(0);
  }

  async goToSignIn(): Promise<void> {
    await this.signInButton.click();
  }

  async goToCreateProfile(): Promise<void> {
    await this.createProfileButton.click();
  }

  /** Presses Tab (max `limit` times) until `target` owns focus. Fails if it is never reached. */
  async tabUntilFocused(target: Locator, limit = 15): Promise<void> {
    for (let i = 0; i < limit; i += 1) {
      await this.page.keyboard.press('Tab');
      if (await target.evaluate((el) => el === document.activeElement)) return;
    }
    throw new Error(`Control not reached by keyboard within ${limit} Tab presses`);
  }

  /** Path + query of the current URL (for observations). */
  currentPathAndQuery(): string {
    const u = new URL(this.page.url());
    return u.pathname + u.search;
  }
}
