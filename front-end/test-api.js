// Simple test script to verify the Nigerian stocks API
async function testAPI() {
  try {
    console.log('Testing Nigerian Stocks API...');
    
    // Test stocks endpoint
    console.log('\n1. Testing stocks endpoint...');
    const stocksResponse = await fetch('http://localhost:3000/api/nigerian-stocks?action=stocks&chainId=11155111');
    const stocksData = await stocksResponse.json();
    console.log('Stocks response:', {
      success: stocksData.success,
      totalStocks: stocksData.meta?.total,
      network: stocksData.meta?.network,
      contractsDeployed: stocksData.meta?.contractsDeployed,
      sampleStock: stocksData.data?.[0]?.symbol
    });
    
    // Test prices endpoint
    console.log('\n2. Testing prices endpoint...');
    const pricesResponse = await fetch('http://localhost:3000/api/nigerian-stocks?action=prices&chainId=11155111');
    const pricesData = await pricesResponse.json();
    console.log('Prices response:', {
      success: pricesData.success,
      totalPrices: pricesData.meta?.total,
      network: pricesData.meta?.network,
      samplePrice: pricesData.data?.[0]
    });
    
    // Test specific stock price
    console.log('\n3. Testing specific stock price (DANGCEM)...');
    const dangcemResponse = await fetch('http://localhost:3000/api/nigerian-stocks?action=prices&symbol=DANGCEM&chainId=11155111');
    const dangcemData = await dangcemResponse.json();
    console.log('DANGCEM price response:', {
      success: dangcemData.success,
      symbol: dangcemData.data?.symbol,
      price: dangcemData.data?.price,
      contractAddress: dangcemData.data?.contractAddress,
      hasContract: dangcemData.data?.hasContract
    });
    
    // Test market stats
    console.log('\n4. Testing market stats...');
    const statsResponse = await fetch('http://localhost:3000/api/nigerian-stocks?action=market-stats&chainId=11155111');
    const statsData = await statsResponse.json();
    console.log('Market stats response:', {
      success: statsData.success,
      totalStocks: statsData.data?.totalStocks,
      contractsDeployed: statsData.data?.contractsDeployed,
      marketMovement: statsData.data?.marketMovement
    });
    
    console.log('\n✅ All API tests completed successfully!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPI();
