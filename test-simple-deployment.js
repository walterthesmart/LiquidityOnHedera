#!/usr/bin/env node

/**
 * Test Simple Contract Deployment on Hedera
 * 
 * Deploy a simple test contract to verify Hedera deployment works
 */

const { ethers } = require("ethers");

const HEDERA_RPC = "https://testnet.hashio.io/api";

// Simple test contract ABI and bytecode
const TEST_CONTRACT = {
  abi: [
    "constructor(string memory _message)",
    "function getMessage() public view returns (string memory)",
    "function setMessage(string memory _message) public",
    "function getNumber() public pure returns (uint256)"
  ],
  bytecode: "0x608060405234801561001057600080fd5b5060405161047838038061047883398101604081905261002f91610054565b600061003b8282610123565b50506101e2565b634e487b7160e01b600052604160045260246000fd5b60006020828403121561006657600080fd5b81516001600160401b038082111561007d57600080fd5b818401915084601f83011261009157600080fd5b8151818111156100a3576100a3610042565b604051601f8201601f19908116603f011681019083821181831017156100cb576100cb610042565b816040528281528760208487010111156100e457600080fd5b6100f5836020830160208801610106565b979650505050505050565b60005b83811015610121578181015183820152602001610109565b50506000910152565b81516001600160401b0381111561014357610143610042565b61015781610151845461016b565b84610195565b602080601f83116001811461018c57600084156101745750858301515b600019600386901b1c1916600185901b1785556101e6565b600085815260208120601f198616915b828110156101bb5788860151825594840194600190910190840161019c565b50858210156101d95787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b610287806101f16000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c8063368b87721461004657806341c0e1b51461005b578063ce6d41de14610063575b600080fd5b610059610054366004610170565b610081565b005b610059610095565b61006b6100a7565b60405161007891906101e9565b60405180910390f35b600061008d8282610139565b5050565b6000805461009e90610213565b80601f01602080910402602001604051908101604052809291908181526020018280546100ca90610213565b80156101175780601f106100ec57610100808354040283529160200191610117565b820191906000526020600020905b8154815290600101906020018083116100fa57829003601f168201915b505050505081565b634e487b7160e01b600052604160045260246000fd5b81516001600160401b038111156101525761015261011f565b610166816101608454610213565b84610247565b602080601f83116001811461019b57600084156101835750858301515b600019600386901b1c1916600185901b178555610205565b600085815260208120601f198616915b828110156101ca578886015182559484019460019091019084016101ab565b50858210156101e85787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b600060208083528351808285015260005b81811015610216578581018301518582016040015282016101fa565b506000604082860101526040601f19601f8301168501019250505092915050565b600181811c9082168061024b57607f821691505b60208210810361026b57634e487b7160e01b600052602260045260246000fd5b5091905056fea2646970667358221220a7c5c0c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c564736f6c63430008130033"
};

async function main() {
  console.log("🧪 Testing simple contract deployment on Hedera testnet...");
  
  require('dotenv').config();
  
  if (!process.env.BITFINITY_PRIVATE_KEY) {
    console.error("❌ BITFINITY_PRIVATE_KEY not found in environment variables");
    process.exit(1);
  }
  
  const provider = new ethers.JsonRpcProvider(HEDERA_RPC);
  const signer = new ethers.Wallet(process.env.BITFINITY_PRIVATE_KEY, provider);
  
  console.log("📝 Using account:", signer.address);
  
  const balance = await provider.getBalance(signer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "HBAR");
  
  if (balance < ethers.parseEther("1")) {
    console.warn("⚠️  Warning: Low balance. You may need more HBAR for deployment.");
  }
  
  try {
    console.log("\n📦 Deploying simple test contract...");
    
    // Create a simple contract factory
    const contractFactory = new ethers.ContractFactory(
      TEST_CONTRACT.abi,
      TEST_CONTRACT.bytecode,
      signer
    );
    
    // Deploy with specific gas settings for Hedera
    const contract = await contractFactory.deploy("Hello Hedera!", {
      gasLimit: 1000000,
      gasPrice: 370000000000, // 370 gwei
      maxFeePerGas: 370000000000,
      maxPriorityFeePerGas: 1000000000 // 1 gwei
    });
    
    console.log("⏳ Deployment transaction sent:", contract.deploymentTransaction().hash);
    
    // Wait for deployment
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    console.log("✅ Contract deployed to:", contractAddress);
    
    // Test contract interaction
    console.log("\n🔧 Testing contract interaction...");
    
    const message = await contract.getMessage();
    console.log("📝 Contract message:", message);
    
    const number = await contract.getNumber();
    console.log("🔢 Contract number:", number.toString());
    
    // Test contract update
    console.log("\n📝 Updating contract message...");
    const updateTx = await contract.setMessage("Hedera deployment works!", {
      gasLimit: 100000,
      gasPrice: 370000000000
    });
    
    await updateTx.wait();
    console.log("✅ Message updated");
    
    const newMessage = await contract.getMessage();
    console.log("📝 New message:", newMessage);
    
    console.log("\n🎉 Simple contract deployment and interaction successful!");
    console.log(`🔗 View on explorer: https://hashscan.io/testnet/contract/${contractAddress}`);
    
    return {
      success: true,
      contractAddress: contractAddress,
      deploymentHash: contract.deploymentTransaction().hash
    };
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    
    if (error.message.includes("insufficient funds")) {
      console.log("💡 Try getting more HBAR from the faucet: https://portal.hedera.com/faucet");
    } else if (error.message.includes("gas")) {
      console.log("💡 Try adjusting gas settings for Hedera");
    } else if (error.message.includes("nonce")) {
      console.log("💡 Try waiting a moment and retrying");
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

if (require.main === module) {
  main()
    .then((result) => {
      if (result.success) {
        console.log("\n✅ Test deployment completed successfully!");
        process.exit(0);
      } else {
        console.log("\n❌ Test deployment failed!");
        process.exit(1);
      }
    })
    .catch(console.error);
}

module.exports = main;
