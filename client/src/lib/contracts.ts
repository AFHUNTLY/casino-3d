'use client';

// Base Sepolia chain configuration
export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
export const BASE_SEPOLIA_EXPLORER = 'https://sepolia.basescan.org';

// Contract addresses — update after deployment
export const CONTRACTS = {
  casinoRouter: process.env.NEXT_PUBLIC_CASINO_ROUTER || '',
  provablyFair: process.env.NEXT_PUBLIC_PROVABLY_FAIR || '',
  slotsGame: process.env.NEXT_PUBLIC_SLOTS_GAME || '',
  blackjackGame: process.env.NEXT_PUBLIC_BLACKJACK_GAME || '',
} as const;

// Contract ABIs (minimal — just what the client needs)
export const CASINO_ROUTER_ABI = [
  'function deposit() payable',
  'function withdraw(uint256 amount) external',
  'function getBalance(address player) view returns (uint256)',
  'event Deposit(address indexed player, uint256 amount)',
  'event Withdrawal(address indexed player, uint256 amount)',
];

export const PROVABLY_FAIR_ABI = [
  'function commit(bytes32 commitment) external payable',
  'function reveal(uint256 nonce) external',
  'function getCommitment(address player) view returns (bytes32)',
  'function getRevealBlock(address player) view returns (uint256)',
  'event Committed(address indexed player, bytes32 commitment, uint256 amount)',
  'event Revealed(address indexed player, uint256 nonce, uint256 result)',
];

export const SLOTS_GAME_ABI = [
  'function spin(uint256 betAmount, bytes32 commitment) external payable',
  'function getLastResult(address player) view returns (uint8)',
  'function getPayout(uint8 result) pure returns (uint256)',
  'event SpinResult(address indexed player, uint8 result, uint256 payout)',
];

export const BLACKJACK_GAME_ABI = [
  'function startGame(uint256 betAmount, bytes32 commitment) external payable',
  'function hit() external',
  'function stand() external',
  'function getHand(address player) view returns (uint8[] memory, uint8[] memory)',
  'event DealResult(address indexed player, uint8[] playerCards, uint8[] dealerCards)',
  'event GameResult(address indexed player, bool won, uint256 payout)',
];

// Network config for wallet switching
export const BASE_SEPOLIA_PARAMS = {
  chainId: '0x' + BASE_SEPOLIA_CHAIN_ID.toString(16),
  chainName: 'Base Sepolia Testnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: [BASE_SEPOLIA_RPC],
  blockExplorerUrls: [BASE_SEPOLIA_EXPLORER],
};
