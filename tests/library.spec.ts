import { test, expect } from '@playwright/test';
test('skill levels, search, profile enrollment and persistent premium preview', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore all 36 skill guides', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Explore your skills' })).toBeVisible();
  await expect(page.locator('.library-card')).toHaveCount(12);
  await page.getByRole('textbox', { name: 'Search skills' }).fill('public speaking');
  await expect(page.locator('.library-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Open guide', exact: true }).click();
  await expect(page.locator('.library-lessons')).toContainText('Record a two-minute introduction');
  await page.getByRole('button', { name: 'Add skill to my profile' }).click();
  await expect(page.getByRole('button', { name: 'Already in your skills' })).toBeDisabled();
  await page.getByRole('button', { name: 'Back to skill library' }).click();
  await page.getByRole('textbox', { name: 'Search skills' }).fill('');
  await page.getByRole('button', { name: /02 Intermediate/ }).click();
  await expect(page.locator('.library-card')).toHaveCount(12);
  await page.getByRole('button', { name: /03 Advanced/ }).click();
  await expect(page.getByRole('button', { name: 'Unlock with premium', exact: true })).toHaveCount(
    12,
  );
  await page.screenshot({ path: 'docs/screenshots/skill-library-locked.png', fullPage: true });
  await page.getByRole('button', { name: 'Unlock with premium', exact: true }).first().click();
  await page.getByRole('button', { name: 'Confirm free demo unlock' }).click();
  await expect(page.getByText('PREMIUM PREVIEW ACTIVE', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Skill library', exact: true }).click();
  await page.getByRole('button', { name: /03 Advanced/ }).click();
  await page.getByRole('textbox', { name: 'Search skills' }).fill('Git');
  await page.getByRole('button', { name: 'Open guide', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Advanced Git workflows' })).toBeVisible();
  await expect(page.locator('.library-lessons')).toContainText('Compare merge and rebase');
  await page.screenshot({ path: 'docs/screenshots/advanced-guide.png', fullPage: true });
  await page.getByRole('button', { name: 'Back to skill library' }).click();
  await page.getByRole('textbox', { name: 'Search skills' }).fill('');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'docs/screenshots/skill-library-mobile.png', fullPage: true });
});
