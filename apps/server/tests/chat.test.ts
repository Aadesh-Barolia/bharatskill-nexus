import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Store } from '../src/store.js';
const options = {
  secret: 'chat-test-secret-long-enough-to-be-private',
  origin: 'http://localhost:5173',
  demo: true,
  payment: 'sandbox',
};
test('chat supports real two-way messages, once-only retries, private membership and one-use invites', async () => {
  const store = new Store();
  const app = createApp(store, options);
  const owner = request.agent(app),
    peer = request.agent(app),
    stranger = request.agent(app);
  for (const person of [owner, peer, stranger]) await person.post('/api/auth/demo').expect(201);
  await request(app).get('/api/chats').expect(401);
  const room = (await owner.post('/api/chats').send({ peerId: 'harshit' }).expect(201)).body;
  assert.equal(room.members.length, 1);
  assert.equal(room.messages.length, 0);
  assert.equal(room.inviteHash, undefined);
  assert.equal((await owner.post('/api/chats').send({ peerId: 'harshit' })).body.id, room.id);
  await stranger.get(`/api/chats/${room.id}`).expect(404);
  await stranger
    .post(`/api/chats/${room.id}/messages`)
    .send({ text: 'Uninvited', clientId: randomUUID() })
    .expect(404);
  const invite = (await owner.post(`/api/chats/${room.id}/invite`).expect(200)).body;
  await peer
    .post(`/api/chats/${room.id}/join`)
    .send({ token: 'x'.repeat(48) })
    .expect(404);
  const joined = (
    await peer.post(`/api/chats/${room.id}/join`).send({ token: invite.token }).expect(200)
  ).body;
  assert.equal(joined.members.length, 2);
  await stranger.post(`/api/chats/${room.id}/join`).send({ token: invite.token }).expect(404);
  await peer.post(`/api/chats/${room.id}/invite`).expect(403);
  const clientId = randomUUID();
  const results = await Promise.all(
    [0, 1, 2].map(() =>
      owner
        .post(`/api/chats/${room.id}/messages`)
        .send({ text: 'Can we go over Docker networking?', clientId })
        .expect(201),
    ),
  );
  assert.equal(new Set(results.map((r) => r.body.id)).size, 1);
  const reply = (
    await peer
      .post(`/api/chats/${room.id}/messages`)
      .send({ text: 'Yes! Let’s pair on it.', clientId: randomUUID() })
      .expect(201)
  ).body;
  const messages = (await owner.get(`/api/chats/${room.id}`)).body.messages;
  assert.equal(messages.length, 2);
  assert.equal(messages[1].id, reply.id);
  assert.notEqual(messages[0].senderId, messages[1].senderId);
  await owner
    .post(`/api/chats/${room.id}/messages`)
    .send({ text: '   ', clientId: randomUUID() })
    .expect(400);
  await owner
    .post(`/api/chats/${room.id}/messages`)
    .send({ text: 'x'.repeat(2001), clientId: randomUUID() })
    .expect(400);
  assert.equal((await stranger.get('/api/chats')).body.items.length, 0);
  assert.equal((await peer.get('/api/chats')).body.items.length, 1);
  assert.equal((await owner.get('/api/dashboard')).body.user.conversations, undefined);
  await owner.post('/api/demo/reset').expect(200);
  assert.equal((await peer.get(`/api/chats/${room.id}`)).body.messages.length, 2);
});
test('chat file history survives reopening the store', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'nexus-chat-'));
  try {
    const file = join(folder, 'state.json');
    const store = new Store('file', file);
    await store.init();
    const app = createApp(store, options);
    const owner = request.agent(app);
    await owner.post('/api/auth/demo');
    const room = (await owner.post('/api/chats').send({ peerId: 'mouli' })).body;
    await owner
      .post(`/api/chats/${room.id}/messages`)
      .send({ text: 'Saved conversation', clientId: randomUUID() })
      .expect(201);
    const reopened = new Store('file', file);
    await reopened.init();
    const record = await reopened.conversationOwner(room.id);
    assert.equal(record?.conversations?.[0].messages[0].text, 'Saved conversation');
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
