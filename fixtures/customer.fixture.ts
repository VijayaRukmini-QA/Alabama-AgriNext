import { test as base } from '@playwright/test';
import { CustomerLandingPage } from '../pages/customer/CustomerLandingPage';
import { CustomerLoginPage } from '../pages/customer/CustomerLoginPage';
import { CustomerForgotPasswordPage } from '../pages/customer/CustomerForgotPasswordPage';
import { CreateProfileEmailStepPage } from '../pages/customer/CreateProfileEmailStepPage';
import { CreateProfileCodeStepPage } from '../pages/customer/CreateProfileCodeStepPage';
import { SignUpProfileFormPage } from '../pages/customer/SignUpProfileFormPage';
import { SmsVerificationStepPage } from '../pages/customer/SmsVerificationStepPage';
import { ApplyForLoanPage } from '../pages/customer/ApplyForLoanPage';
import { YopmailInboxPage } from '../pages/third-party/YopmailInboxPage';
import { ReceiveSmsInboxPage } from '../pages/third-party/ReceiveSmsInboxPage';

type CustomerPages = {
  landingPage: CustomerLandingPage;
  loginPage: CustomerLoginPage;
  forgotPasswordPage: CustomerForgotPasswordPage;
  emailStepPage: CreateProfileEmailStepPage;
  codeStepPage: CreateProfileCodeStepPage;
  profileFormPage: SignUpProfileFormPage;
  smsStepPage: SmsVerificationStepPage;
  applyForLoanPage: ApplyForLoanPage;
  /** Third-party inboxes live in their own page of the same context, so the app page stays untouched. */
  yopmailInbox: YopmailInboxPage;
  smsInbox: ReceiveSmsInboxPage;
};

/**
 * Extends @playwright/test directly (not pages.fixture.ts): the lender fixture would drag the five Lender page
 * objects into every customer test and couple the two modules. Same pattern, independent module.
 */
export const test = base.extend<CustomerPages>({
  landingPage: async ({ page }, use) => use(new CustomerLandingPage(page)),
  loginPage: async ({ page }, use) => use(new CustomerLoginPage(page)),
  forgotPasswordPage: async ({ page }, use) => use(new CustomerForgotPasswordPage(page)),
  emailStepPage: async ({ page }, use) => use(new CreateProfileEmailStepPage(page)),
  codeStepPage: async ({ page }, use) => use(new CreateProfileCodeStepPage(page)),
  profileFormPage: async ({ page }, use) => use(new SignUpProfileFormPage(page)),
  smsStepPage: async ({ page }, use) => use(new SmsVerificationStepPage(page)),
  applyForLoanPage: async ({ page }, use) => use(new ApplyForLoanPage(page)),
  yopmailInbox: async ({ context }, use) => use(new YopmailInboxPage(await context.newPage())),
  smsInbox: async ({ context }, use) => use(new ReceiveSmsInboxPage(await context.newPage())),
});

export { expect } from '@playwright/test';
