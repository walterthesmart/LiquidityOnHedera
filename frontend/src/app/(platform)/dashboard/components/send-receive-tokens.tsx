"use client";

import React, { useState, useCallback } from "react";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import { parseEther, isAddress } from "ethers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import QRCode from "@/components/ui/qr-code";
import TransactionStatus from "@/components/ui/transaction-status";
import {
  Send,
  Download,
  Copy,
  QrCode,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  NGNStablecoinABI,
  NigerianStockTokenABI,
  CONTRACT_ADDRESSES,
} from "@/abis";
import { useTokenBalances } from "@/hooks/use-token-balances";
import { getTransactionUrl, formatAddress } from "@/lib/explorer-utils";

interface Transaction {
  hash: string;
  type: "send" | "receive";
  token: string;
  amount: string;
  address: string;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
}

export const SendReceiveTokens: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();

  // Use token balances hook
  const { tokenBalances, isLoading: balancesLoading, refreshBalances } = useTokenBalances();

  // State management
  const [activeTab, setActiveTab] = useState("send");
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [addressCopied, setAddressCopied] = useState(false);

  // Get contract addresses for current network
  const contractAddresses = chainId ? CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] : null;

  // Copy address to clipboard
  const copyAddress = useCallback(async () => {
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address);
      setAddressCopied(true);
      toast.success("Address copied to clipboard!");
      setTimeout(() => setAddressCopied(false), 2000);
    } catch {
      toast.error("Failed to copy address");
    }
  }, [address]);

  // Validate send form
  const validateSendForm = useCallback(() => {
    if (!selectedToken) {
      toast.error("Please select a token to send");
      return false;
    }
    
    if (!recipientAddress) {
      toast.error("Please enter recipient address");
      return false;
    }
    
    if (!isAddress(recipientAddress)) {
      toast.error("Invalid recipient address");
      return false;
    }
    
    if (!sendAmount || parseFloat(sendAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return false;
    }

    const selectedTokenBalance = tokenBalances.find(t => t.symbol === selectedToken);
    if (selectedTokenBalance && parseFloat(sendAmount) > parseFloat(selectedTokenBalance.balance)) {
      toast.error("Insufficient balance");
      return false;
    }

    return true;
  }, [selectedToken, recipientAddress, sendAmount, tokenBalances]);

  // Handle send transaction
  const handleSend = useCallback(async () => {
    if (!validateSendForm() || !address || !contractAddresses) return;

    setIsLoading(true);
    
    try {
      const selectedTokenData = tokenBalances.find(t => t.symbol === selectedToken);
      if (!selectedTokenData) throw new Error("Token not found");

      const amount = parseEther(sendAmount);
      let txHash: string;

      if (selectedToken === "NGN") {
        // Send NGN Stablecoin
        txHash = await writeContractAsync({
          address: contractAddresses.ngnStablecoin as `0x${string}`,
          abi: NGNStablecoinABI,
          functionName: "transfer",
          args: [recipientAddress as `0x${string}`, amount],
        });
      } else {
        // Send stock token
        txHash = await writeContractAsync({
          address: selectedTokenData.address as `0x${string}`,
          abi: NigerianStockTokenABI,
          functionName: "transfer",
          args: [recipientAddress as `0x${string}`, amount],
        });
      }

      // Add transaction to history
      const newTransaction: Transaction = {
        hash: txHash,
        type: "send",
        token: selectedToken,
        amount: sendAmount,
        address: recipientAddress,
        timestamp: Date.now(),
        status: "pending",
      };

      setTransactions(prev => [newTransaction, ...prev]);
      
      toast.success("Transaction submitted successfully!");
      
      // Reset form
      setSelectedToken("");
      setRecipientAddress("");
      setSendAmount("");
      
      // Reload balances
      setTimeout(() => {
        refreshBalances();
      }, 2000);

    } catch (error: unknown) {
      console.error("Send transaction failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Transaction failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [validateSendForm, address, contractAddresses, tokenBalances, selectedToken, sendAmount, recipientAddress, writeContractAsync, refreshBalances]);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Send & Receive Tokens
          </CardTitle>
          <CardDescription>
            Connect your wallet to send and receive NGN and stock tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Please connect your wallet to continue</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Send & Receive Tokens
            </CardTitle>
            <CardDescription>
              Transfer NGN stablecoin and Nigerian stock tokens
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshBalances}
            disabled={balancesLoading}
          >
            {balancesLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send
            </TabsTrigger>
            <TabsTrigger value="receive" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Receive
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Send Tab */}
          <TabsContent value="send" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token-select">Select Token</Label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose token to send" />
                  </SelectTrigger>
                  <SelectContent>
                    {tokenBalances.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <div className="flex items-center justify-between w-full">
                          <span className="flex items-center gap-2">
                            {token.symbol === "NGN" ? (
                              <Badge variant="secondary">Stablecoin</Badge>
                            ) : (
                              <Badge variant="outline">Stock</Badge>
                            )}
                            {token.symbol}
                          </span>
                          <span className="text-sm text-gray-500">
                            {parseFloat(token.balance).toFixed(4)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  placeholder="0x..."
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className={`font-mono text-sm ${
                    recipientAddress && !isAddress(recipientAddress)
                      ? "border-red-500 focus:border-red-500"
                      : ""
                  }`}
                />
                {recipientAddress && !isAddress(recipientAddress) && (
                  <p className="text-sm text-red-500">Invalid Ethereum address</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    step="0.000001"
                    min="0"
                    className="pr-20"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    {selectedToken && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                          const balance = tokenBalances.find(t => t.symbol === selectedToken)?.balance;
                          if (balance) setSendAmount(balance);
                        }}
                      >
                        MAX
                      </Button>
                    )}
                    {selectedToken && (
                      <span className="text-sm text-gray-500">{selectedToken}</span>
                    )}
                  </div>
                </div>
                {selectedToken && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Available:</span>
                    <span>
                      {tokenBalances.find(t => t.symbol === selectedToken)?.balance || "0"} {selectedToken}
                    </span>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleSend} 
                disabled={isLoading || !selectedToken || !recipientAddress || !sendAmount}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Tokens
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Receive Tab */}
          <TabsContent value="receive" className="space-y-6">
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <Label>Your Wallet Address</Label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <code className="flex-1 text-sm font-mono break-all">
                    {address}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyAddress}
                    className="shrink-0"
                  >
                    {addressCopied ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <QrCode className="h-5 w-5" />
                  <span className="font-medium">QR Code</span>
                </div>
                <div className="flex justify-center">
                  <QRCode
                    value={address || ""}
                    size={192}
                    className="border-2 border-gray-200"
                  />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Share this QR code or address to receive tokens
                </p>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <ExternalLink className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.hash} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {tx.type === "send" ? (
                        <ArrowUpRight className="h-5 w-5 text-red-500" />
                      ) : (
                        <ArrowDownLeft className="h-5 w-5 text-green-500" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {tx.type === "send" ? "Sent" : "Received"} {tx.amount} {tx.token}
                          </span>
                          <TransactionStatus status={tx.status} />
                        </div>
                        <p className="text-sm text-gray-500 font-mono">
                          {tx.type === "send" ? "To: " : "From: "}{formatAddress(tx.address, 6)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </p>
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={getTransactionUrl(chainId || 11155111, tx.hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
