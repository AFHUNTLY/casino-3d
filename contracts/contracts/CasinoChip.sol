// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CasinoChip
/// @notice ERC20 in-game chip token minted by the Cashier after USDC payment.
contract CasinoChip is ERC20, Ownable {
    address public minter;

    constructor(address initialOwner) ERC20("Diamond Casino Chip", "CHIPS") Ownable(initialOwner) {}

    modifier onlyMinter() {
        require(msg.sender == minter, "CHIPS: not minter");
        _;
    }

    function setMinter(address newMinter) external onlyOwner {
        minter = newMinter;
    }

    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }
}
