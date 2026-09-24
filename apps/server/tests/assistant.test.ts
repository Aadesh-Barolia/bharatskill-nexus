import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { Store } from '../src/store.js';
import { createApp } from '../src/app.js';
import { explain } from '../src/explanations.js';
import { seedUser, opportunities } from '../src/catalog.js';
const options = {
  secret: 'testing-only-secret-long-enough-for-session',
  origin: 'http://localhost:5173',
  demo: true,
  payment: 'sandbox',
};
test('personal coach requires auth, validates input and never mutates progress', async () => {
  const saved = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const app = createApp(new Store(), options),
      a = request.agent(app);
    await request(app)
      .post('/api/assistant')
      .send({ question: 'What next?', opportunityId: 'swe-intern' })
      .expect(401);
    await a.post('/api/auth/demo').expect(201);
    const before = (await a.get('/api/dashboard')).body;
    await a.post('/api/assistant').send({ question: 'x', opportunityId: 'swe-intern' }).expect(400);
    await a
      .post('/api/assistant')
      .send({ question: 'What next?', opportunityId: 'missing' })
      .expect(404);
    const answer = (
      await a
        .post('/api/assistant')
        .send({ question: 'How do I earn and use credits?', opportunityId: 'swe-intern' })
        .expect(200)
    ).body;
    assert.equal(answer.provider, 'deterministic-template');
    assert.match(answer.summary, /120 SkillCredits/);
    assert.match(answer.summary, /not implemented/);
    assert.equal(answer.readiness.score, 78);
    const next = (
      await a
        .post('/api/assistant')
        .send({ question: 'Help me learn Docker', opportunityId: 'swe-intern' })
        .expect(200)
    ).body;
    assert.match(next.summary, /Docker/);
    assert.match(next.summary, /0\/100/);
    const after = (await a.get('/api/dashboard')).body;
    assert.deepEqual(after.user, before.user);
  } finally {
    if (saved === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = saved;
  }
});
test('AI receives only learning context and returns a labelled validated answer', async () => {
  const original = globalThis.fetch,
    saved = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key-not-real';
  try {
    let input = '';
    globalThis.fetch = async (_url, init) => {
      input = String(init?.body);
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      summary: 'Practice one Docker container and explain its port mapping.',
                      nextActions: ['Review images and containers.'],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200 },
      );
    };
    const u = seedUser('coach-test');
    u.passwordHash = 'private-hash';
    const answer = await explain(u, opportunities[0], 'Help with Docker');
    assert.equal(answer.provider, 'gemini');
    assert.equal(answer.readiness.score, 78);
    assert.match(input, /Help with Docker/);
    assert.ok(!input.includes('private-hash'));
    assert.ok(!input.includes(u.email));
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: 'not valid JSON' }] } }] }),
      );
    const fallback = await explain(u, opportunities[0], 'What counts as proof?');
    assert.equal(fallback.provider, 'template-fallback');
    assert.match(fallback.summary, /not accredited certificates/);
  } finally {
    globalThis.fetch = original;
    if (saved === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = saved;
  }
});
