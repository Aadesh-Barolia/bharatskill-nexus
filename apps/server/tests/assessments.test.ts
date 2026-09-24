import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';
import { Store } from '../src/store.js';
import { assessmentBank } from '../src/assessment-bank.js';
import {learningCourses} from '../src/learning.js';
const options = {
  secret: 'assessment-test-secret-longer-than-32',
  origin: 'http://localhost:5173',
  demo: true,
  payment: 'sandbox',
};
const answers = (id: string) => assessmentBank[id].map((q) => q.answer);
test('12 assessments hide keys and grade on server with account isolation, strict answers and idempotent submission', async () => {
  const store = new Store();
  const app = createApp(store, options),
    a = request.agent(app),
    b = request.agent(app);
  await request(app).get('/api/assessments').expect(401);
  await a.post('/api/auth/demo');
  await b.post('/api/auth/demo');
  const before = (await a.get('/api/dashboard')).body;
  const catalog = (await a.get('/api/assessments').expect(200)).body;
  assert.equal(catalog.items.length, 12);
  await a.post('/api/assessments/unknown/start').expect(404);
  const quiz = (await a.post('/api/assessments/git/start').expect(200)).body;
  assert.equal(quiz.questions.length, 4);
  assert.ok(!JSON.stringify(quiz).includes('explanation'));
  assert.ok(!('answer' in quiz.questions[0]));
  assert.equal((await a.post('/api/assessments/git/start')).body.attempt.id, quiz.attempt.id);
  const url = `/api/assessments/attempts/${quiz.attempt.id}`;
  await b
    .post(url + '/submit')
    .send({ answers: answers('git') })
    .expect(404);
  await b.get(url).expect(404);
  await a.get(url).expect(409);
  for (const body of [
    { answers: [1] },
    { answers: [1, 2, 0, 99] },
    { answers: answers('git'), score: 100 },
    { answers: [1, 2, 0, '1'] },
  ])
    await a
      .post(url + '/submit')
      .send(body)
      .expect(400);
  const responses = await Promise.all(
    [1, 2, 3].map(() =>
      a
        .post(url + '/submit')
        .send({ answers: answers('git') })
        .expect(200),
    ),
  );
  for (const r of responses) {
    assert.equal(r.body.attempt.score, 100);
    assert.equal(r.body.attempt.profileAfter, 85);
    assert.equal(r.body.nextSteps.length, 0);
  }
  await a
    .post(url + '/submit')
    .send({ answers: [0, 0, 0, 0] })
    .expect(409);
  await a.post('/api/assessments/git/start').expect(429);
  const after = (await a.get('/api/dashboard')).body;
  assert.equal(after.user.assessments.length, 1);
  assert.equal(after.readiness.score, before.readiness.score);
  assert.deepEqual(after.user.ledger, before.user.ledger);
  assert.deepEqual(after.user.evidence, before.user.evidence);
  assert.equal((await a.get(url)).body.attempt.score, 100);
});
test('fresh account earns a bounded baseline, targeted practice and no proofs/credits; expired attempts rejected', async () => {
  const store = new Store();
  const a = request.agent(createApp(store, options));
  const email = 'assessment@example.test';
  const c = (await a.post('/api/auth/otp/request').send({ email })).body;
  await a.post('/api/auth/otp/verify').send({ email, requestId: c.requestId, code: c.previewCode });
  const quiz = (await a.post('/api/assessments/git/start')).body;
  const selected = answers('git');
  selected[0] = (selected[0] + 1) % 3;
  const r = (
    await a
      .post(`/api/assessments/attempts/${quiz.attempt.id}/submit`)
      .send({ answers: selected })
      .expect(200)
  ).body;
  assert.equal(r.attempt.score, 75);
  assert.equal(r.attempt.profileBefore, 0);
  assert.equal(r.attempt.profileAfter, 45);
  assert.equal(r.nextSteps.length, 1);
  assert.equal(r.nextSteps[0].topic, 'Working tree');
  const d = (await a.get('/api/dashboard')).body;
  assert.ok(d.readiness.score > 0);
  assert.equal(d.balance, 0);
  assert.equal(d.user.evidence.length, 0);
  assert.equal(Boolean(d.user.learningPremium), false);
  const expired = (await a.post('/api/assessments/python/start')).body;
  await store.mutate(d.user.id, (u) => {
    u.assessments!.find((a) => a.id === expired.attempt.id)!.expiresAt = new Date(0).toISOString();
  });
  await a
    .post(`/api/assessments/attempts/${expired.attempt.id}/submit`)
    .send({ answers: answers('python') })
    .expect(410);
  const restarted = (await a.post('/api/assessments/python/start')).body;
  assert.notEqual(restarted.attempt.id, expired.attempt.id);
  await a.post('/api/demo/reset').expect(403);
});
test('assessment history survives file reopen and demo reset clears it', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'nexus-assessments-'));
  try {
    const store = new Store('file', join(dir, 'data.json'));
    await store.init();
    const a = request.agent(createApp(store, options));
    await a.post('/api/auth/demo');
    const id = (await a.get('/api/dashboard')).body.user.id;
    const q = (await a.post('/api/assessments/python/start')).body;
    await a
      .post(`/api/assessments/attempts/${q.attempt.id}/submit`)
      .send({ answers: answers('python') })
      .expect(200);
    const reopened = new Store('file', join(dir, 'data.json'));
    await reopened.init();
    assert.equal((await reopened.get(id))!.assessments![0].score, 100);
    await a.post('/api/demo/reset').expect(200);
    assert.equal((await a.get('/api/assessments')).body.history.length, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test('all authored banks have valid balanced options and match the learning catalog', () => {
  for (const [id, items] of Object.entries(assessmentBank)) {
    assert.ok(learningCourses.some(c=>c.skillId===id&&c.level==='Beginner'));
    assert.equal(items.length, 4, id);
    assert.equal(new Set(items.map((q) => q.id)).size, 4);
    for (const q of items) {
      assert.equal(q.options.length, 3);
      assert.equal(new Set(q.options).size, 3);
      assert.ok(q.answer >= 0 && q.answer < 3);
      assert.ok(q.explanation.length > 20);
    }
  }
});
