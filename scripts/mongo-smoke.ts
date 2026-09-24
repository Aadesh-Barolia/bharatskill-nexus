import { MongoMemoryServer } from 'mongodb-memory-server';
import assert from 'node:assert/strict';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { Store } from '../apps/server/src/store.js';
import { createApp } from '../apps/server/src/app.js';
import { OpportunityModel, PeerModel } from '../apps/server/src/models.js';
const database = await MongoMemoryServer.create({ binary: { version: '8.0.12' } });
const store = new Store('mongo');
try {
  await store.init(database.getUri('nexus_integration'));
  assert.equal(await OpportunityModel.countDocuments(), 3);
  assert.equal(await PeerModel.countDocuments(), 4);
  const app = createApp(store, {
    secret: 'mongo-test-secret-at-least-32-characters',
    origin: 'http://localhost:5173',
    demo: true,
    payment: 'sandbox',
  });
  const agent = request.agent(app);
  await agent.post('/api/auth/demo').expect(201);
  const admin = await store.adminOverview({ page: 1, type: 'demo', search: '' });
  assert.equal(admin.total, 1);
  assert.equal(admin.summary.demos, 1);
  assert.equal(admin.users[0].skills, 5);
  assert.equal('conversations' in admin.users[0], false);
  assert.equal((await store.adminOverview({ page: 1, type: 'all', search: '[' })).total, 0);
  const initial = (await agent.get('/api/dashboard')).body;
  assert.equal(initial.readiness.score, 78);
  const session = (
    await agent.post('/api/sessions').send({ peerId: 'harshit', skillId: 'docker' }).expect(201)
  ).body;
  await agent.post(`/api/sessions/${session.id}/complete`).expect(200);
  const submitted = await Promise.all(
    Array.from({ length: 3 }, () =>
      agent
        .post('/api/challenges/docker-foundations/submit')
        .send({ answers: [1, 1, 0] })
        .expect(200),
    ),
  );
  assert.equal(submitted.filter((r) => !r.body.alreadyCompleted).length, 1);
  const after = (await agent.get('/api/dashboard')).body;
  assert.equal(after.readiness.score, 83);
  assert.equal(after.balance, 150);
  assert.equal(after.user.evidence.length, 1);
  const room = (await agent.post('/api/chats').send({ peerId: 'harshit' }).expect(201)).body;
  const partner = request.agent(app);
  await partner.post('/api/auth/demo').expect(201);
  const invite = (await agent.post(`/api/chats/${room.id}/invite`).expect(200)).body;
  await partner.post(`/api/chats/${room.id}/join`).send({ token: invite.token }).expect(200);
  const clientId = randomUUID();
  await Promise.all(
    [1, 2, 3].map(() =>
      partner
        .post(`/api/chats/${room.id}/messages`)
        .send({ text: 'MongoDB chat persists', clientId })
        .expect(201),
    ),
  );
  assert.equal((await agent.get(`/api/chats/${room.id}`)).body.messages.length, 1);
  assert.equal((await partner.get('/api/chats')).body.items.length, 1);
  await agent.get('/api/learning/git-advanced').expect(403);
  await agent.post('/api/learning/premium/demo-unlock').send({ confirm: true }).expect(200);
  await agent.post('/api/learning/public-speaking-beginner/start').expect(200);
  await agent.get('/api/learning/git-advanced').expect(200);
  await partner.get('/api/learning/git-advanced').expect(403);
  const aq=(await agent.post('/api/assessments/python/start').expect(200)).body;
  await Promise.all([1,2].map(()=>agent.post(`/api/assessments/attempts/${aq.attempt.id}/submit`).send({answers:[1,0,2,1]}).expect(200)));
  await partner.get(`/api/assessments/attempts/${aq.attempt.id}`).expect(404);
  await store.close();
  await store.init(database.getUri('nexus_integration'));
  const persisted = await store.get(initial.user.id);
  assert.equal(persisted?.assessments?.length,1);
  assert.equal(persisted?.assessments?.[0].score,100);
  assert.equal(persisted?.skills.find(s=>s.id==='python')?.score,60);
  assert.equal((await agent.get(`/api/assessments/attempts/${aq.attempt.id}`)).body.review.length,4);
  assert.equal(persisted?.learningPremium?.source, 'sandbox');
  assert.equal(persisted?.skills.find((s) => s.id === 'public-speaking')?.score, 0);
  await agent.get('/api/learning/git-advanced').expect(200);
  assert.equal(persisted?.ledger.length, 2);
  assert.equal(persisted?.completedChallenges.length, 1);
  assert.equal(
    (await store.conversationOwner(room.id))?.conversations?.[0].messages[0].text,
    'MongoDB chat persists',
  );
  console.log(
    'PASS: MongoDB catalog, demo, atomic challenge rewards, chat membership/message deduplication, learning premium and skill enrollment, reconnect persistence.',
  );
} finally {
  await store.close();
  await database.stop();
}
