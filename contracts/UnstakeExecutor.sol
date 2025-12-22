// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IStakingVault {
    function executeUnstake(address user) external;
    function canUnstake(address user) external view returns (bool);
}

contract UnstakeExecutor {
    IStakingVault public vault;
    
    event UnstakeExecuted(address indexed user, uint256 timestamp);
    
    constructor(address _vault) {
        vault = IStakingVault(_vault);
    }
    
    function executeUnstake(address user) external {
        require(vault.canUnstake(user), "Cannot unstake yet");
        
        vault.executeUnstake(user);
        
        emit UnstakeExecuted(user, block.timestamp);
    }
    
    function batchUnstake(address[] calldata users) external {
        for (uint i = 0; i < users.length; i++) {
            if (vault.canUnstake(users[i])) {
                vault.executeUnstake(users[i]);
                emit UnstakeExecuted(users[i], block.timestamp);
            }
        }
    }
}
