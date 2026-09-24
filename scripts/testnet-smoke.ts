import assert from 'node:assert/strict';
import { generateAccount } from 'algosdk';
import request from 'supertest';
import { Store } from '../apps/server/src/store.js';
import { createApp } from '../apps/server/src/app.js';
// Unpaid protocol check only: no payer, funding, signing or settlement.
process.env.AVM_ADDRESS = generateAccount().addr.toString();
const app = createApp(new Store(), {
  secret: 'testnet-protocol-test-at-least-32-characters',
  origin: 'http://localhost:5173',
  demo: true,
  payment: 'testnet',
});
const agent = request.agent(app);
await agent.post('/api/auth/demo').expect(201);
const response = await agent
  .post('/api/premium/deep-readiness-analysis')
  .send({ opportunityId: 'swe-intern' })
  .expect(402);
assert.ok(response.headers['payment-required']);
const required = JSON.parse(Buffer.from(response.headers['payment-required'], 'base64').toString());
assert.equal(required.x402Version, 2);
assert.ok(required.accepts.some((a: { network: string }) => a.network.startsWith('algorand:')));
await agent.post('/api/payments/forged/sandbox-settle').expect(403);
console.log(
  'PASS: actual SDK returned x402 v2 Algorand PAYMENT-REQUIRED; sandbox settlement blocked. No transaction signed or settled.',
);
