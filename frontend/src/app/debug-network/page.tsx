import { NetworkDebugChecker } from "@/components/debug-network-checker";
import { WalletStatus } from "@/components/WalletStatus";

export default function DebugNetworkPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold mb-8">Network Debug Dashboard</h1>

        {/* Wallet Connection Test */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Wallet Connection Test</h2>
          <WalletStatus />
        </div>

        {/* Network Debug */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Network Configuration</h2>
          <NetworkDebugChecker />
        </div>
      </div>
    </div>
  );
}
