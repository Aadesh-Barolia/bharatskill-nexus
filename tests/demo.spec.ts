import { test, expect } from '@playwright/test';
test('the whole hackathon journey works in the browser', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Learn a skill. Build your next chapter.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('img', {
      name: 'Illustrated learning plan: learn, practice, and prove your skills',
    }),
  ).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/landing-desktop.png', fullPage: false });
  await page.getByRole('button', { name: 'Explore the demo', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Welcome back, Aadesh/ })).toBeVisible();
  await expect(page.locator('.score-ring')).toContainText('78');
  await expect(page.getByRole('button', { name: 'Inspect Docker skill' })).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/dashboard-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Make me ready', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'What if you learned…' })).toBeVisible();
  await page.locator('.sim-option').filter({ hasText: 'Docker' }).click();
  await expect(page.locator('.sim-score strong')).toContainText('83');
  await page.getByRole('button', { name: 'Build my Skill GPS', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Docker foundations', exact: true }),
  ).toBeVisible();
  for (const skill of ['Docker', 'Testing', 'CI/CD']) {
    await page.locator('.nav-item').filter({ hasText: 'NexusMatch' }).click();
    await page.getByRole('button', { name: skill, exact: true }).click();
    await expect(page.locator('.peer-card').first()).toContainText(`${skill} skill`);
    await page
      .locator('.peer-card')
      .first()
      .getByRole('button', { name: /Learn with/ })
      .click();
    await page.getByRole('button', { name: 'Complete demo session', exact: true }).click();
    const form = page.locator('.session-card form');
    const answers = skill === 'Docker' ? [1, 1, 0] : skill === 'Testing' ? [1, 2, 1] : [0, 2, 1];
    for (let i = 0; i < 3; i++)
      await form.locator('fieldset').nth(i).getByRole('radio').nth(answers[i]).check();
    await form.getByRole('button', { name: 'Verify my knowledge' }).click();
    await expect(form).toHaveCount(0);
  }
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await expect(page.locator('.score-ring')).toContainText('92');
  await page.getByRole('button', { name: 'SkillCredits', exact: true }).click();
  await expect(page.locator('.credit-hero')).toContainText('210');
  await expect(page.locator('.proof-record')).toHaveCount(3);
  await expect(page.locator('.proof-gallery')).toContainText('Knowledge check passed');
  await page.getByRole('button', { name: 'Nexus Intelligence' }).click();
  await page.getByRole('button', { name: 'Request deep analysis' }).click();
  await expect(page.getByText('402 · PAYMENT REQUIRED', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Simulate settlement & unlock' }).click();
  await expect(page.getByText('Sandbox flow completed', { exact: true })).toBeVisible();
  await expect(page.locator('.report-score')).toContainText('92%');
  await page.screenshot({ path: 'docs/screenshots/premium-analysis.png', fullPage: true });
  await page.reload();
  await expect(page.locator('.score-ring')).toContainText('92');
  expect(errors).toEqual([]);
});
test('mobile and reduced-motion views remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the demo', exact: true }).click();
  await expect(page.locator('.score-ring')).toContainText('78');
  await page.screenshot({ path: 'docs/screenshots/dashboard-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.getByRole('button', { name: 'NexusMatch', exact: true }).click();
  await expect(page.locator('.peer-card').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('learning paths filter and open the matching skill direction', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByRole('button', { name: 'Infrastructure', exact: true }).click();
  await expect(page.locator('.learning-card')).toHaveCount(1);
  await expect(page.locator('.learning-card')).toContainText('Containers & delivery');
  await page.getByRole('button', { name: 'All paths', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search learning paths' }).fill('testing');
  await expect(page.locator('.learning-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Explore in demo', exact: true }).click();
  await expect(page.locator('.nav-item.active')).toContainText('Skill GPS');
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Inspect Testing skill' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('.score-ring > span')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
});
