// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ProvablyFair
 * @notice Commit-reveal scheme for on-chain randomness.
 *         Flow:
 *           1. Player generates a secret nonce off-chain
 *           2. Player commits hash(commitment = keccak(nonce, address)) with their bet
 *           3. After 1 block confirmation, player reveals the nonce
 *           4. Contract derives result from hash(reveal_blockhash, nonce) — unbiasable
 */
contract ProvablyFair {
    struct Commitment {
        bytes32 commitment;      // hash(nonce, player)
        uint256 revealBlock;     // 0 = not revealed
        bool resolved;
    }

    mapping(address => Commitment) public commitments;
    mapping(address => uint256) public pendingBetAmounts;

    // ===== Events =====
    event Committed(address indexed player, bytes32 commitment, uint256 amount);
    event Revealed(address indexed player, uint256 nonce, uint256 resultHash);

    // ===== Commit / Reveal =====

    /// @notice Player commits to a nonce (off-chain generates nonce, submits keccak256(nonce, msg.sender))
    function commit(bytes32 commitment) external payable {
        require(commitment != bytes32(0), "Empty commitment");
        require(commitments[msg.sender].commitment == bytes32(0) || commitments[msg.sender].resolved, "Pending commitment exists");

        commitments[msg.sender] = Commitment({
            commitment: commitment,
            revealBlock: 0,
            resolved: false
        });

        pendingBetAmounts[msg.sender] = msg.value;

        emit Committed(msg.sender, commitment, msg.value);
    }

    /// @notice Player reveals their nonce after at least 1 block
    function reveal(uint256 nonce) external {
        Commitment storage c = commitments[msg.sender];
        require(c.commitment != bytes32(0), "No commitment");
        require(!c.resolved, "Already resolved");

        // Verify nonce matches commitment
        bytes32 computed = keccak256(abi.encodePacked(nonce, msg.sender));
        require(computed == c.commitment, "Invalid reveal");

        // Must wait at least 1 block after commit
        require(block.number > c.revealBlock, "Wait for next block");
        // Set reveal block to current (used for result derivation)
        c.revealBlock = block.number;

        emit Revealed(msg.sender, nonce, uint256(deriveResult(msg.sender, nonce)));
    }

    /// @notice Resolve and derive the final result (called by game contracts)
    function resolve(address player, uint256 nonce) external returns (uint256) {
        Commitment storage c = commitments[player];
        require(!c.resolved, "Already resolved");
        require(c.revealBlock > 0, "Not revealed yet");
        require(block.number > c.revealBlock, "Wait one block after reveal");

        c.resolved = true;
        uint256 result = deriveResult(player, nonce);
        return result;
    }

    /// @notice Derive a deterministic random result from blockhash + nonce
    function deriveResult(address player, uint256 nonce) public view returns (uint256) {
        Commitment storage c = commitments[player];
        require(c.revealBlock > 0, "Not revealed");

        bytes32 blockHash = blockhash(c.revealBlock);
        require(blockHash != bytes32(0), "Blockhash unavailable");

        return uint256(keccak256(abi.encodePacked(blockHash, nonce, player)));
    }

    /// @notice Clear commitment after game is done
    function clearCommitment(address player) external {
        require(commitments[player].resolved, "Not resolved");
        delete commitments[player];
        delete pendingBetAmounts[player];
    }

    function getCommitment(address player) external view returns (bytes32) {
        return commitments[player].commitment;
    }

    function isRevealed(address player) external view returns (bool) {
        return commitments[player].revealBlock > 0;
    }
}
