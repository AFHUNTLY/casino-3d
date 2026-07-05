# 3D Onchain Casino

A first-person 3D casino experience built with PlayCanvas Engine, Next.js, and Base Sepolia blockchain.

## Architecture

```
casino-3d/
├── client/     # Next.js + PlayCanvas 3D frontend
├── contracts/  # Solidity smart contracts (Hardhat)
├── server/     # Node.js backend (Express + WebSocket + SQLite)
```

## Tech Stack

- **3D Engine**: PlayCanvas Engine (code-only via npm)
- **Frontend**: Next.js 14 + ethers.js v6
- **Blockchain**: Base Sepolia (L2)
- **Backend**: Node.js + Express + WebSocket + SQLite
- **Hosting**: Vercel (client), VPS (backend)

## Quick Start

```bash
# Install everything
npm install

# Run client + server together
npm run dev

# Or separately:
npm run dev:client   # → localhost:3000
npm run dev:server   # → localhost:3001
```

## Smart Contracts

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
```

## Games

- **Slots** — 3D slot machine with on-chain spin results
- **Blackjack** — Classic 21 with provably fair dealing

## License

MIT
