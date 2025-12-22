const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "\n");

  // Deploy TestToken
  console.log("📄 Deploying TestToken...");
  const TestToken = await hre.ethers.getContractFactory("TestToken");
  const token = await TestToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ TestToken deployed to:", tokenAddress, "\n");

  // Deploy StakingVault
  console.log("📄 Deploying StakingVault...");
  const StakingVault = await hre.ethers.getContractFactory("StakingVault");
  const vault = await StakingVault.deploy(tokenAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ StakingVault deployed to:", vaultAddress, "\n");

  // Deploy UnstakeExecutor
  console.log("📄 Deploying UnstakeExecutor...");
  const UnstakeExecutor = await hre.ethers.getContractFactory("UnstakeExecutor");
  const executor = await UnstakeExecutor.deploy(vaultAddress);
  await executor.waitForDeployment();
  const executorAddress = await executor.getAddress();
  console.log("✅ UnstakeExecutor deployed to:", executorAddress, "\n");

  console.log("🎉 All contracts deployed successfully!\n");
  console.log("📋 Contract Addresses:");
  console.log("   TestToken:", tokenAddress);
  console.log("   StakingVault:", vaultAddress);
  console.log("   UnstakeExecutor:", executorAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
