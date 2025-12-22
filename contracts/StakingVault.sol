// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract StakingVault is ReentrancyGuard {
    IERC20 public stakingToken;
    
    struct Stake {
        uint256 amount;
        uint256 unlockTime;
        bool active;
    }
    
    mapping(address => Stake) public stakes;
    
    event Staked(address indexed user, uint256 amount, uint256 unlockTime);
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);
    
   uint256 public constant LOCK_DURATION = 30; // 30 seconds for demo // 1 hour for testing
    
    constructor(address _stakingToken) {
        stakingToken = IERC20(_stakingToken);
    }
    
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake 0");
        require(!stakes[msg.sender].active, "Already staking");
        
        stakingToken.transferFrom(msg.sender, address(this), amount);
        
        stakes[msg.sender] = Stake({
            amount: amount,
            unlockTime: block.timestamp + LOCK_DURATION,
            active: true
        });
        
        emit Staked(msg.sender, amount, stakes[msg.sender].unlockTime);
    }
    
    function unstake() external nonReentrant {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.active, "No active stake");
        require(block.timestamp >= userStake.unlockTime, "Still locked");
        
        uint256 amount = userStake.amount;
        userStake.active = false;
        userStake.amount = 0;
        
        stakingToken.transfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, amount, block.timestamp);
    }
    
    function executeUnstake(address user) external nonReentrant {
        Stake storage userStake = stakes[user];
        require(userStake.active, "No active stake");
        require(block.timestamp >= userStake.unlockTime, "Still locked");
        
        uint256 amount = userStake.amount;
        userStake.active = false;
        userStake.amount = 0;
        
        stakingToken.transfer(user, amount);
        
        emit Unstaked(user, amount, block.timestamp);
    }
    
    function getStake(address user) external view returns (Stake memory) {
        return stakes[user];
    }
    
    function canUnstake(address user) external view returns (bool) {
        Stake memory userStake = stakes[user];
        return userStake.active && block.timestamp >= userStake.unlockTime;
    }
}
