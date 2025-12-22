const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing Instant Unstake System\n");

  const [deployer, user1] = await hre.ethers.getSigners();
  
  // Deploy contracts
  console.log("📦 Deploying contracts...");
  const TestToken = await hre.ethers.getContractFactory("TestToken");
  const token = await TestToken.deploy();
  await token.waitForDeployment();
  
  const StakingVault = await hre.ethers.getContractFactory("StakingVault");
  const vault = await StakingVault.deploy(await token.getAddress());
  await vault.waitForDeployment();
  
  const UnstakeExecutor = await hre.ethers.getContractFactory("UnstakeExecutor");
  const executor = await UnstakeExecutor.deploy(await vault.getAddress());
  await executor.waitForDeployment();
  
  console.log("✅ Contracts deployed\n");
  
  // Setup
  console.log("⚙️  Setting up test scenario...");
  const stakeAmount = hre.ethers.parseEther("100");
  
  // Mint tokens to user1
  await token.mint(user1.address, stakeAmount);
  console.log("✅ Minted 100 tokens to user1");
  
  // Approve vault
  await token.connect(user1).approve(await vault.getAddress(), stakeAmount);
  console.log("✅ User1 approved vault\n");
  
  // Stake
  console.log("🔒 User1 staking 100 tokens...");
  const stakeTx = await vault.connect(user1).stake(stakeAmount);
  await stakeTx.wait();
  
  const stake = await vault.getStake(user1.address);
  console.log("✅ Staked successfully!");
  console.log("   Amount:", hre.ethers.formatEther(stake.amount), "tokens");
  console.log("   Unlock Time:", new Date(Number(stake.unlockTime) * 1000).toLocaleString());
  console.log("   Lock Duration: 3600 seconds (1 hour)\n");
  
  // Fast forward time
  console.log("⏰ Fast forwarding 3600 seconds (1 hour)...");
  await hre.network.provider.send("evm_increaseTime", [3600]);
  await hre.network.provider.send("evm_mine");
  console.log("✅ Time advanced\n");
  
  // Check if can unstake
  const canUnstake = await vault.canUnstake(user1.address);
  console.log("🔍 Can unstake?", canUnstake);
  
  // Execute unstake
  console.log("\n🚀 Executing instant unstake...");
  const unstakeTx = await executor.executeUnstake(user1.address);
  const receipt = await unstakeTx.wait();
  
  console.log("✅ Unstake executed!");
  console.log("   Block Number:", receipt.blockNumber);
  console.log("   Gas Used:", receipt.gasUsed.toString());
  
  // Verify
  const finalBalance = await token.balanceOf(user1.address);
  console.log("\n✨ Final Result:");
  console.log("   User1 balance:", hre.ethers.formatEther(finalBalance), "tokens");
  console.log("   Expected: 100 tokens");
  console.log("   Match:", finalBalance === stakeAmount ? "✅ YES" : "❌ NO");
  
  console.log("\n🎉 Test completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
