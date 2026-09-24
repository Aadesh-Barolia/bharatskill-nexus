import { test, expect } from '@playwright/test';
test('two browser accounts exchange messages through a private invitation', async ({
  page,
  browser,
}) => {
  const other = await browser.newContext();
  const partner = await other.newPage();
  try {
    await page.goto('/');
    await page.getByRole('button', { name: 'Explore the demo', exact: true }).click();
    await page.getByRole('button', { name: 'NexusMatch', exact: true }).click();
    await page.getByRole('button', { name: 'Chat with Harshit', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Say hello. Build something.' })).toBeVisible();
    await page.getByRole('button', { name: 'Invite a peer', exact: true }).click();
    const link = await page.getByRole('textbox', { name: 'Invitation link' }).inputValue();
    const email = 'riya-' + Date.now() + '@example.test';
    const challenge = await (
      await other.request.post('http://localhost:5173/api/auth/otp/request', {
        data: { name: 'Riya Verma', email },
      })
    ).json();
    await other.request.post('http://localhost:5173/api/auth/otp/verify', {
      data: { email, requestId: challenge.requestId, code: challenge.previewCode },
    });
    await partner.goto(link);
    await partner.getByRole('button', { name: 'Join conversation', exact: true }).click();
    await page
      .getByRole('textbox', { name: 'Your message', exact: true })
      .fill('Could you help me understand Docker networks?');
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(partner.getByRole('log')).toContainText(
      'Could you help me understand Docker networks?',
      { timeout: 10000 },
    );
    await partner
      .getByRole('textbox', { name: 'Your message', exact: true })
      .fill('Of course. Let’s build a small example together.');
    await partner.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(page.getByRole('log')).toContainText(
      'Of course. Let’s build a small example together.',
      { timeout: 10000 },
    );
    await page.screenshot({ path: 'docs/screenshots/peer-chat.png', fullPage: true });
    await page.reload();
    await page.getByRole('button', { name: 'Messages', exact: true }).click();
    await expect(page.getByRole('log')).toContainText('Let’s build a small example together.');
  } finally {
    await other.close();
  }
});
test('mobile chat navigation and motion preferences', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.nexus-cursor')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(
    page.getByRole('img', {
      name: 'Illustrated learning plan: learn, practice, and prove your skills',
    }),
  ).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/landing-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Explore the demo', exact: true }).click();
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.getByRole('button', { name: 'NexusMatch', exact: true }).click();
  await page.getByRole('button', { name: 'Chat with Harshit', exact: true }).click();
  await page.getByRole('textbox', { name: 'Your message', exact: true }).fill('Hello from mobile');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.getByRole('log')).toContainText('Hello from mobile');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'docs/screenshots/chat-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Back to conversations' }).click();
  await expect(page.locator('.conversation-item').first()).toBeVisible();
});
test('cursor responds to links and scroll choreography advances', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('img', {
      name: 'Illustrated learning plan: learn, practice, and prove your skills',
    }),
  ).toBeVisible();
  await page.mouse.move(100, 120);
  await expect(page.locator('.nexus-cursor')).toHaveClass(/is-visible/);
  await page.getByRole('button', { name: 'Explore the demo', exact: true }).hover();
  await expect(page.locator('.nexus-cursor')).toHaveClass(/is-link/);
  await page.getByRole('link', { name: 'How it works', exact: true }).click();
  await expect(page.locator('.learning-step').first()).toBeInViewport({ timeout: 10000 });
  await page.screenshot({ path: 'docs/screenshots/scroll-story.png', fullPage: false });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.nexus-cursor')).toBeHidden();
});
