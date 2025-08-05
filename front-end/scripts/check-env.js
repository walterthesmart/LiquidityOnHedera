#!/usr/bin/env node

/**
 * Environment Variables Checker
 * Checks for missing or misconfigured environment variables
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Required environment variables for different features
const ENV_REQUIREMENTS = {
  database: {
    name: 'Database Connection',
    required: ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN'],
    optional: ['CONN_STRING']
  },
  payments: {
    name: 'Payment Processing',
    required: ['PAYSTACK_URL'],
    optional: ['TEST_PAYSTACK_SECRET_KEY', 'LIVE_PAYSTACK_SECRET_KEY']
  },
  blockchain: {
    name: 'Blockchain Integration',
    required: ['NEXT_PUBLIC_PROJECT_ID'],
    optional: ['NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS', 'NEXT_PUBLIC_CHAIN_ID']
  },
  auth: {
    name: 'Authentication',
    optional: ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY']
  },
  external_apis: {
    name: 'External APIs',
    optional: ['NGX_API_KEY', 'NGX_API_URL', 'CONVERSION_KEY']
  }
};

function checkEnvironmentVariables() {
  console.log('🔍 Checking Environment Variables...\n');
  
  let hasErrors = false;
  let hasWarnings = false;

  // Check if .env.local exists
  const envPath = path.join(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  .env.local file not found!');
    console.log('   Copy .env.example to .env.local and configure your values\n');
    hasWarnings = true;
  }

  // Check each category
  Object.entries(ENV_REQUIREMENTS).forEach(([category, config]) => {
    console.log(`📋 ${config.name}:`);
    
    // Check required variables
    config.required?.forEach(varName => {
      const value = process.env[varName];
      if (!value) {
        console.log(`   ❌ ${varName} - MISSING (Required)`);
        hasErrors = true;
      } else {
        console.log(`   ✅ ${varName} - Set`);
      }
    });

    // Check optional variables
    config.optional?.forEach(varName => {
      const value = process.env[varName];
      if (!value) {
        console.log(`   ⚠️  ${varName} - Not set (Optional)`);
        hasWarnings = true;
      } else {
        console.log(`   ✅ ${varName} - Set`);
      }
    });
    
    console.log('');
  });

  // Check for common URL issues
  console.log('🌐 URL Validation:');
  
  const urlVars = [
    'PAYSTACK_URL',
    'TURSO_DATABASE_URL',
    'NGX_API_URL'
  ];

  urlVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      try {
        new URL(value);
        console.log(`   ✅ ${varName} - Valid URL`);
      } catch (error) {
        console.log(`   ❌ ${varName} - Invalid URL format`);
        hasErrors = true;
      }
    }
  });

  console.log('');

  // Summary
  if (hasErrors) {
    console.log('❌ Configuration has ERRORS that need to be fixed!');
    console.log('   These missing variables may cause "Failed to fetch" errors.\n');
  } else if (hasWarnings) {
    console.log('⚠️  Configuration has warnings but should work for basic functionality.\n');
  } else {
    console.log('✅ All environment variables are properly configured!\n');
  }

  // Provide helpful suggestions
  console.log('💡 Troubleshooting Tips:');
  console.log('   1. Copy .env.example to .env.local');
  console.log('   2. Fill in your actual API keys and URLs');
  console.log('   3. Restart your development server after changes');
  console.log('   4. Check browser console for specific fetch errors');
  console.log('   5. Visit /debug-network to test network connectivity\n');

  return !hasErrors;
}

// Run the check
const isValid = checkEnvironmentVariables();
process.exit(isValid ? 0 : 1);
