import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { ExactAvmScheme } from '@x402/avm/exact/server';
import { USDC_TESTNET_ASA_ID } from '@x402/avm';
import { TESTNET_FACILITATOR_NETWORK } from '../../../packages/shared/src/payment-network.js';
import { isValidAddress } from 'algosdk';
export function testnetMiddleware() {
  const address = process.env.AVM_ADDRESS;
  if (!address || !isValidAddress(address))
    throw Error('Testnet payments require a valid AVM_ADDRESS');
  const server = new x402ResourceServer(
    new HTTPFacilitatorClient({
      url: process.env.X402_FACILITATOR_URL || 'https://facilitator.goplausible.xyz',
    }),
  );
  server.register(TESTNET_FACILITATOR_NETWORK, new ExactAvmScheme());
  return paymentMiddleware(
    {
      'POST /api/premium/deep-readiness-analysis': {
        accepts: [
          {
            scheme: 'exact',
            price: '$0.005',
            network: TESTNET_FACILITATOR_NETWORK,
            payTo: address,
            extra: { asset: USDC_TESTNET_ASA_ID },
          },
        ],
        description: 'BharatSkill Nexus deep opportunity readiness analysis',
        mimeType: 'application/json',
      },
    },
    server,
  );
}
