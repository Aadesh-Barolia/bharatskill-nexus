import { test, expect } from '@playwright/test';
test('passwordless signup verifies a code and opens an empty account', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign up', exact: true }).click();
  await expect(page.locator('input[type=password]')).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Your name', exact: true }).fill('OTP Learner');
  await page
    .getByRole('textbox', { name: 'Email address', exact: true })
    .fill('otp-' + Date.now() + '@example.test');
  await page.getByRole('button', { name: 'Send sign-in code' }).click();
  await expect(
    page.getByText('Local test only — no email was sent.', { exact: false }),
  ).toBeVisible();
  const code = await page.locator('.otp-preview strong').innerText();
  await expect(page.getByRole('button', { name: /Resend in/ })).toBeDisabled();
  await page
    .getByRole('textbox', { name: 'Six-digit code' })
    .fill(code === '000000' ? '111111' : '000000');
  await page.getByRole('button', { name: 'Verify & continue' }).click();
  await expect(page.getByRole('alert')).toContainText('Invalid or expired');
  await page.getByRole('textbox', { name: 'Six-digit code' }).fill(code);
  await page.screenshot({ path: 'docs/screenshots/email-otp.png', fullPage: false });
  await page.getByRole('button', { name: 'Verify & continue' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.locator('.score-ring')).toContainText('0');
  await expect(page.locator('.profile')).toContainText('OTP Learner');
});
