import { test, expect } from '@playwright/test';
test('visible native cursor, personal coach, roadmap and proof export', async ({ page }) => {
  await page.goto('/');
  await page.mouse.move(180, 180);
  await expect(page.locator('.nexus-cursor')).toHaveClass(/is-visible/);
  expect(await page.locator('body').evaluate((el) => getComputedStyle(el).cursor)).not.toBe('none');
  expect(
    await page
      .getByRole('button', { name: 'Explore the demo', exact: true })
      .evaluate((el) => getComputedStyle(el).cursor),
  ).toBe('pointer');
  await page.getByRole('button', { name: 'Explore the demo', exact: true }).click();
  await page.getByRole('button', { name: 'Assistant', exact: true }).click();
  await page.getByRole('button', { name: 'How do I earn and use credits?', exact: true }).click();
  await expect(page.locator('.coach-answer')).toContainText('120 SkillCredits', { timeout: 20000 });
  await page.screenshot({ path: 'docs/screenshots/personal-coach.png', fullPage: true });
  await page.getByRole('button', { name: 'Open my roadmap', exact: true }).click();
  await expect(page.locator('.gap-checklist')).toHaveCount(3);
  await expect(page.locator('.gap-checklist').first()).toContainText(
    'Containerize a small Node service',
  );
  await page.screenshot({ path: 'docs/screenshots/gap-roadmap.png', fullPage: true });
  await page.getByRole('button', { name: 'View my proofs', exact: true }).click();
  await expect(page.locator('.credit-guide')).toContainText(
    'Spending and redemption are not available yet.',
  );
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export my records' }).click();
  expect((await pending).suggestedFilename()).toBe('nexus-learning-proofs.json');
  await page.screenshot({ path: 'docs/screenshots/credits-proofs.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.getByRole('button', { name: 'Assistant', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'docs/screenshots/coach-mobile.png', fullPage: true });
});
