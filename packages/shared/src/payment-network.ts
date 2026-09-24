// GoPlausible currently advertises the full Testnet genesis hash on /supported.
// @x402/avm normalizes this legacy alias internally to the newer CAIP identifier.
// Register this explicit Testnet alias on both sides; never register mainnet.
export const TESTNET_FACILITATOR_NETWORK =
  'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=' as const;
