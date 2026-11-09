/** Non-secret data for the Customer Sign In module. Real credentials come from config/env.ts getters. */
export const MALFORMED_EMAILS = ['abc', 'a b@c.com', 'user@', '@example.com', 'user@@example.com'] as const;

export const WHITESPACE_VALUES = ['   ', '\t', ' leading@example.com', 'trailing@example.com '] as const;

/** S-F-04: no maxlength on email/password. */
export const LONG_STRING = 'a'.repeat(400);

export const WRONG_CODES = ['000000', '111111', '654321'] as const;

/** Accepted by mockSignInToMfa by default. */
export const MOCK_VALID_CODE = '123456';

export const MOCK_CREDENTIALS = { email: 'mock.user@example.com', password: 'MockPassw0rd!' } as const;

export const SIGNIN_MESSAGES = {
  invalidCredentials: 'Invalid email or password.',
  lockout:
    'Your account has been locked due to too many failed sign-in attempts. Please try again in 15 minutes.',
  mfaWrongCode: 'Code is invalid. Please check the code and re-enter, or click Resend code.',
  mfaIncompleteCode: 'Please enter the full verification code.',
} as const;
