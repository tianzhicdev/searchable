// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDZ is ERC20 {
    constructor(uint256 initialSupply) ERC20("USDZ", "USDZ") {
        _mint(msg.sender, initialSupply);
    }
}