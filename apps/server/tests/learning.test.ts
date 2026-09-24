import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../src/store.js';
import { createApp } from '../src/app.js';
const options = {
  secret: 'test-only-secret-at-least-32-characters',
  origin: 'http://localhost:5173',
  demo: true,
  payment: 'sandbox',
};
test('skill catalog gates advanced content and enrollment per account; unlock persists', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'nexus-library-'));
  try {
    const path = join(dir, 'users.json'),
      store = new Store('file', path);
    await store.init();
    const app = createApp(store, options),
      a = request.agent(app),
      b = request.agent(app);
    await request(app).get('/api/learning').expect(401);
    await a.post('/api/auth/demo');
    await b.post('/api/auth/demo');
    const catalog = (await a.get('/api/learning').expect(200)).body;
    assert.equal(catalog.courses.length, 36);
    assert.equal(catalog.courses.filter((c: any) => c.locked).length, 12);
    assert.ok(!JSON.stringify(catalog).includes('lessons'));
    const advanced = '/api/learning/git-advanced';
    await a.get(advanced).expect(403);
    await a.post(advanced + '/start').expect(403);
    await a.get('/api/learning/not-real').expect(404);
    const basic = (await a.get('/api/learning/public-speaking-beginner').expect(200)).body;
    assert.equal(basic.lessons.length, 3);
    const before = (await a.get('/api/dashboard')).body;
    await Promise.all([
      a.post('/api/learning/public-speaking-beginner/start').expect(200),
      a.post('/api/learning/public-speaking-beginner/start').expect(200),
    ]);
    let after = (await a.get('/api/dashboard')).body;
    assert.equal(after.user.skills.filter((s: any) => s.id === 'public-speaking').length, 1);
    assert.equal(after.user.skills.find((s: any) => s.id === 'public-speaking').score, 0);
    assert.equal(after.balance, before.balance);
    assert.equal(after.readiness.score, 78);
    await a.post('/api/learning/premium/demo-unlock').send({ confirm: false }).expect(400);
    await a.post('/api/learning/premium/demo-unlock').send({ confirm: true }).expect(200);
    await a.get(advanced).expect(200);
    await b.get(advanced).expect(403);
    await a.post(advanced + '/start').expect(200);
    after = (await a.get('/api/dashboard')).body;
    assert.equal(after.user.skills.find((s: any) => s.id === 'git').score, 85);
    assert.equal(after.balance, before.balance);
    const reopened = new Store('file', path);
    await reopened.init();
    assert.equal((await reopened.get(after.user.id))?.learningPremium?.source, 'sandbox');
    await a.post('/api/demo/reset').expect(200);
    await a.get(advanced).expect(403);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test('production cannot activate or inherit sandbox premium', async () => {
  const store = new Store(),
    demo = createApp(store, options),
    a = request.agent(demo);
  await a.post('/api/auth/demo');
  await a.post('/api/learning/premium/demo-unlock').send({ confirm: true });
  const u = (await a.get('/api/dashboard')).body.user;
  let code = '';
  const reg = request.agent(
    createApp(store, {
      ...options,
      demo: false,
      otpDelivery: async (_email, value) => {
        code = value;
      },
    }),
  );
  const challenge = (
    await reg
      .post('/api/auth/otp/request')
      .send({ email: 'real@example.test', name: 'Real Student' })
      .expect(200)
  ).body;
  await reg
    .post('/api/auth/otp/verify')
    .send({ email: 'real@example.test', requestId: challenge.requestId, code })
    .expect(200);
  await reg.post('/api/learning/premium/demo-unlock').send({ confirm: true }).expect(403);
  await reg.get('/api/learning/git-advanced').expect(403);
  const id = (await reg.get('/api/me')).body.user.id;
  await store.mutate(id, (state) => {
    state.learningPremium = u.learningPremium;
  });
  await reg.get('/api/learning/git-advanced').expect(403);
});
