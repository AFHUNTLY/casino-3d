// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CasinoRouter.sol";
import "./ProvablyFair.sol";

/**
 * @title BlackjackGame
 * @notice On-chain Blackjack with provably-fair dealing via commit-reveal.
 *
 * Simplified flow (to minimize gas while maintaining fairness):
 *   1. Player calls startGame(nonce) with bet — commits nonce, deck is derived from reveal
 *   2. After reveal, initial hand is dealt (2 cards player, 2 cards dealer)
 *   3. Player calls hit() or stand()
 *   4. On bust or stand, dealer plays, game settles
 *
 * Card encoding: 0-12 = A,2,3,4,5,6,7,8,9,10,J,Q,K (values: A=1 or 11, J/Q/K=10)
 */
contract BlackjackGame {
    CasinoRouter public router;
    ProvablyFair public fairness;

    enum GameState { Idle, WaitingReveal, PlayerTurn, DealerTurn, Resolved }
    enum Outcome { None, PlayerWin, DealerWin, Push, Blackjack }

    struct Game {
        GameState state;
        uint256 bet;
        uint256 nonce;
        uint8[] playerHand;
        uint8[] dealerHand;
        uint8 cardIndex;     // How many cards drawn from the "deck"
        Outcome outcome;
    }

    mapping(address => Game) public games;
    mapping(address => uint256) public deckSeeds;

    // ===== Events =====
    event GameStarted(address indexed player, uint256 bet, bytes32 commitment);
    event CardDealt(address indexed player, bool isPlayer, uint8 card);
    event PlayerHit(address indexed player);
    event PlayerStand(address indexed player);
    event GameSettled(address indexed player, Outcome outcome, uint256 payout);

    constructor(address payable _router, address _fairness) {
        router = CasinoRouter(_router);
        fairness = ProvablyFair(_fairness);
    }

    /// @notice Start a new game — commits the nonce and locks the bet
    function startGame(uint256 nonce) external payable {
        require(msg.value > 0, "Must bet something");
        require(games[msg.sender].state == GameState.Idle || games[msg.sender].state == GameState.Resolved, "Game in progress");

        bytes32 commitment = keccak256(abi.encodePacked(nonce, msg.sender));

        games[msg.sender] = Game({
            state: GameState.WaitingReveal,
            bet: msg.value,
            nonce: nonce,
            playerHand: new uint8[](0),
            dealerHand: new uint8[](0),
            cardIndex: 0,
            outcome: Outcome.None
        });

        fairness.commit{value: msg.value}(commitment);

        emit GameStarted(msg.sender, msg.value, commitment);
    }

    /// @notice Reveal nonce and deal initial hands
    function revealAndDeal() external {
        Game storage g = games[msg.sender];
        require(g.state == GameState.WaitingReveal, "Not waiting for reveal");

        fairness.reveal(g.nonce);
        uint256 seed = fairness.deriveResult(msg.sender, g.nonce);
        deckSeeds[msg.sender] = seed;

        // Deal 2 cards each: player-dealer-player-dealer
        g.playerHand.push(drawCard(seed, g.cardIndex++));
        g.dealerHand.push(drawCard(seed, g.cardIndex++));
        g.playerHand.push(drawCard(seed, g.cardIndex++));
        g.dealerHand.push(drawCard(seed, g.cardIndex++));

        emit CardDealt(msg.sender, true, g.playerHand[0]);
        emit CardDealt(msg.sender, false, g.dealerHand[0]);
        emit CardDealt(msg.sender, true, g.playerHand[1]);
        emit CardDealt(msg.sender, false, g.dealerHand[1]);

        // Check for natural blackjack
        if (handValue(g.playerHand) == 21) {
            if (handValue(g.dealerHand) == 21) {
                g.outcome = Outcome.Push;
            } else {
                g.outcome = Outcome.Blackjack;
            }
            g.state = GameState.Resolved;
            _settle(msg.sender);
            return;
        }

        g.state = GameState.PlayerTurn;
    }

    /// @notice Player takes another card
    function hit() external {
        Game storage g = games[msg.sender];
        require(g.state == GameState.PlayerTurn, "Not player turn");

        uint8 card = drawCard(deckSeeds[msg.sender], g.cardIndex++);
        g.playerHand.push(card);
        emit CardDealt(msg.sender, true, card);

        uint8 val = handValue(g.playerHand);
        if (val > 21) {
            // Bust
            g.outcome = Outcome.DealerWin;
            g.state = GameState.Resolved;
            _settle(msg.sender);
        } else if (val == 21) {
            // Auto-stand on 21
            _dealerPlay(msg.sender);
        }
    }

    /// @notice Player stands — dealer plays
    function stand() external {
        Game storage g = games[msg.sender];
        require(g.state == GameState.PlayerTurn, "Not player turn");
        _dealerPlay(msg.sender);
    }

    /// @notice Dealer draws until 17+
    function _dealerPlay(address player) internal {
        Game storage g = games[player];

        while (handValue(g.dealerHand) < 17) {
            uint8 card = drawCard(deckSeeds[player], g.cardIndex++);
            g.dealerHand.push(card);
            emit CardDealt(player, false, card);
        }

        uint8 playerVal = handValue(g.playerHand);
        uint8 dealerVal = handValue(g.dealerHand);

        if (dealerVal > 21 || playerVal > dealerVal) {
            g.outcome = Outcome.PlayerWin;
        } else if (dealerVal > playerVal) {
            g.outcome = Outcome.DealerWin;
        } else {
            g.outcome = Outcome.Push;
        }

        g.state = GameState.Resolved;
        _settle(player);
    }

    /// @notice Settle the game and pay out
    function _settle(address player) internal {
        Game storage g = games[player];
        uint256 payout = 0;

        if (g.outcome == Outcome.PlayerWin) {
            payout = g.bet * 2; // 1:1
        } else if (g.outcome == Outcome.Blackjack) {
            payout = (g.bet * 5) / 2; // 3:2
        } else if (g.outcome == Outcome.Push) {
            payout = g.bet; // Return bet
        }
        // DealerWin: payout = 0

        router.settleBet{value: payout}(player, g.bet, payout);

        fairness.clearCommitment(player);

        emit GameSettled(player, g.outcome, payout);
    }

    /// @notice Derive a card (0-12) from the seed at given index
    function drawCard(uint256 seed, uint8 index) internal pure returns (uint8) {
        uint256 cardHash = uint256(keccak256(abi.encodePacked(seed, index)));
        return uint8(cardHash % 13);
    }

    /// @notice Calculate best hand value (handling aces as 1 or 11)
    function handValue(uint8[] memory hand) public pure returns (uint8) {
        uint8 total = 0;
        uint8 aces = 0;

        for (uint i = 0; i < hand.length; i++) {
            uint8 card = hand[i];
            if (card == 0) {
                // Ace
                aces++;
                total += 11;
            } else if (card >= 10) {
                // J, Q, K
                total += 10;
            } else {
                total += card + 1; // card 1 = value 2, etc.
            }
        }

        // Convert aces from 11 to 1 if busting
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }

        return total;
    }

    // ===== View functions =====

    function getHand(address player) external view returns (uint8[] memory, uint8[] memory) {
        return (games[player].playerHand, games[player].dealerHand);
    }

    function getGameState(address player) external view returns (GameState, Outcome, uint256) {
        return (games[player].state, games[player].outcome, games[player].bet);
    }

    receive() external payable {}
}
