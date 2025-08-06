/**
 * Integration Test Page
 *
 * This page demonstrates the complete integration of all 39 Nigerian Stock Exchange
 * tokens deployed on Sepolia testnet with the frontend application.
 */

"use client";

import React from "react";
import { TokenListTest } from "@/components/test/TokenListTest";

export default function TestIntegrationPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Nigerian Stock Exchange Integration Test
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            This page demonstrates the complete integration of all 39 Nigerian
            Stock Exchange tokens deployed on Ethereum Sepolia testnet. Test
            network switching, token discovery, and contract interactions.
          </p>
        </div>

        <TokenListTest />

        <div className="mt-12 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">
            Integration Features Tested
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                ✅ Deployment Features
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• All 39 Nigerian stocks deployed on Sepolia</li>
                <li>• Factory contract with proper admin controls</li>
                <li>• Batch deployment with gas optimization</li>
                <li>• Automatic frontend configuration generation</li>
                <li>• Contract verification on Etherscan</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                ✅ Frontend Features
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Multi-network support (Bitfinity + Sepolia)</li>
                <li>• Automatic network detection and switching</li>
                <li>• Contract ABI integration</li>
                <li>• Token discovery and listing</li>
                <li>• Faucet integration for testnet ETH</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                ✅ Contract Integration
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Factory contract interactions</li>
                <li>• Token contract interactions</li>
                <li>• Real-time balance checking</li>
                <li>• Transaction monitoring</li>
                <li>• Error handling and validation</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                ✅ Testing Features
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Comprehensive integration testing</li>
                <li>• Network switching validation</li>
                <li>• Contract deployment verification</li>
                <li>• Frontend configuration testing</li>
                <li>• User experience validation</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">🚀 Deployment Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p>
                <strong>Network:</strong> Ethereum Sepolia Testnet
              </p>
              <p>
                <strong>Chain ID:</strong> 11155111
              </p>
              <p>
                <strong>Factory Address:</strong>{" "}
                0xF1098eDaaB7a7D7b3bD42e7DeD9554781dfA625A
              </p>
            </div>
            <div>
              <p>
                <strong>Total Tokens:</strong> 39
              </p>
              <p>
                <strong>Total Gas Used:</strong> ~98.3M gas
              </p>
              <p>
                <strong>Deployment Cost:</strong> ~0.11 ETH
              </p>
            </div>
            <div>
              <p>
                <strong>Sectors Covered:</strong> 11
              </p>
              <p>
                <strong>Batch Size:</strong> 5 tokens per batch
              </p>
              <p>
                <strong>Success Rate:</strong> 100%
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-green-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">🔗 Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Sepolia Network</h3>
              <ul className="space-y-1 text-sm">
                <li>
                  <a
                    href="https://sepolia.etherscan.io/address/0xF1098eDaaB7a7D7b3bD42e7DeD9554781dfA625A"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Factory Contract on Etherscan →
                  </a>
                </li>
                <li>
                  <a
                    href="https://sepoliafaucet.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Sepolia ETH Faucet →
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Bitfinity Network</h3>
              <ul className="space-y-1 text-sm">
                <li>
                  <a
                    href="https://explorer.testnet.bitfinity.network/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Bitfinity Testnet Explorer →
                  </a>
                </li>
                <li>
                  <a
                    href="https://faucet.testnet.bitfinity.network/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Bitfinity Testnet Faucet →
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            🎉 All 39 Nigerian Stock Exchange tokens successfully deployed and
            integrated!
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Ready for comprehensive testing of the liquidity platform
          </p>
        </div>
      </div>
    </main>
  );
}
