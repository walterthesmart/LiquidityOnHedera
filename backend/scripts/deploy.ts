import hre from "hardhat";
// @ts-ignore - Hardhat runtime environment extension
const ethers = hre.ethers;

async function main() {
  console.log("🚀 Deploying Nigerian Stock Exchange contracts on Bitfinity EVM...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "BTF");

  // Deploy factory contract
  console.log("\n📦 Deploying NigerianStockFactory...");
  const NigerianStockFactory = await ethers.getContractFactory("NigerianStockFactory");
  const factory = await NigerianStockFactory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("✅ NigerianStockFactory deployed to:", factoryAddress);

  // Deploy a sample token for testing
  console.log("\n📦 Deploying sample DANGCEM token...");
  const tx = await factory.deployStockToken(
    "Dangote Cement Token",
    "DANGCEM",
    "DANGCEM",
    "Dangote Cement Plc",
    ethers.parseEther("17040000000"), // 17.04 billion tokens
    ethers.parseEther("1000000"), // 1 million initial supply
    deployer.address
  );
  
  const receipt = await tx.wait();
  console.log("✅ Sample token deployed. Gas used:", receipt?.gasUsed);
  
  const dangcemAddress = await factory.getTokenAddress("DANGCEM");
  console.log("📍 DANGCEM token address:", dangcemAddress);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("🏭 Factory Address:", factoryAddress);
  console.log("🪙 Sample Token Address:", dangcemAddress);
  
  return {
    factory: factoryAddress,
    sampleToken: dangcemAddress
  };
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main;
