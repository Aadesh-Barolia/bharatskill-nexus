import { test, expect } from '@playwright/test';
test('public home remains reachable with a saved session and browser navigation', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the demo', exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole('button', { name: 'Back to home page' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole('heading', { name: 'Learn a skill. Build your next chapter.' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Learn a skill. Build your next chapter.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'My workspace', exact: true }).click();
  await expect(page.locator('.score-ring')).toContainText('78');
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: 'Learn a skill. Build your next chapter.' }),
  ).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/restored-home.png', fullPage: false });
});
test('home renders when the API is unavailable', async ({ page }) => {
  await page.route('**/api/**', (r) => r.abort());
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Learn a skill. Build your next chapter.' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign up', exact: true })).toBeVisible();
});
