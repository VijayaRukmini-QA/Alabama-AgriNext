import { emailOfLength, uniqueEmail } from '../utils/uniqueEmail';

/** Exact Microsoft Entra messages observed 2026-11-06. */
export const messages = {
  emptyEmail: /Enter a valid email address, phone number, or Skype name\./,
  accountNotFound: /We couldn't find an account with that username\./,
  emptyPassword: /Please enter your password\./,
  wrongPassword: /Your account or password is incorrect\./,
};

/** Malformed emails; Entra reports accountNotFound for these (not a format error, F-05). */
export const malformedEmails: readonly string[] = [
  'notanemail',
  'missing-at.agrinextqa-nodomain-test.com',
  '@agrinextqa-nodomain-test.com',
  'user@',
  'user name@agrinextqa-nodomain-test.com',
];

export const whitespaceCases = {
  /** Trimmed by Entra; proceeds to password step (F-09). */
  pad: (email: string): string => `   ${email}   `,
  upper: (email: string): string => email.toUpperCase(),
};

export const EMAIL_MAXLENGTH = 113;
export const longEmail = emailOfLength(EMAIL_MAXLENGTH);
export const overLongEmail = emailOfLength(EMAIL_MAXLENGTH + 20);

export const nonExistentEmail = (): string => uniqueEmail();

/** Dummy password for wrong-password / UI-only checks. Not a real credential. */
export const dummyPassword = 'Dummy-Not-A-Real-Pw-1!';
export const longPassword = 'A'.repeat(1000);

export const urls = {
  entra: /login\.microsoftonline\.com/,
  passwordReset: /passwordreset\.microsoftonline\.com/,
};
