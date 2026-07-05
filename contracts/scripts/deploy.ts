import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // 1. Deploy CasinoRouter
  const CasinoRouter = await ethers.getContractFactory("CasinoRouter");
  const router = await CasinoRouter.deploy();
  await router.waitForDeployment();
  const routerAddr = await router.getAddress();
  console.log("✅ CasinoRouter deployed to:", routerAddr);

  // 2. Deploy ProvablyFair
  const ProvablyFair = await ethers.getContractFactory("ProvablyFair");
  const fairness = await ProvablyFair.deploy();
  await fairness.waitForDeployment();
  const fairnessAddr = await fairness.getAddress();
  console.log("✅ ProvablyFair deployed to:", fairnessAddr);

  // 3. Deploy SlotsGame
  const SlotsGame = await ethers.getContractFactory("SlotsGame");
  const slots = await SlotsGame.deploy(routerAddr, fairnessAddr);
  await slots.waitForDeployment();
  const slotsAddr = await slots.getAddress();
  console.log("✅ SlotsGame deployed to:", slotsAddr);

  // 4. Deploy BlackjackGame
  const BlackjackGame = await ethers.getContractFactory("BlackjackGame");
  const blackjack = await BlackjackGame.deploy(routerAddr, fairnessAddr);
  await blackjack.waitForDeployment();
  const blackjackAddr = await blackjack.getAddress();
  console.log("✅ BlackjackGame deployed to:", blackjackAddr);

  // 5. Authorize game contracts in router
  await router.authorizeGame(slotsAddr);
  console.log("✅ SlotsGame authorized in router");
  await router.authorizeGame(blackjackAddr);
  console.log("✅ BlackjackGame authorized in router");

  // Summary
  console.log("\n══════════════════════════════════════════");
  console.log("  DEPLOYMENT COMPLETE — Base Sepolia");
  console.log("══════════════════════════════════════════");
  console.log(`NEXT_PUBLIC_CASINO_ROUTER=${routerAddr}`);
  console.log(`NEXT_PUBLIC_PROVABLY_FAIR=${fairnessAddr}`);
  console.log(`NEXT_PUBLIC_SLOTS_GAME=${slotsAddr}`);
  console.log(`NEXT_PUBLIC_BLACKJACK_GAME=${blackjackAddr}`);
  console.log("══════════════════════════════════════════\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
