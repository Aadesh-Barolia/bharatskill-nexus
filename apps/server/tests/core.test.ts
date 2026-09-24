import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { seedUser, opportunities, answerKeys } from '../src/catalog.js';
import { readiness, gaps, simulate, recommendations, roadmap } from '../src/engines.js';
import { createApp } from '../src/app.js';
import { Store } from '../src/store.js';
const options = {
  secret: 'test-only-secret-at-least-32-characters',
  origin: 'http://localhost:5173',
  demo: true,
  payment: 'sandbox',
};
test('readiness is 78 initially; simulations are pure, bounded and deduplicated', () => {
  const u = seedUser('test');
  const before = structuredClone(u);
  assert.equal(readiness(u, opportunities[0]).score, 78);
  assert.deepEqual(
    gaps(u, opportunities[0]).map((g) => g.skillId),
    ['cicd', 'docker', 'testing'],
  );
  assert.equal(simulate(u, opportunities[0], ['docker']).projected, 83);
  assert.equal(simulate(u, opportunities[0], ['docker', 'docker']).projected, 83);
  assert.equal(simulate(u, opportunities[0], ['docker', 'testing', 'cicd']).projected, 92);
  assert.deepEqual(u, before);
  assert.equal(roadmap(u, opportunities[0]).days, 11);
  assert.equal(roadmap(u, opportunities[0]).peerDays, 8);
});
test('NexusMatch values teaching and availability over raw expertise', () => {
  const u = seedUser('test');
  const matches = recommendations(u, 'docker');
  assert.equal(matches[0].id, 'harshit');
  assert.ok(matches[0].match > matches.find((m) => m.id === 'abhishek')!.match);
  assert.equal(matches[0].swap, 'react');
  assert.equal(recommendations(u, 'unlisted').length, 0);
});
test('complete demo, authentication isolation, concurrent rewards and sandbox payment', async () => {
  const store = new Store();
  const app = createApp(store, options);
  const a = request.agent(app),
    b = request.agent(app);
  await request(app).get('/api/dashboard').expect(401);
  await a.post('/api/auth/demo').expect(201);
  await b.post('/api/auth/demo').expect(201);
  let d = (await a.get('/api/dashboard').expect(200)).body;
  assert.equal(d.readiness.score, 78);
  assert.equal(d.balance, 120);
  assert.ok(!('passwordHash' in d.user));
  await a
    .post('/api/challenges/docker-foundations/submit')
    .send({ answers: answerKeys['docker-foundations'] })
    .expect(409);
  await a
    .post('/api/opportunities/swe-intern/simulate')
    .send({ skillIds: ['bogus'] })
    .expect(400);
  await a.post('/api/sessions').send({ peerId: 'mouli', skillId: 'unknown' }).expect(400);
  for (const [i, skill] of ['docker', 'testing', 'cicd'].entries()) {
    const peer = (await a.get(`/api/peers?skillId=${skill}`)).body.items[0];
    const session = (
      await a.post('/api/sessions').send({ peerId: peer.id, skillId: skill }).expect(201)
    ).body;
    await b.post(`/api/sessions/${session.id}/complete`).expect(404);
    await a.post(`/api/sessions/${session.id}/complete`).expect(200);
    const before = (await a.get('/api/dashboard')).body;
    const bad = await a
      .post(`/api/challenges/${skill}-foundations/submit`)
      .send({ answers: [0, 0, 0] })
      .expect(200);
    assert.equal(bad.body.passed, false);
    assert.equal((await a.get('/api/dashboard')).body.balance, before.balance);
    const results = await Promise.all(
      Array.from({ length: 3 }, () =>
        a
          .post(`/api/challenges/${skill}-foundations/submit`)
          .send({ answers: answerKeys[`${skill}-foundations`] })
          .expect(200),
      ),
    );
    assert.equal(results.filter((r) => !r.body.alreadyCompleted).length, 1);
    d = (await a.get('/api/dashboard')).body;
    assert.equal(d.balance, 120 + (i + 1) * 30);
    assert.equal(d.readiness.score, [83, 86, 92][i]);
  }
  assert.equal(d.gaps.length, 0);
  assert.equal(d.user.evidence.length, 3);
  assert.equal((await b.get('/api/dashboard')).body.readiness.score, 78);
  const pay = (
    await a
      .post('/api/premium/deep-readiness-analysis')
      .send({ opportunityId: 'swe-intern' })
      .expect(402)
  ).body.payment;
  await b.post(`/api/payments/${pay.id}/sandbox-settle`).expect(404);
  await a
    .post('/api/premium/deep-readiness-analysis')
    .set('X-Demo-Payment', 'forged')
    .send({ opportunityId: 'swe-intern' })
    .expect(402);
  await a.post(`/api/payments/${pay.id}/sandbox-settle`).expect(200);
  const report = (
    await a
      .post('/api/premium/deep-readiness-analysis')
      .set('X-Demo-Payment', pay.id)
      .send({ opportunityId: 'swe-intern' })
      .expect(200)
  ).body;
  assert.equal(report.readiness.score, 92);
  assert.equal(report.payment.mode, 'sandbox');
  assert.equal(report.payment.transaction, undefined);
  await a
    .post('/api/premium/deep-readiness-analysis')
    .set('X-Demo-Payment', pay.id)
    .send({ opportunityId: 'frontend-fellow' })
    .expect(402);
  await a
    .post('/api/premium/deep-readiness-analysis')
    .send({ opportunityId: 'missing' })
    .expect(404);
  await a.post('/api/demo/reset').set('Origin', 'https://evil.example').expect(403);
  await a.post('/api/demo/reset').expect(200);
  assert.equal((await a.get('/api/dashboard')).body.readiness.score, 78);
  await a.post('/api/auth/logout').expect(200);
  await a.get('/api/dashboard').expect(401);
});
test('OTP registration starts empty and password routes are retired', async () => {
  const store = new Store(),
    a = request.agent(createApp(store, options));
  const challenge = (
    await a
      .post('/api/auth/otp/request')
      .send({ email: 'STUDENT@example.com', name: 'New Student' })
      .expect(200)
  ).body;
  assert.equal(await store.byEmail('student@example.com'), undefined);
  await a
    .post('/api/auth/otp/verify')
    .send({
      email: 'student@example.com',
      requestId: challenge.requestId,
      code: challenge.previewCode,
    })
    .expect(200);
  const user = await store.byEmail('student@example.com');
  assert.ok(user);
  assert.ok(!user.passwordHash);
  assert.equal(user.ledger.length, 0);
  assert.ok(user.skills.every((s) => s.score === 0));
  await a.post('/api/demo/reset').expect(403);
  await a.post('/api/auth/logout');
  await a
    .post('/api/auth/login')
    .send({ email: 'student@example.com', password: 'old-password' })
    .expect(401);
});

test('file storage survives restart and aborts failed mutations atomically', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'nexus-test-'));
  try {
    const path = join(dir, 'users.json');
    const store = new Store('file', path);
    await store.init();
    await store.create(seedUser('persist'));
    await assert.rejects(
      store.mutate('persist', (u) => {
        u.ledger = [];
        throw Error('abort');
      }),
    );
    const reopened = new Store('file', path);
    await reopened.init();
    assert.equal((await reopened.get('persist'))?.ledger.length, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test('demo and sandbox actions are gated', async () => {
  const app = createApp(new Store(), { ...options, demo: false });
  await request(app).post('/api/auth/demo').expect(404);
});
