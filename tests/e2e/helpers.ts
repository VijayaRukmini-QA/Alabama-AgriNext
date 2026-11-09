import { type AppEntryPage } from '../../pages/AppEntryPage';
import { type MicrosoftSignInEmailPage } from '../../pages/MicrosoftSignInEmailPage';
import { type MicrosoftSignInPasswordPage } from '../../pages/MicrosoftSignInPasswordPage';
import { getLenderEmail } from '../../config/env';

export const REAL_LOGIN_SKIP_REASON =
  'Blocked: real-account credentials rejected by Entra (F-01); set RUN_REAL_LOGIN=1 once fixed';

/** Open app, wait for the email step. */
export async function openEmailStep(appEntryPage: AppEntryPage, emailPage: MicrosoftSignInEmailPage): Promise<void> {
  await appEntryPage.openAndAwaitSignIn();
  await emailPage.waitUntilReady();
}

/**
 * Reach the password step with the real email. Only the email is submitted;
 * no password is ever submitted here (not a credential attempt).
 */
export async function openPasswordStep(
  appEntryPage: AppEntryPage,
  emailPage: MicrosoftSignInEmailPage,
  passwordPage: MicrosoftSignInPasswordPage,
): Promise<string> {
  const email = getLenderEmail();
  await openEmailStep(appEntryPage, emailPage);
  await emailPage.submitEmail(email);
  await passwordPage.waitUntilReady();
  return email;
}
