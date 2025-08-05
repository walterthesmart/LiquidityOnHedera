/**
 * Token List Test Component
 *
 * This component demonstrates and tests the expanded Nigerian Stock Exchange
 * token integration with all 39 deployed tokens on Sepolia testnet.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import {
  useNetworkSwitcher,
  useNetworkAwareTokens,
  useNetworkFaucets,
} from "@/hooks/use-network-switcher";
import { getFactoryAddress } from "@/abis";
import { formatNetworkName } from "@/lib/bitfinity-config";

interface TokenInfo {
  symbol: string;
  address: string;
  name?: string;
  sector?: string;
  status: "loading" | "success" | "error";
}

export function TokenListTest() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const {
    currentNetwork,
    switchToSepolia,
    switchToBitfinityTestnet,
    isCurrentNetworkSupported,
    hasDeployedContracts,
  } = useNetworkSwitcher();

  const { availableTokens, hasContracts } = useNetworkAwareTokens();
  const { faucets, isTestnet, nativeCurrency } = useNetworkFaucets();

  const [tokenDetails, setTokenDetails] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // Ensure component is mounted on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load token details when network or tokens change
  useEffect(() => {
    if (!hasContracts || availableTokens.length === 0) {
      setTokenDetails([]);
      return;
    }

    setLoading(true);
    const details: TokenInfo[] = availableTokens.map((token) => ({
      symbol: token.symbol,
      address: token.address,
      status: "loading" as const,
    }));

    setTokenDetails(details);

    // Simulate loading token details (in real app, this would fetch from contracts)
    setTimeout(() => {
      setTokenDetails((prev) =>
        prev.map((token) => ({
          ...token,
          status: "success" as const,
          name: `${token.symbol} Token`,
          sector: getSectorForToken(token.symbol),
        })),
      );
      setLoading(false);
    }, 1000);
  }, [hasContracts, availableTokens]);

  // Helper function to get sector for demo purposes
  const getSectorForToken = (symbol: string): string => {
    const sectorMap: Record<string, string> = {
      DANGCEM: "Industrial Goods",
      MTNN: "Telecommunications",
      ZENITHBANK: "Banking",
      GTCO: "Banking",
      NB: "Consumer Goods",
      ACCESS: "Banking",
      BUACEMENT: "Industrial Goods",
      AIRTELAFRI: "Telecommunications",
      FBNH: "Banking",
      UBA: "Banking",
      NESTLE: "Consumer Goods",
      SEPLAT: "Oil & Gas",
      STANBIC: "Banking",
      OANDO: "Oil & Gas",
      LAFARGE: "Industrial Goods",
      CONOIL: "Oil & Gas",
      WAPCO: "Industrial Goods",
      FLOURMILL: "Consumer Goods",
      PRESCO: "Agriculture",
      CADBURY: "Consumer Goods",
      GUINNESS: "Consumer Goods",
      INTBREW: "Consumer Goods",
      CHAMPION: "Consumer Goods",
      UNILEVER: "Consumer Goods",
      TRANSCORP: "Conglomerates",
      BUAFOODS: "Consumer Goods",
      DANGSUGAR: "Consumer Goods",
      UACN: "Conglomerates",
      PZ: "Consumer Goods",
      TOTAL: "Oil & Gas",
      ETERNA: "Oil & Gas",
      GEREGU: "Utilities",
      TRANSPOWER: "Utilities",
      FIDSON: "Healthcare",
      MAYBAKER: "Healthcare",
      OKOMUOIL: "Agriculture",
      LIVESTOCK: "Agriculture",
      CWG: "ICT",
      TRANSCOHOT: "Services",
    };
    return sectorMap[symbol] || "Unknown";
  };

  // Group tokens by sector
  const tokensBySector = tokenDetails.reduce(
    (acc, token) => {
      const sector = token.sector || "Unknown";
      if (!acc[sector]) acc[sector] = [];
      acc[sector].push(token);
      return acc;
    },
    {} as Record<string, TokenInfo[]>,
  );

  // Show loading state until component is mounted
  if (!mounted) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          Nigerian Stock Exchange Token Integration Test
        </h1>
        <div className="bg-gray-100 p-4 rounded-lg animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-3 w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-32"></div>
              <div className="h-4 bg-gray-300 rounded w-48"></div>
              <div className="h-4 bg-gray-300 rounded w-24"></div>
              <div className="h-4 bg-gray-300 rounded w-36"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-28"></div>
              <div className="h-4 bg-gray-300 rounded w-32"></div>
              <div className="h-4 bg-gray-300 rounded w-24"></div>
              <div className="h-4 bg-gray-300 rounded w-40"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Nigerian Stock Exchange Token Integration Test
      </h1>

      {/* Network Status */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Network Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p>
              <strong>Connected:</strong> {isConnected ? "Yes" : "No"}
            </p>
            <p>
              <strong>Address:</strong> {address || "Not connected"}
            </p>
            <p>
              <strong>Chain ID:</strong> {chainId}
            </p>
            <p>
              <strong>Network:</strong> {formatNetworkName(chainId || 0)}
            </p>
          </div>
          <div>
            <p>
              <strong>Supported:</strong>{" "}
              {isCurrentNetworkSupported ? "Yes" : "No"}
            </p>
            <p>
              <strong>Has Contracts:</strong>{" "}
              {hasDeployedContracts ? "Yes" : "No"}
            </p>
            <p>
              <strong>Is Testnet:</strong> {isTestnet ? "Yes" : "No"}
            </p>
            <p>
              <strong>Native Currency:</strong> {nativeCurrency}
            </p>
          </div>
        </div>
      </div>

      {/* Network Switching */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Network Switching</h2>
        <div className="flex gap-4">
          <button
            onClick={switchToSepolia}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={chainId === 11155111}
          >
            Switch to Sepolia {chainId === 11155111 && "(Current)"}
          </button>
          <button
            onClick={switchToBitfinityTestnet}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            disabled={chainId === 355113}
          >
            Switch to Bitfinity {chainId === 355113 && "(Current)"}
          </button>
        </div>
      </div>

      {/* Faucet Information */}
      {isTestnet && faucets.length > 0 && (
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">Testnet Faucets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faucets.map((faucet, index) => (
              <div key={index} className="border p-3 rounded">
                <h3 className="font-semibold">{faucet.name}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {faucet.description}
                </p>
                <a
                  href={faucet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Get {nativeCurrency} →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contract Information */}
      {hasContracts && (
        <div className="bg-yellow-50 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">Contract Information</h2>
          <p>
            <strong>Factory Address:</strong> {getFactoryAddress(chainId || 0)}
          </p>
          <p>
            <strong>Available Tokens:</strong> {availableTokens.length}
          </p>
          <p>
            <strong>Block Explorer:</strong>
            <a
              href={`${currentNetwork?.blockExplorer}/address/${getFactoryAddress(chainId || 0)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline ml-2"
            >
              View Factory Contract →
            </a>
          </p>
        </div>
      )}

      {/* Token List */}
      {hasContracts ? (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Deployed Tokens ({tokenDetails.length})
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4">Loading token details...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(tokensBySector).map(([sector, tokens]) => (
                <div key={sector}>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">
                    {sector} ({tokens.length} tokens)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tokens.map((token) => (
                      <div
                        key={token.symbol}
                        className="border p-4 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-lg">
                            {token.symbol}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              token.status === "success"
                                ? "bg-green-100 text-green-800"
                                : token.status === "error"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {token.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {token.name}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          Sector: {token.sector}
                        </p>
                        <p className="text-xs font-mono text-gray-400 break-all">
                          {token.address}
                        </p>
                        <a
                          href={`${currentNetwork?.blockExplorer}/address/${token.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline text-xs mt-2 inline-block"
                        >
                          View on Explorer →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">No Contracts Available</h2>
          <p className="text-gray-600 mb-4">
            {!isCurrentNetworkSupported
              ? "Please switch to a supported network to view deployed tokens."
              : "No contracts have been deployed on this network yet."}
          </p>
          {!isCurrentNetworkSupported && (
            <button
              onClick={switchToSepolia}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Switch to Sepolia (39 tokens available)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
