import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataFile = resolve(root, 'data', `production-smoke-${randomUUID()}.json`);
const server = spawn(process.execPath, ['apps/server/dist/apps/server/src/index.js'], {
  cwd: root,
  windowsHide: true,
  env: {
    ...process.env,
    PORT: '4001',
    CLIENT_ORIGIN: 'http://localhost:4001',
    HOST: '127.0.0.1',
    STORAGE: 'file',
    DATA_FILE: dataFile,
    DEMO_MODE: 'true',
    PAYMENT_MODE: 'sandbox',
  },
  stdio: 'pipe',
});
let logs = '';
server.stdout.on('data', (b) => {
  logs += b.toString();
});
server.stderr.on('data', (b) => {
  logs += b.toString();
});
const exited = new Promise<void>((done) => server.once('exit', () => done()));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  let healthy = false;
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch('http://localhost:4001/api/health');
      if (r.ok) {
        healthy = true;
        break;
      }
    } catch {
      /* waiting for this process to listen */
    }
    await new Promise((done) => setTimeout(done, 100));
  }
  assert.ok(healthy, `Compiled server did not start: ${logs}`);
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1'
      ? route.continue()
      : route.abort();
  });
  await page.goto('http://localhost:4001');
  await page
    .getByRole('img', { name: 'Illustrated learning plan: learn, practice, and prove your skills' })
    .waitFor();
  await page.getByRole('button', { name: 'Explore the demo', exact: true }).click();
  await page.locator('.score-ring').waitFor();
  assert.ok((await page.locator('.score-ring').innerText()).includes('78'));
  assert.equal(await page.evaluate(() => document.fonts.check('14px "DM Sans Variable"')), true);
  assert.deepEqual(errors, []);
  console.log(
    'PASS: compiled server serves SPA, local fonts, learning illustrations and authenticated 78% dashboard with all external requests blocked.',
  );
} finally {
  await browser.close();
  server.kill();
  await exited;
  await rm(dataFile, { force: true });
}
