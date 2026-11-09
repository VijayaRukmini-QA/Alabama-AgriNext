import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../../fixtures/customer.fixture';
import { MOCK_EMAIL, fillValidProfile } from './helpers';
import { mockProfileSubmitToSms, mockSignUpToProfileForm } from '../../utils/ciamMocks';

async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(1);
}

async function expectReachable(button: Locator): Promise<void> {
  await button.scrollIntoViewIfNeeded();
  await expect(button).toBeInViewport();
}

test.describe('Customer - mobile viewport (Pixel 5, mocked auth)', () => {
  test('TC-C-24 @customer @regression @mobile every create-profile step renders without horizontal scroll and the primary button is reachable', async ({ page, emailStepPage, codeStepPage, profileFormPage, smsStepPage }) => {
    await mockSignUpToProfileForm(page);
    await mockProfileSubmitToSms(page, { smsVerify: 'invalid' });

    await test.step('email step', async () => {
      await emailStepPage.open();
      await emailStepPage.enterEmail(MOCK_EMAIL);
      await expectNoHorizontalScroll(page);
      await expectReachable(emailStepPage.sendCodeButton);
    });
    await test.step('email-code step', async () => {
      await emailStepPage.sendCodeButton.click();
      await codeStepPage.expectLoaded();
      await codeStepPage.enterCode('12345678');
      await expectNoHorizontalScroll(page);
      await expectReachable(codeStepPage.verifyButton);
    });
    await test.step('profile form', async () => {
      await codeStepPage.verifyButton.click();
      await profileFormPage.waitUntilReady();
      await fillValidProfile(profileFormPage);
      await expectNoHorizontalScroll(page);
      await expectReachable(profileFormPage.continueButton);
      await profileFormPage.expectContinueEnabled(true);
    });
    await test.step('SMS step', async () => {
      await profileFormPage.submit();
      await smsStepPage.expectLoaded();
      await smsStepPage.enterCode('123456');
      await expectNoHorizontalScroll(page);
      await expectReachable(smsStepPage.completeProfileButton);
    });
  });

  test('TC-C-24 @customer @regression @mobile sign in and forgot-password pages render without horizontal scroll', async ({ loginPage, forgotPasswordPage, page }) => {
    await loginPage.open();
    await expectNoHorizontalScroll(page);
    await expectReachable(loginPage.signInButton);
    await forgotPasswordPage.open();
    await expectNoHorizontalScroll(page);
    await expectReachable(forgotPasswordPage.sendCodeButton);
  });
});
