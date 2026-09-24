import test from 'node:test';
import request from 'supertest';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { Store } from '../src/store.js';
test('public preview disables simulated actions and premium payments', async () => {
  let code = '';
  const app = createApp(new Store(), {
      secret: 'public-test-secret-at-least-32-characters',
      origin: 'http://localhost:5173',
      demo: false,
      otpDelivery: async (_email, value) => {
        code = value;
      },
      payment: 'disabled',
    }),
    a = request.agent(app);
  await a.post('/api/auth/demo').expect(404);
  const challenge = (
    await a
      .post('/api/auth/otp/request')
      .send({ name: 'Public Learner', email: 'public@example.test' })
      .expect(200)
  ).body;
  await a
    .post('/api/auth/otp/verify')
    .send({ email: 'public@example.test', requestId: challenge.requestId, code })
    .expect(200);
  const d = (await a.get('/api/dashboard')).body;
  assert.equal(d.balance, 0);
  assert.equal(d.readiness.score, 0);
  await a.post('/api/learning/public-speaking-beginner/start').expect(200);
  await a.post('/api/learning/premium/demo-unlock').send({ confirm: true }).expect(403);
  await a
    .post('/api/premium/deep-readiness-analysis')
    .send({ opportunityId: 'swe-intern' })
    .expect(503);
  await a.post('/api/payments/fake/sandbox-settle').expect(403);
});
