const { ethers } = require("hardhat");

// Deployed contract addresses
const CONTRACTS = {
  factory: "0x01Ea5f246258FA083D0fA98F60379f44588Cc001",
  ngnStablecoin: "0xccAf1E21476F613cc9507CC78aAc584DF12beb98",
  stockNGNDEX: "0xDFA0B890a51Aba51E947F0ed3381e57EF46A5Dc3",
  tradingPairManager: "0xBdA0281ec5557ec565180b78d0F4CA496454f027"
};

async function main() {
  console.log("🔍 Checking deployed contract bytecode...");
  
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  console.log("📝 Using account:", deployer.address);

  for (const [name, address] of Object.entries(CONTRACTS)) {
    console.log(`\n🔍 Checking ${name} at ${address}...`);
    
    try {
      // Check if contract has code
      const code = await ethers.provider.getCode(address);
      console.log(`   📄 Code length: ${code.length} characters`);
      
      if (code === "0x") {
        console.log(`   ❌ No contract code found - deployment failed`);
      } else {
        console.log(`   ✅ Contract code found`);
        
        // Check contract balance
        const balance = await ethers.provider.getBalance(address);
        console.log(`   💰 Balance: ${ethers.formatEther(balance)} HBAR`);
        
        // Try to call a simple function if it's the factory
        if (name === "factory") {
          console.log(`   🧪 Testing factory functions...`);
          
          // Try with minimal ABI
          const minimalABI = [
            "function owner() external view returns (address)",
            "function paused() external view returns (bool)"
          ];
          
          try {
            const contract = new ethers.Contract(address, minimalABI, deployer);
            const owner = await contract.owner();
            console.log(`   👤 Owner: ${owner}`);
            
            const paused = await contract.paused();
            console.log(`   ⏸️  Paused: ${paused}`);
            
          } catch (error) {
            console.log(`   ❌ Function calls failed: ${error.message}`);
          }
        }
        
        // For NGN token, try ERC20 functions
        if (name === "ngnStablecoin") {
          console.log(`   🧪 Testing NGN token functions...`);
          
          const erc20ABI = [
            "function name() external view returns (string)",
            "function symbol() external view returns (string)",
            "function totalSupply() external view returns (uint256)"
          ];
          
          try {
            const token = new ethers.Contract(address, erc20ABI, deployer);
            const name = await token.name();
            const symbol = await token.symbol();
            const totalSupply = await token.totalSupply();
            
            console.log(`   📛 Name: ${name}`);
            console.log(`   🔤 Symbol: ${symbol}`);
            console.log(`   📊 Total Supply: ${ethers.formatEther(totalSupply)}`);
            
          } catch (error) {
            console.log(`   ❌ ERC20 calls failed: ${error.message}`);
          }
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error checking contract: ${error.message}`);
    }
  }
  
  console.log("\n🔗 Explorer Links:");
  for (const [name, address] of Object.entries(CONTRACTS)) {
    console.log(`   ${name}: https://hashscan.io/testnet/contract/${address}`);
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
