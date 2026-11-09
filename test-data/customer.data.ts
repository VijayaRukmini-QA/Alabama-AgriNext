/** Non-secret customer test data. Real credentials come from config/env.ts getters, never from here. */

export const malformedEmails: readonly string[] = ['abc', 'abc@', 'a@b', 'a b@c.com'];

/** Invalid passwords are synthetic, never derived from the real one. */
export const invalidPasswords = {
  tooShort: 'Ab1',
  noUppercase: 'abcdefg1',
  noLowercase: 'ABCDEFG1',
  noNumber: 'Abcdefgh',
} as const;

/** Valid synthetic password built at runtime (meets: 8+ chars, upper, lower, number). */
export function syntheticValidPassword(): string {
  return `Qa${Date.now().toString(36)}x9Z`;
}

export const phones = {
  invalid: '123',
  allZeros: '0000000000', // accepted by the app (F-11)
  mock: '2055550100', // 555 fictional number, mocked tests only
} as const;

export const addressQuery = 'Alabama';

/** Synthetic names for mocked tests. */
export const mockUser = { firstName: 'QA', lastName: 'Mockuser' } as const;

export const wrongCodes = { email: '00000000', sms: '000000' } as const;

export const smsSender = 'Alabama Ag Credit';

/** Exact messages observed 2026-11-09 (see docs/EXPLORATORY-FINDINGS-Create-Customer-Profile.md). */
export const messages = {
  invalidEmail: 'Invalid email',
  invalidEmailCode:
    'Code is invalid. Please check the verification code and re-enter or click Resend Code.',
  invalidLogin: 'Invalid email or password.',
  accountNotFound: "We couldn't find an account with this email address.",
  requiredField: 'Required field',
  passwordPolicy: 'Password does not meet requirements.',
  passwordMismatch: 'Passwords do not match.',
  invalidPhone: 'Enter a valid 10-digit phone number.',
  invalidSmsCode: 'Code is invalid. Please check the code and re-enter, or click Resend code.',
} as const;

export const routes = {
  landing: '/',
  login: '/login',
  forgotPassword: '/forgot-password',
  createProfile: '/create-profile',
  signUp: '/sign-up',
  applyForLoan: '/apply-for-a-loan',
} as const;
