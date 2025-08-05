import React, { useState, useCallback } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { NGNStablecoinABI, getNGNStablecoinAddress } from "../../abis";
import { formatEther, parseEther } from "ethers";
import { formatNetworkName } from "../../lib/bitfinity-config";

interface NGNWalletProps {
  className?: string;
}

interface NGNTokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  maxSupply: string;
  mintingEnabled: boolean;
  burningEnabled: boolean;
  transfersEnabled: boolean;
}

const NGNWallet: React.FC<NGNWalletProps> = ({ className = "" }) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [transferAmount, setTransferAmount] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const ngnAddress = chainId ? getNGNStablecoinAddress(chainId) : "";

  // Read NGN balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: ngnAddress as `0x${string}`,
    abi: NGNStablecoinABI,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address && !!ngnAddress,
      refetchInterval: 5000, // Replaces watch: true
    },
  });

  // Read NGN token info
  const { data: tokenInfo } = useReadContract({
    address: ngnAddress as `0x${string}`,
    abi: NGNStablecoinABI,
    functionName: "getTokenInfo",
    query: {
      enabled: !!ngnAddress,
    },
  }) as { data: NGNTokenInfo | undefined };

  // Contract write hook
  const { writeContract: writeContractFn, isPending: isTransferLoading } =
    useWriteContract({
      mutation: {
        onSuccess: (data: string) => {
          setSuccess(`Transfer successful! Transaction hash: ${data}`);
          setTransferAmount("");
          setTransferTo("");
          refetchBalance();
        },
        onError: (error: Error) => {
          setError(`Transfer failed: ${error.message}`);
        },
      },
    });

  // Check if transfer is allowed
  const { data: canTransferData } = useReadContract({
    address: ngnAddress as `0x${string}`,
    abi: NGNStablecoinABI,
    functionName: "canTransfer",
    args: [
      address,
      transferTo as `0x${string}`,
      transferAmount ? parseEther(transferAmount) : 0n,
    ],
    query: {
      enabled: !!address && !!transferTo && !!transferAmount && !!ngnAddress,
    },
  }) as { data: [boolean, string] | undefined };

  const handleTransfer = useCallback(() => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      writeContractFn({
        address: ngnAddress as `0x${string}`,
        abi: NGNStablecoinABI,
        functionName: "transfer",
        args: [
          transferTo as `0x${string}`,
          transferAmount ? parseEther(transferAmount) : 0n,
        ],
      });
    } catch (err: unknown) {
      const error = err as Error;
      setError(`Transfer failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [writeContractFn, ngnAddress, transferTo, transferAmount]);

  const formatBalance = (balance: bigint | undefined): string => {
    if (!balance) return "0.00";
    return parseFloat(formatEther(balance)).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatSupply = (supply: string | undefined): string => {
    if (!supply) return "0";
    return parseFloat(formatEther(supply)).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  if (!isConnected) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            NGN Stablecoin Wallet
          </h3>
          <p className="text-gray-600">
            Please connect your wallet to view NGN balance
          </p>
        </div>
      </div>
    );
  }

  if (!ngnAddress) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            NGN Stablecoin Wallet
          </h3>
          <p className="text-yellow-600">
            NGN Stablecoin not deployed on this network
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          NGN Stablecoin Wallet
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">₦</span>
          </div>
          <span className="text-sm text-gray-600">NGN</span>
        </div>
      </div>

      {/* Balance Display */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Your NGN Balance</p>
          <p className="text-3xl font-bold text-green-700">
            ₦{formatBalance(balance as bigint)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {balance ? formatEther(balance as bigint) : "0"} NGN
          </p>
        </div>
      </div>

      {/* Token Info */}
      {tokenInfo && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">Total Supply</p>
            <p className="text-sm font-semibold">
              ₦{formatSupply(tokenInfo.totalSupply)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">Max Supply</p>
            <p className="text-sm font-semibold">
              ₦{formatSupply(tokenInfo.maxSupply)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">Status</p>
            <div className="flex space-x-1">
              {tokenInfo.transfersEnabled && (
                <span
                  className="inline-block w-2 h-2 bg-green-500 rounded-full"
                  title="Transfers Enabled"
                ></span>
              )}
              {tokenInfo.mintingEnabled && (
                <span
                  className="inline-block w-2 h-2 bg-blue-500 rounded-full"
                  title="Minting Enabled"
                ></span>
              )}
              {tokenInfo.burningEnabled && (
                <span
                  className="inline-block w-2 h-2 bg-red-500 rounded-full"
                  title="Burning Enabled"
                ></span>
              )}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">Network</p>
            <p className="text-sm font-semibold">
              {formatNetworkName(chainId)}
            </p>
          </div>
        </div>
      )}

      {/* Transfer Section */}
      <div className="border-t pt-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Send NGN</h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Address
            </label>
            <input
              type="text"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (NGN)
            </label>
            <input
              type="number"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Transfer Validation */}
          {canTransferData && transferAmount && transferTo && (
            <div
              className={`p-3 rounded-md ${canTransferData[0] ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
            >
              <p
                className={`text-sm ${canTransferData[0] ? "text-green-700" : "text-red-700"}`}
              >
                {canTransferData[1]}
              </p>
            </div>
          )}

          <button
            onClick={handleTransfer}
            disabled={isLoading || isTransferLoading || !canTransferData?.[0]}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading || isTransferLoading ? "Sending..." : "Send NGN"}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}
    </div>
  );
};

export default NGNWallet;
