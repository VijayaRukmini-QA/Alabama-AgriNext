import * as dotenv from 'dotenv';
import * as path from 'path';
import { registerSecret } from '../utils/logger';

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

export const BASE_URL: string =
  process.env.BASE_URL?.trim() || 'https://alabama-dev-lender.agrinextcloud.ai/';

/** Opt-in: real-credential tests only run when RUN_REAL_LOGIN=1. */
export const RUN_REAL_LOGIN: boolean = process.env.RUN_REAL_LOGIN === '1';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} is required but not set (see .env.example).`);
  return value;
}

/** Throws only when called, never at import. */
export function getLenderEmail(): string {
  return required('LENDER_EMAIL');
}

export function getLenderPassword(): string {
  return required('LENDER_PASSWORD');
}

// ---------------------------------------------------------------- Customer portal

export const CUSTOMER_BASE_URL: string =
  process.env.CUSTOMER_BASE_URL?.trim() || 'https://alabama-dev-customer.agrinextcloud.ai/';

/** Opt-in: the real end-to-end registration (real email + SMS inboxes) only runs when RUN_CUSTOMER_E2E=1. */
export const RUN_CUSTOMER_E2E: boolean = process.env.RUN_CUSTOMER_E2E === '1';

/** Lazy getters: throw only when called. Secrets are registered so the logger masks them. */
export function getCustomerEmail(): string {
  const v = required('CUSTOMER_EMAIL');
  registerSecret(v);
  return v;
}

export function getCustomerPassword(): string {
  const v = required('CUSTOMER_PASSWORD');
  registerSecret(v);
  return v;
}

export function getCustomerPhone(): string {
  const v = required('CUSTOMER_PHONE');
  registerSecret(v);
  return v;
}

export function getCustomerFirstName(): string {
  return required('CUSTOMER_FIRST_NAME');
}

export function getCustomerLastName(): string {
  return required('CUSTOMER_LAST_NAME');
}

export function getSmsInboxUrl(): string {
  return required('SMS_INBOX_URL');
}

// ---------------------------------------------------------------- Customer loan application

/** SSN used by the (blocked) loan tests. Lazy; registered so the logger masks it. Never hard-code or print it. */
export function getLoanTestSsn(): string {
  const v = required('LOAN_TEST_SSN');
  registerSecret(v);
  return v;
}
