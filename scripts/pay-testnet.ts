import 'dotenv/config';
import { mnemonicToSecretKey } from 'algosdk';
import { x402Client, wrapFetchWithPayment, x402HTTPClient } from '@x402/fetch';
import { toClientAvmSigner } from '@x402/avm';
import { TESTNET_FACILITATOR_NETWORK } from '../packages/shared/src/payment-network.js';
import { ExactAvmScheme } from '@x402/avm/exact/client';

// Deliberately separate from the browser and never invoked automatically.
if (!process.argv.includes('--confirm-testnet-payment'))
  throw Error(
    'To spend Testnet USDC, run with --confirm-testnet-payment. No mainnet network is registered.',
  );
const endpoint = process.env.PUBLIC_API_URL || 'http://localhost:4000';
if (!process.env.AVM_MNEMONIC) throw Error('Set AVM_MNEMONIC locally. Never commit it.');
const health = await fetch(`${endpoint}/api/health`).then((r) => r.json());
if (health.payment !== 'testnet') throw Error('Server must have PAYMENT_MODE=testnet');
let session = process.env.NEXUS_SESSION;
if (!session) {
  const login = await fetch(`${endpoint}/api/auth/demo`, { method: 'POST' });
  if (!login.ok)
    throw Error(
      'Set NEXUS_SESSION to the browser session cookie value when demo login is disabled.',
    );
  session = login.headers
    .getSetCookie()
    .find((c) => c.startsWith('nexus_session='))
    ?.split(';')[0]
    .slice('nexus_session='.length);
}
if (!session) throw Error('A signed-in session is required');
const account = mnemonicToSecretKey(process.env.AVM_MNEMONIC);
const client = new x402Client().register(
  TESTNET_FACILITATOR_NETWORK,
  new ExactAvmScheme(toClientAvmSigner(Buffer.from(account.sk).toString('base64'))),
);
const paidFetch = wrapFetchWithPayment(fetch, client);
const response = await paidFetch(`${endpoint}/api/premium/deep-readiness-analysis`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: `nexus_session=${session}` },
  body: JSON.stringify({ opportunityId: 'swe-intern' }),
});
if (!response.ok) throw Error(`Analysis failed with HTTP ${response.status}`);
const settlement = new x402HTTPClient(client).getPaymentSettleResponse((name) =>
  response.headers.get(name),
);
console.log('Settlement:', JSON.stringify(settlement, null, 2));
console.log('Analysis:', JSON.stringify(await response.json(), null, 2));
