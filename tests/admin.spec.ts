import { test, expect } from '@playwright/test';
import { createApp } from '../apps/server/src/app.js';
import { Store } from '../apps/server/src/store.js';
import { seedUser } from '../apps/server/src/catalog.js';
import jwt from 'jsonwebtoken';
test('owner dashboard renders records, search and mobile layout', async ({ page }) => {
  const store = new Store();
  await store.create(seedUser('owner', 'Owner', 'owner@example.test'));
  await store.create(seedUser('student', 'New Learner', 'learner@example.test'));
  const secret = 'browser-admin-test-secret-longer-than32';
  const server = createApp(store, {
    secret,
    origin: 'http://localhost:5173',
    demo: true,
    payment: 'sandbox',
    adminEmail: 'owner@example.test',
  }).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const port = (server.address() as { port: number }).port;
  const token = jwt.sign({ sub: 'owner', amr: 'email_otp' }, secret, {
    issuer: 'bharatskill-nexus',
    audience: 'nexus-web',
  });
  try {
    await page.route('**/api/**', async (route) => {
      const response = await route.fetch({
        url: route.request().url().replace('http://localhost:5173', `http://127.0.0.1:${port}`),
        headers: { ...route.request().headers(), authorization: `Bearer ${token}` },
      });
      await route.fulfill({ response });
    });
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Your Nexus, at a glance.' })).toBeVisible();
    await expect(page.getByRole('cell', { name: /New Learner/ })).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/admin-desktop.png', fullPage: true });
    await page.getByRole('textbox', { name: 'Search users' }).fill('absent');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('No users match this search.')).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(async () => page.locator('.sidebar').evaluate((el) => el.getBoundingClientRect().right))
      .toBeLessThanOrEqual(0);
    await page.screenshot({ path: 'docs/screenshots/admin-mobile.png', fullPage: true });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBeTruthy();
  } finally {
    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  }
});
