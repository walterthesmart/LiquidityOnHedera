const { ethers } = require("hardhat");

// Deployed factory address
const FACTORY_ADDRESS = "0x01Ea5f246258FA083D0fA98F60379f44588Cc001";

async function main() {
  console.log("🔍 Testing factory contract interface...");
  
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  console.log("📝 Using account:", deployer.address);

  // Try different function signatures to see what works
  const testFunctions = [
    // Original signature we tried
    "function deployStockToken(string calldata _name, string calldata _symbol, uint256 _initialSupply, tuple(string symbol, string companyName, string sector, uint256 totalShares, uint256 marketCap, bool isActive, uint256 lastUpdated) _stockMetadata, address _tokenAdmin) external returns (address)",
    
    // Simpler signature
    "function deployStockToken(string calldata _name, string calldata _symbol, string calldata _stockSymbol, string calldata _companyName, uint256 _maxSupply, uint256 _initialSupply, address _tokenAdmin) external returns (address)",
    
    // Basic functions
    "function totalDeployedTokens() external view returns (uint256)",
    "function getTokenAddress(string calldata _symbol) external view returns (address)",
    "function getAllDeployedSymbols() external view returns (string[] memory)"
  ];

  // Test basic read functions first
  console.log("\n📊 Testing read functions...");
  
  try {
    const basicABI = [
      "function totalDeployedTokens() external view returns (uint256)",
      "function getTokenAddress(string calldata _symbol) external view returns (address)",
      "function getAllDeployedSymbols() external view returns (string[] memory)"
    ];
    
    const factory = new ethers.Contract(FACTORY_ADDRESS, basicABI, deployer);
    
    const totalTokens = await factory.totalDeployedTokens();
    console.log(`✅ Total deployed tokens: ${totalTokens}`);
    
    const symbols = await factory.getAllDeployedSymbols();
    console.log(`✅ Deployed symbols: ${symbols.join(', ') || 'None'}`);
    
    // Test getting a specific token address
    if (symbols.length > 0) {
      const firstTokenAddress = await factory.getTokenAddress(symbols[0]);
      console.log(`✅ ${symbols[0]} address: ${firstTokenAddress}`);
    }
    
  } catch (error) {
    console.error("❌ Basic functions failed:", error.message);
  }

  // Now test the deployment function with the simpler signature
  console.log("\n🧪 Testing simpler deployment function...");
  
  try {
    const simpleABI = [
      "function deployStockToken(string calldata _name, string calldata _symbol, string calldata _stockSymbol, string calldata _companyName, uint256 _maxSupply, uint256 _initialSupply, address _tokenAdmin) external returns (address)",
      "function getTokenAddress(string calldata _symbol) external view returns (address)"
    ];
    
    const factory = new ethers.Contract(FACTORY_ADDRESS, simpleABI, deployer);
    
    // Try to deploy a test token
    console.log("🧪 Attempting to deploy TEST token...");
    
    const tx = await factory.deployStockToken(
      "Test Stock Token",
      "TEST",
      "TEST",
      "Test Company",
      ethers.parseEther("1000000"), // 1M max supply
      "0", // 0 initial supply
      deployer.address,
      {
        gasLimit: 2000000,
        gasPrice: 370000000000
      }
    );
    
    console.log(`⏳ Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
    
    const testTokenAddress = await factory.getTokenAddress("TEST");
    console.log(`✅ TEST token deployed to: ${testTokenAddress}`);
    
  } catch (error) {
    console.error("❌ Simple deployment failed:", error.message);
    
    // If that fails, let's try to see what the actual function signature is
    console.log("\n🔍 Checking contract bytecode and ABI...");
    
    try {
      // Get the contract instance using the original factory ABI
      const NigerianStockTokenFactory = await ethers.getContractFactory("NigerianStockTokenFactory");
      const factoryWithFullABI = NigerianStockTokenFactory.attach(FACTORY_ADDRESS);
      
      console.log("📋 Available functions in contract:");
      const iface = NigerianStockTokenFactory.interface;
      const functions = Object.keys(iface.functions);
      functions.forEach(func => {
        console.log(`   - ${func}`);
      });
      
      // Try the original function with correct parameters
      console.log("\n🧪 Trying original deployStockToken function...");
      
      const stockMetadata = {
        symbol: "TEST2",
        companyName: "Test Company 2",
        sector: "Technology",
        totalShares: ethers.parseEther("1000000"),
        marketCap: ethers.parseEther("500000"),
        isActive: true,
        lastUpdated: Math.floor(Date.now() / 1000)
      };
      
      const tx2 = await factoryWithFullABI.deployStockToken(
        "Test Stock Token 2",
        "TEST2",
        "0", // initial supply
        stockMetadata,
        deployer.address,
        {
          gasLimit: 2000000,
          gasPrice: 370000000000
        }
      );
      
      console.log(`⏳ Transaction sent: ${tx2.hash}`);
      const receipt2 = await tx2.wait();
      console.log(`✅ Transaction confirmed in block: ${receipt2.blockNumber}`);
      
      const test2TokenAddress = await factoryWithFullABI.getTokenAddress("TEST2");
      console.log(`✅ TEST2 token deployed to: ${test2TokenAddress}`);
      
    } catch (error2) {
      console.error("❌ Original function also failed:", error2.message);
    }
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
