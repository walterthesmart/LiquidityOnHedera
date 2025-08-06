const fs = require('fs');
const path = require('path');

function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m',
    magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m', reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function extractABI(contractName) {
  const artifactPath = path.join(__dirname, '../artifacts/contracts', `${contractName}.sol`, `${contractName}.json`);
  
  if (!fs.existsSync(artifactPath)) {
    log(`❌ Artifact not found: ${artifactPath}`, 'red');
    return null;
  }
  
  try {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    return artifact.abi;
  } catch (error) {
    log(`❌ Error reading ${contractName}: ${error.message}`, 'red');
    return null;
  }
}

function main() {
  log('🔧 Extracting ABIs for frontend...', 'cyan');
  
  const contracts = [
    'NGNStablecoin',
    'NigerianStockToken', 
    'StockNGNDEX',
    'TradingPairManager',
    'NigerianStockFactory'
  ];
  
  // Create frontend abis directory
  const frontendAbisDir = path.join(__dirname, '../../frontend/src/abis');
  if (!fs.existsSync(frontendAbisDir)) {
    fs.mkdirSync(frontendAbisDir, { recursive: true });
    log(`📁 Created directory: ${frontendAbisDir}`, 'blue');
  }
  
  let successCount = 0;
  
  for (const contractName of contracts) {
    log(`\n📦 Processing ${contractName}...`, 'yellow');
    
    const abi = extractABI(contractName);
    if (abi) {
      const outputPath = path.join(frontendAbisDir, `${contractName}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(abi, null, 2));
      log(`✅ ABI extracted: ${outputPath}`, 'green');
      successCount++;
    }
  }
  
  log(`\n🎉 Successfully extracted ${successCount}/${contracts.length} ABIs!`, 'green');
  
  // Create index file for easy imports
  const indexContent = contracts.map(name => 
    `export { default as ${name}ABI } from './${name}.json';`
  ).join('\n') + '\n';
  
  const indexPath = path.join(frontendAbisDir, 'index.ts');
  fs.writeFileSync(indexPath, indexContent);
  log(`✅ Index file created: ${indexPath}`, 'green');
  
  return successCount === contracts.length;
}

if (require.main === module) {
  main().then ? main() : Promise.resolve(main()).then((success) => {
    process.exit(success ? 0 : 1);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { main };
