import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Store } from '../src/store.js';
import { seedUser } from '../src/catalog.js';
const options = {
  secret: 'otp-test-secret-at-least-32-characters',
  origin: 'http://localhost:5173',
  demo: true,
  payment: 'sandbox',
};
test('OTP is email-bound, attempt-limited, single-use and resend-throttled', async () => {
  const a = request.agent(createApp(new Store(), options));
  const c = (await a.post('/api/auth/otp/request').send({ email: 'otp@example.test' }).expect(200))
    .body;
  assert.match(c.previewCode, /^\d{6}$/);
  await a.get('/api/dashboard').expect(401);
  await a.post('/api/auth/otp/request').send({ email: 'otp@example.test' }).expect(429);
  await a
    .post('/api/auth/otp/verify')
    .send({ email: 'another@example.test', requestId: c.requestId, code: c.previewCode })
    .expect(401);
  const results = await Promise.all(
    [1, 2].map(() =>
      a
        .post('/api/auth/otp/verify')
        .send({ email: 'otp@example.test', requestId: c.requestId, code: c.previewCode }),
    ),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 401]);
  const locked = (
    await a.post('/api/auth/otp/request').send({ email: 'locked@example.test' }).expect(200)
  ).body;
  for (let i = 0; i < 5; i++)
    await a
      .post('/api/auth/otp/verify')
      .send({
        email: 'locked@example.test',
        requestId: locked.requestId,
        code: locked.previewCode === '000000' ? '111111' : '000000',
      })
      .expect(401);
  await a
    .post('/api/auth/otp/verify')
    .send({ email: 'locked@example.test', requestId: locked.requestId, code: locked.previewCode })
    .expect(401);
});
test('existing account signs in with email OTP without losing progress', async () => {
  const store = new Store(),
    user = seedUser('legacy', 'Existing Learner', 'legacy@example.test');
  user.passwordHash = 'unused-legacy-hash';
  await store.create(user);
  const a = request.agent(createApp(store, options)),
    c = (
      await a
        .post('/api/auth/otp/request')
        .send({ email: 'LEGACY@example.test', name: 'Do not rename me' })
        .expect(200)
    ).body;
  await a
    .post('/api/auth/otp/verify')
    .send({ email: 'legacy@example.test', requestId: c.requestId, code: c.previewCode })
    .expect(200);
  const d = (await a.get('/api/dashboard')).body;
  assert.equal(d.user.id, 'legacy');
  assert.equal(d.user.name, 'Existing Learner');
  assert.equal(d.readiness.score, 78);
  assert.ok(!d.user.passwordHash);
});
test('public email auth fails closed without delivery and never exposes codes', async () => {
  const a = request.agent(
    createApp(new Store(), {
      ...options,
      demo: false,
      otpDelivery: async () => {
        throw Error('provider failed');
      },
    }),
  );
  await a.post('/api/auth/otp/request').send({ email: 'failed@example.test' }).expect(503);
  await a.get('/api/dashboard').expect(401);
  let code = '';
  const b = request.agent(
    createApp(new Store(), {
      ...options,
      demo: false,
      otpDelivery: async (_email, c) => {
        code = c;
      },
    }),
  );
  const c = (await b.post('/api/auth/otp/request').send({ email: 'live@example.test' }).expect(200))
    .body;
  assert.equal(c.previewCode, undefined);
  assert.equal(c.delivery, 'email');
  assert.equal(code.length, 6);
});
