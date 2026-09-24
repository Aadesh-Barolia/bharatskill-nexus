import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { Store } from '../src/store.js';
import { seedUser } from '../src/catalog.js';
const options = {
  secret: 'admin-test-secret-longer-than-32-characters',
  origin: 'http://localhost:5173',
  demo: true,
  payment: 'sandbox',
  adminEmail: 'owner@example.test',
};
test('only owner with delivered email OTP can read admin data; old, demo and preview sessions denied', async () => {
  const store = new Store();
  const owner = seedUser('owner', 'Owner', 'owner@example.test');
  owner.passwordHash = 'private-hash';
  await store.create(owner);
  let code = '';
  const app = createApp(store, {
    ...options,
    otpDelivery: async (_e, c) => {
      code = c;
    },
  });
  await request(app).get('/api/admin/overview').expect(401);
  const old = jwt.sign({ sub: 'owner' }, options.secret, {
    issuer: 'bharatskill-nexus',
    audience: 'nexus-web',
  });
  await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${old}`).expect(403);
  const a = request.agent(app);
  let c = (await a.post('/api/auth/otp/request').send({ email: 'owner@example.test' })).body;
  await a
    .post('/api/auth/otp/verify')
    .send({ email: 'owner@example.test', requestId: c.requestId, code })
    .expect(200);
  assert.equal((await a.get('/api/dashboard')).body.isAdmin, true);
  const result = (await a.get('/api/admin/overview').expect(200)).body;
  assert.equal(result.summary.registered, 1);
  assert.equal(result.revenue.amount, null);
  assert.equal(result.users[0].email, owner.email);
  for (const key of ['passwordHash', 'conversations', 'digest', 'payments', 'ledger'])
    assert.equal(key in result.users[0], false);
  await a.get('/api/admin/overview?page=-1').expect(400);
  assert.equal((await a.get('/api/admin/overview?search=absent')).body.total, 0);
  const normal = request.agent(app);
  c = (await normal.post('/api/auth/otp/request').send({ email: 'normal@example.test' })).body;
  await normal
    .post('/api/auth/otp/verify')
    .send({ email: 'normal@example.test', requestId: c.requestId, code })
    .expect(200);
  await normal.get('/api/admin/overview').expect(403);
  const demo = request.agent(app);
  await demo.post('/api/auth/demo').expect(201);
  await demo.get('/api/admin/overview').expect(403);
  const preview = request.agent(createApp(new Store(), options));
  c = (await preview.post('/api/auth/otp/request').send({ email: 'owner@example.test' })).body;
  await preview
    .post('/api/auth/otp/verify')
    .send({ email: 'owner@example.test', requestId: c.requestId, code: c.previewCode })
    .expect(200);
  await preview.get('/api/admin/overview').expect(403);
  const noAdmin = createApp(store, { ...options, adminEmail: '' });
  const token = jwt.sign({ sub: 'owner', amr: 'email_otp' }, options.secret, {
    issuer: 'bharatskill-nexus',
    audience: 'nexus-web',
  });
  await request(noAdmin)
    .get('/api/admin/overview')
    .set('Authorization', `Bearer ${token}`)
    .expect(403);
});
test('admin directory paginates and separates demo payments from revenue', async () => {
  const store = new Store();
  for (let i = 0; i < 23; i++)
    await store.create(seedUser(`u${i}`, `User ${i}`, `u${i}@example.test`));
  await store.create(seedUser('demo'));
  const first = await store.adminOverview({ page: 1, type: 'registered', search: '' });
  assert.equal(first.total, 23);
  assert.equal(first.users.length, 20);
  assert.equal(first.summary.demos, 1);
  const next = await store.adminOverview({ page: 2, type: 'registered', search: '' });
  assert.equal(next.users.length, 3);
  assert.equal(next.revenue.amount, null);
});

test('all explicitly allowlisted owners have access; other email accounts do not', async () => {
  const store = new Store();
  let code = '';
  const app = createApp(store, {
    ...options,
    adminEmail: undefined,
    adminEmails: ['first@example.test', 'second@example.test', 'third@example.test'],
    otpDelivery: async (_e, c) => {
      code = c;
    },
  });
  for (const email of [
    'first@example.test',
    'second@example.test',
    'third@example.test',
    'outsider@example.test',
  ]) {
    const a = request.agent(app);
    const c = (await a.post('/api/auth/otp/request').send({ email }).expect(200)).body;
    await a.post('/api/auth/otp/verify').send({ email, requestId: c.requestId, code }).expect(200);
    await a.get('/api/admin/overview').expect(email === 'outsider@example.test' ? 403 : 200);
  }
});
