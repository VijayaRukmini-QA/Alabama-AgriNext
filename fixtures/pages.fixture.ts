import { test as base } from '@playwright/test';
import { AppEntryPage } from '../pages/AppEntryPage';
import { MicrosoftSignInEmailPage } from '../pages/MicrosoftSignInEmailPage';
import { MicrosoftSignInPasswordPage } from '../pages/MicrosoftSignInPasswordPage';
import { PasswordResetPage } from '../pages/PasswordResetPage';
import { LenderHomePage } from '../pages/LenderHomePage';

type Pages = {
  appEntryPage: AppEntryPage;
  emailPage: MicrosoftSignInEmailPage;
  passwordPage: MicrosoftSignInPasswordPage;
  passwordResetPage: PasswordResetPage;
  lenderHomePage: LenderHomePage;
};

export const test = base.extend<Pages>({
  appEntryPage: async ({ page }, use) => use(new AppEntryPage(page)),
  emailPage: async ({ page }, use) => use(new MicrosoftSignInEmailPage(page)),
  passwordPage: async ({ page }, use) => use(new MicrosoftSignInPasswordPage(page)),
  passwordResetPage: async ({ page }, use) => use(new PasswordResetPage(page)),
  lenderHomePage: async ({ page }, use) => use(new LenderHomePage(page)),
});

export { expect } from '@playwright/test';
