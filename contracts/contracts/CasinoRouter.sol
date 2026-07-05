// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CasinoRouter
 * @notice Central contract for managing player deposits, withdrawals, and balances.
 *         Acts as the vault — actual game logic lives in separate game contracts
 *         that are authorized to debit/credit player balances.
 */
contract CasinoRouter {
    // Player balances (in wei)
    mapping(address => uint256) public balances;

    // Authorized game contracts that can settle bets
    mapping(address => bool) public authorizedGames;

    address public owner;

    // ===== Events =====
    event Deposit(address indexed player, uint256 amount);
    event Withdrawal(address indexed player, uint256 amount);
    event GameAuthorized(address indexed game);
    event GameDeauthorized(address indexed game);
    event BetSettled(address indexed player, uint256 betAmount, uint256 payout, bool won);

    // ===== Modifiers =====
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedGames[msg.sender], "Not authorized game");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ===== Deposit / Withdraw =====

    function deposit() external payable {
        require(msg.value > 0, "Must deposit ETH");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Transfer failed");
        emit Withdrawal(msg.sender, amount);
    }

    // ===== Game Contract Interface =====

    /// @notice Debit a player's balance (called by game contract when bet is placed)
    function debit(address player, uint256 amount) external onlyAuthorized {
        require(balances[player] >= amount, "Insufficient balance");
        balances[player] -= amount;
    }

    /// @notice Credit a player's balance (called by game contract when they win)
    function credit(address player, uint256 amount) external onlyAuthorized {
        balances[player] += amount;
        emit BetSettled(player, amount, amount, true);
    }

    /// @notice Full settlement: debit bet, credit payout atomically
    function settleBet(
        address player,
        uint256 betAmount,
        uint256 payout
    ) external payable onlyAuthorized {
        require(balances[player] >= betAmount, "Insufficient balance");
        balances[player] -= betAmount;
        if (payout > 0) {
            balances[player] += payout;
        }
        emit BetSettled(player, betAmount, payout, payout > betAmount);
    }

    // ===== Admin =====

    function authorizeGame(address game) external onlyOwner {
        authorizedGames[game] = true;
        emit GameAuthorized(game);
    }

    function deauthorizeGame(address game) external onlyOwner {
        authorizedGames[game] = false;
        emit GameDeauthorized(game);
    }

    /// @notice Emergency withdraw — for owner to recover stuck funds
    function emergencyWithdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        (bool ok, ) = payable(owner).call{value: bal}("");
        require(ok, "Transfer failed");
    }

    function getBalance(address player) external view returns (uint256) {
        return balances[player];
    }

    receive() external payable {
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
}
