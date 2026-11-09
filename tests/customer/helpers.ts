import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/customer.fixture';
import type { CreateProfileEmailStepPage } from '../../pages/customer/CreateProfileEmailStepPage';
import type { CreateProfileCodeStepPage } from '../../pages/customer/CreateProfileCodeStepPage';
import type { SignUpProfileFormPage } from '../../pages/customer/SignUpProfileFormPage';
import type { SmsVerificationStepPage } from '../../pages/customer/SmsVerificationStepPage';
import { mockProfileSubmitToSms, mockSignUpToProfileForm } from '../../utils/ciamMocks';
import { addressQuery, mockUser, phones, syntheticValidPassword } from '../../test-data/customer.data';

/** Synthetic address used only against mocked auth calls (no code is sent, no account created). */
export const MOCK_EMAIL = 'agcustomer-mock@yopmail.com';

export type Steps = {
  page: Page;
  emailStepPage: CreateProfileEmailStepPage;
  codeStepPage: CreateProfileCodeStepPage;
  profileFormPage: SignUpProfileFormPage;
  smsStepPage: SmsVerificationStepPage;
};

/** Mocked auth: email step -> code step -> profile form. No real code send. */
export async function reachProfileForm({ page, emailStepPage, codeStepPage, profileFormPage }: Steps): Promise<void> {
  await mockSignUpToProfileForm(page);
  await emailStepPage.open();
  await emailStepPage.requestCode(MOCK_EMAIL);
  await codeStepPage.expectLoaded();
  await codeStepPage.verify('12345678');
  await profileFormPage.waitUntilReady();
}

/** Fills every required field with valid synthetic data (address from the real Google suggestion). */
export async function fillValidProfile(profileFormPage: SignUpProfileFormPage, password = syntheticValidPassword()): Promise<void> {
  await profileFormPage.fillProfile({
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    phone: phones.mock,
    password,
    confirmPassword: password,
  });
  await profileFormPage.chooseLastAddressSuggestion(addressQuery);
  await profileFormPage.checkRequiredConsents();
}

/** Mocked auth through the SMS step. smsVerify decides what a submitted SMS code does. */
export async function reachSmsStep(steps: Steps, smsVerify: 'invalid' | 'valid' = 'invalid'): Promise<void> {
  await reachProfileForm(steps);
  await mockProfileSubmitToSms(steps.page, { smsVerify });
  await fillValidProfile(steps.profileFormPage);
  await expect(steps.profileFormPage.continueButton).toBeEnabled();
  await steps.profileFormPage.submit();
  await steps.smsStepPage.expectLoaded();
}

/** Records a known defect (see the exploratory findings doc) on the test; the assertion still encodes the correct behaviour. */
export function defect(id: string, description: string): void {
  test.info().annotations.push({ type: 'defect', description: `${id} ${description}` });
}
