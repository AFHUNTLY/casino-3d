// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CasinoChip.sol";

/// @title ChipCashier
/// @notice Takes USDC and mints CHIPS at a configurable rate.
contract ChipCashier is Ownable {
    IERC20 public immutable usdc;
    CasinoChip public immutable chips;
    address public treasury;
    uint256 public chipsPerUsdc; // CHIPS token units per 1 USDC (6 decimals)

    event ChipsPurchased(address indexed buyer, uint256 usdcAmount, uint256 chipAmount);

    constructor(address initialOwner, address usdc_, address chips_, address treasury_, uint256 chipsPerUsdc_) Ownable(initialOwner) {
        require(usdc_ != address(0) && chips_ != address(0) && treasury_ != address(0), "Cashier: zero address");
        usdc = IERC20(usdc_);
        chips = CasinoChip(chips_);
        treasury = treasury_;
        chipsPerUsdc = chipsPerUsdc_;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Cashier: zero treasury");
        treasury = newTreasury;
    }

    function setRate(uint256 newChipsPerUsdc) external onlyOwner {
        require(newChipsPerUsdc > 0, "Cashier: zero rate");
        chipsPerUsdc = newChipsPerUsdc;
    }

    function buy(uint256 usdcAmount) external {
        require(usdcAmount > 0, "Cashier: zero amount");
        require(usdc.transferFrom(msg.sender, treasury, usdcAmount), "Cashier: USDC transfer failed");
        uint256 chipAmount = (usdcAmount * chipsPerUsdc) / 1e6;
        chips.mint(msg.sender, chipAmount);
        emit ChipsPurchased(msg.sender, usdcAmount, chipAmount);
    }
}
