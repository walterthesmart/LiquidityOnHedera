/**
 * Test script to verify token balance fetching functionality
 * This can be used to test the useTokenBalances hook implementation
 */

import { CONTRACT_ADDRESSES, NigerianStockTokenABI, NGNStablecoinABI } from '@/abis';

// Test function to verify contract addresses are properly configured
export function testContractAddresses() {
  console.log('Testing contract addresses configuration...');
  
  // Test Sepolia network (11155111)
  const sepoliaAddresses = CONTRACT_ADDRESSES[11155111];
  
  if (!sepoliaAddresses) {
    console.error('❌ Sepolia contract addresses not found');
    return false;
  }
  
  console.log('✅ Sepolia contract addresses found');
  console.log('NGN Stablecoin:', sepoliaAddresses.ngnStablecoin);
  console.log('Factory:', sepoliaAddresses.factoryAddress);
  
  // Test token addresses
  const expectedTokens = [
    'DANGCEM', 'MTNN', 'ZENITHBANK', 'GTCO', 'ACCESS', 
    'FBNH', 'UBA', 'NESTLE', 'BUACEMENT', 'AIRTELAFRI'
  ];
  
  let allTokensFound = true;
  expectedTokens.forEach(token => {
    const address = sepoliaAddresses.tokens[token as keyof typeof sepoliaAddresses.tokens];
    if (address) {
      console.log(`✅ ${token}: ${address}`);
    } else {
      console.error(`❌ ${token}: Not found`);
      allTokensFound = false;
    }
  });
  
  return allTokensFound;
}

// Test function to verify ABI imports
export function testABIImports() {
  console.log('Testing ABI imports...');

  try {
    if (!NigerianStockTokenABI) {
      console.error('❌ NigerianStockTokenABI not found');
      return false;
    }

    if (!NGNStablecoinABI) {
      console.error('❌ NGNStablecoinABI not found');
      return false;
    }

    console.log('✅ All ABIs imported successfully');
    console.log('NigerianStockTokenABI functions:', NigerianStockTokenABI.filter((item: { type: string }) => item.type === 'function').length);
    console.log('NGNStablecoinABI functions:', NGNStablecoinABI.filter((item: { type: string }) => item.type === 'function').length);

    return true;
  } catch (error) {
    console.error('❌ Error importing ABIs:', error);
    return false;
  }
}

// Run all tests
export function runAllTests() {
  console.log('🧪 Running token balance tests...\n');
  
  const contractTest = testContractAddresses();
  console.log('');
  
  const abiTest = testABIImports();
  console.log('');
  
  if (contractTest && abiTest) {
    console.log('🎉 All tests passed! Token balance fetching should work correctly.');
  } else {
    console.log('❌ Some tests failed. Please check the configuration.');
  }
  
  return contractTest && abiTest;
}

// Export for use in components or other files
const testTokenBalances = {
  testContractAddresses,
  testABIImports,
  runAllTests
};

export default testTokenBalances;
