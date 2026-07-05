import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

// Use environment variable for deployer private key
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    base_sepolia: {
      url: "https://sepolia.base.org",
      accounts: [DEPLOYER_KEY],
      chainId: 84532,
    },
  },
  sourcify: { enabled: true },
};

export default config;
