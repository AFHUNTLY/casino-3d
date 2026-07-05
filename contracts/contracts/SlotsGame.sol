// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CasinoRouter.sol";
import "./ProvablyFair.sol";

/**
 * @title SlotsGame
 * @notice On-chain slot machine with provably-fair spin results.
 *
 * Symbols (8 total): 🍒(0) 🍋(1) 🔔(2) ⭐(3) 💎(4) 7️⃣(5) BAR(6) WILD(7)
 *
 * Payout table (multiplier of bet):
 *   3x 🍒 = 2x    3x 🍋 = 3x    3x 🔔 = 5x
 *   3x ⭐ = 10x   3x 💎 = 20x   3x 7️⃣ = 50x
 *   3x BAR = 100x 3x WILD = 500x
 *   Any 2 matching adjacent = 0.5x (partial)
 */
contract SlotsGame {
    CasinoRouter public router;
    ProvablyFair public fairness;

    // 3 reels, each result is 0-7
    struct SpinResult {
        uint8[3] symbols;
        uint256 payout;
        bool resolved;
    }

    mapping(address => SpinResult) public lastSpin;

    // Game state per player
    enum GameState { Idle, Committed, Revealed, Resolved }
    mapping(address => GameState) public playerState;
    mapping(address => uint256) public betAmounts;
    mapping(address => uint256) public nonces;

    // ===== Events =====
    event SpinStarted(address indexed player, uint256 betAmount, bytes32 commitment);
    event SpinResultEvent(address indexed player, uint8[3] symbols, uint256 payout);

    constructor(address payable _router, address _fairness) {
        router = CasinoRouter(_router);
        fairness = ProvablyFair(_fairness);
    }

    /// @notice Start a spin: commit + lock the bet
    /// @param nonce Secret nonce (player should pass keccak256(nonce, msg.sender) as commitment)
    function spin(uint256 nonce) external payable {
        require(playerState[msg.sender] == GameState.Idle || playerState[msg.sender] == GameState.Resolved, "Spin in progress");
        require(msg.value > 0, "Must bet something");

        bytes32 commitment = keccak256(abi.encodePacked(nonce, msg.sender));

        betAmounts[msg.sender] = msg.value;
        nonces[msg.sender] = nonce;
        playerState[msg.sender] = GameState.Committed;

        // Commit to fairness contract
        fairness.commit{value: msg.value}(commitment);

        emit SpinStarted(msg.sender, msg.value, commitment);
    }

    /// @notice Reveal the nonce (after 1 block)
    function revealSpin() external {
        require(playerState[msg.sender] == GameState.Committed, "Not committed");
        fairness.reveal(nonces[msg.sender]);
        playerState[msg.sender] = GameState.Revealed;
    }

    /// @notice Settle the spin and pay out
    function settleSpin() external {
        require(playerState[msg.sender] == GameState.Revealed, "Not revealed");

        uint256 rawResult = fairness.resolve(msg.sender, nonces[msg.sender]);

        // Derive 3 symbols from the random result
        uint8[3] memory symbols;
        symbols[0] = uint8(rawResult % 8);
        symbols[1] = uint8((rawResult / 8) % 8);
        symbols[2] = uint8((rawResult / 64) % 8);

        // Calculate payout
        uint256 bet = betAmounts[msg.sender];
        uint256 payout = calculatePayout(symbols, bet);

        // Settle via router
        router.settleBet{value: payout}(msg.sender, bet, payout);

        lastSpin[msg.sender] = SpinResult(symbols, payout, true);
        playerState[msg.sender] = GameState.Resolved;

        // Cleanup
        fairness.clearCommitment(msg.sender);

        emit SpinResultEvent(msg.sender, symbols, payout);
    }

    /// @notice Calculate payout for 3 symbols
    function calculatePayout(uint8[3] memory symbols, uint256 bet) public pure returns (uint256) {
        // All 3 match
        if (symbols[0] == symbols[1] && symbols[1] == symbols[2]) {
            uint16[8] memory multipliers = [2, 3, 5, 10, 20, 50, 100, 500];
            return (bet * multipliers[symbols[0]]) / 1;
        }
        // 2 adjacent match (partial win)
        if (symbols[0] == symbols[1] || symbols[1] == symbols[2]) {
            return bet / 2; // 0.5x
        }
        return 0;
    }

    function getLastResult(address player) external view returns (uint8[3] memory symbols, uint256 payout) {
        SpinResult storage result = lastSpin[player];
        return (result.symbols, result.payout);
    }

    function getPlayerState(address player) external view returns (GameState) {
        return playerState[player];
    }

    // Accept funds from router settlements
    receive() external payable {}
}
