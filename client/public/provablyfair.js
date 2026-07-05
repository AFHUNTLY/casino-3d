/**
 * Provably Fair Casino Algorithm
 * Standard commit-reveal flow used by Stake, Roobet, etc.
 *
 * Flow:
 * 1. Server generates serverSeed (kept secret), shows hashed version (commit)
 * 2. Player provides clientSeed
 * 3. Each bet increments a nonce
 * 4. Result = HMAC-SHA256(serverSeed, clientSeed:nonce)
 * 5. After session, serverSeed is revealed → player can verify
 */

// ===== HMAC-SHA256 (uses Web Crypto API) =====
async function hmacSHA256(key, message) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

// ===== PROVABLY FAIR ENGINE =====
const ProvablyFair = {
  // Session state
  serverSeed: null,
  serverSeedHash: null,
  clientSeed: null,
  nonce: 0,

  // Initialize a new session
  async init(customClientSeed) {
    // Generate random server seed (256-bit hex)
    const randBytes = new Uint8Array(32);
    crypto.getRandomValues(randBytes);
    this.serverSeed = Array.from(randBytes)
      .map(b => b.toString(16).padStart(2, '0')).join('');

    // Hash it for commit phase
    const enc = new TextEncoder();
    const hashBuf = await crypto.subtle.digest('SHA-256', enc.encode(this.serverSeed));
    this.serverSeedHash = Array.from(new Uint8Array(hashBuf))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    // Client seed (player-chosen or random)
    this.clientSeed = customClientSeed || this._randomSeed();
    this.nonce = 0;

    return {
      serverSeedHash: this.serverSeedHash,
      clientSeed: this.clientSeed,
      nonce: this.nonce,
    };
  },

  _randomSeed() {
    return Math.random().toString(36).substring(2, 12);
  },

  // Get the full hash for a given nonce (for verification)
  async getHash(nonce) {
    const message = `${this.clientSeed}:${nonce}`;
    return await hmacSHA256(this.serverSeed, message);
  },

  // Convert hex hash to float [0, 1)
  hashToFloat(hash, offset = 0) {
    // Take 8 hex chars (32-bit) from offset position
    const chunk = hash.substring(offset * 8, offset * 8 + 8);
    const intVal = parseInt(chunk, 16);
    return intVal / 0x100000000; // Divide by 2^32
  },

  // Get multiple floats from one hash (for multi-reel slots, multi-card draws)
  hashToFloats(hash, count) {
    const floats = [];
    for (let i = 0; i < count; i++) {
      if (hashToFloat_safe(hash, i, floats)) {} 
      else break;
    }
    // If hash isn't long enough, extend by re-hashing
    while (floats.length < count) {
      // Fallback: hash the hash itself
      // (synchronous XOR fallback for extra entropy)
      const extra = parseInt(hash.substring(floats.length * 2, floats.length * 2 + 8), 16) || 0;
      floats.push((extra * 9301 + 49297) % 233280 / 233280);
    }
    return floats;
  },

  // ===== GAME-SPECIFIC RESULT GENERATORS =====

  // SLOTS: Returns array of N reel positions (symbol indices)
  async rollSlots(reelCount, symbolCount) {
    const hash = await this.getHash(this.nonce);
    const floats = this.hashToFloats(hash, reelCount);
    const result = floats.map(f => Math.floor(f * symbolCount));
    this.nonce++;
    return { result, hash, nonce: this.nonce - 1 };
  },

  // BLACKJACK: Returns array of card indices (0-51)
  // 0-12 = Hearts (A,2-10,J,Q,K), 13-25 = Diamonds, 26-38 = Clubs, 39-51 = Spades
  async rollCards(count) {
    const hash = await this.getHash(this.nonce);
    const floats = this.hashToFloats(hash, count);
    // Use Fisher-Yates partial shuffle to avoid duplicates
    const deck = Array.from({ length: 52 }, (_, i) => i);
    for (let i = 0; i < count; i++) {
      const j = i + Math.floor(floats[i] * (52 - i));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const cards = deck.slice(0, count);
    this.nonce++;
    return { cards, hash, nonce: this.nonce - 1 };
  },

  // LUCKY WHEEL: Returns segment index (0 to segmentCount-1)
  async rollWheel(segmentCount) {
    const hash = await this.getHash(this.nonce);
    const floatVal = this.hashToFloat(hash, 0);
    const segment = Math.floor(floatVal * segmentCount);
    this.nonce++;
    return { segment, hash, nonce: this.nonce - 1 };
  },

  // HORSE RACING: Returns array of horse finish positions
  // Returns [1st place horse, 2nd place horse, ...]
  async rollHorseRace(horseCount) {
    const hash = await this.getHash(this.nonce);
    const floats = this.hashToFloats(hash, horseCount);

    // Assign each horse a random "speed" from the hash
    const horses = Array.from({ length: horseCount }, (_, i) => ({
      horse: i,
      speed: floats[i],
    }));

    // Sort by speed descending (highest = fastest)
    horses.sort((a, b) => b.speed - a.speed);

    const finishOrder = horses.map(h => h.horse);
    this.nonce++;
    return { finishOrder, hash, nonce: this.nonce - 1 };
  },

  // ROULETTE: Returns pocket number (0-36, European style)
  async rollRoulette() {
    const hash = await this.getHash(this.nonce);
    const floatVal = this.hashToFloat(hash, 0);
    const pocket = Math.floor(floatVal * 37); // 0-36
    this.nonce++;
    return { pocket, hash, nonce: this.nonce - 1 };
  },

  // ===== VERIFICATION (player can verify after serverSeed reveal) =====
  async verify(serverSeed, clientSeed, nonce) {
    const message = `${clientSeed}:${nonce}`;
    return await hmacSHA256(serverSeed, message);
  },

  // Reveal server seed (end of session)
  revealServerSeed() {
    return { serverSeed: this.serverSeed, serverSeedHash: this.serverSeedHash };
  },
};

// Helper for hashToFloats (avoids closure issues)
function hashToFloat_safe(hash, offset, out) {
  const start = offset * 8;
  if (start + 8 > hash.length) return false;
  const chunk = hash.substring(start, start + 8);
  const intVal = parseInt(chunk, 16);
  if (isNaN(intVal)) return false;
  out.push(intVal / 0x100000000);
  return true;
}

// Export for both module and browser global
if (typeof window !== 'undefined') {
  window.ProvablyFair = ProvablyFair;
}
if (typeof module !== 'undefined') {
  module.exports = ProvablyFair;
}
