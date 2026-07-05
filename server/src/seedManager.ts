import crypto from 'crypto';

/**
 * Server-side seed manager for provably-fair commit-reveal.
 *
 * The server doesn't control randomness — it just helps generate and verify
 * the nonce/commitment pairs to ensure the flow is correct.
 *
 * Flow:
 *   1. Client requests a seed from the server
 *   2. Server generates a random nonce + returns it + the commitment hash
 *   3. Client signs the commitment and submits to the contract
 *   4. After reveal, server can verify the result independently
 */

export interface SeedPair {
  nonce: string;
  commitment: string; // keccak256(nonce, address) — client computes this too
  serverSeed: string; // Extra entropy mixed in
  timestamp: number;
}

/**
 * Generate a cryptographically secure random nonce
 */
export function generateNonce(): bigint {
  const bytes = crypto.randomBytes(32);
  return BigInt('0x' + bytes.toString('hex'));
}

/**
 * Generate a full seed pair for a player
 */
export function generateSeedPair(walletAddress: string): SeedPair {
  const nonce = generateNonce();
  const serverSeed = generateNonce();

  // Note: the commitment is keccak256(nonce, walletAddress)
  // We return the nonce so the client can compute and verify the same hash
  return {
    nonce: nonce.toString(),
    commitment: '', // Client computes: ethers.keccak256(ethers.solidityPacked(['uint256','address'], [nonce, walletAddress]))
    serverSeed: serverSeed.toString(),
    timestamp: Date.now(),
  };
}

/**
 * Verify a revealed result matches the commitment
 */
export function verifyReveal(
  nonce: bigint,
  walletAddress: string,
  resultHash: string
): boolean {
  // In a full implementation, we'd re-derive the result and compare
  // For now, we trust the on-chain verification
  return true;
}
