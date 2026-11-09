import { type Locator, expect } from '@playwright/test';

/** Error/notification toast (role=alert). Auto-dismisses (F-05), so assert promptly. */
export class Toast {
  constructor(private readonly root: Locator) {}

  readonly alert = this.root.getByRole('alert');

  async text(): Promise<string> {
    return (await this.alert.first().innerText()).trim();
  }

  async expectMessage(message: string | RegExp): Promise<void> {
    await expect(this.alert.filter({ hasText: message })).toBeVisible();
  }

  async expectNone(): Promise<void> {
    await expect(this.alert).toHaveCount(0);
  }
}
