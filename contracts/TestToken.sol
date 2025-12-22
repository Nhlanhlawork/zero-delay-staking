// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor() ERC20("Test Stake Token", "TST") {
        _mint(msg.sender, 1000000 * 10**18); // 1 million tokens
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
