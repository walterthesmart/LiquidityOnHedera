"use client";

import React from "react";
// Temporarily disabled due to vanilla-extract build issue with RainbowKit
// import { useState, useEffect } from "react";
// import { useAccount } from "wagmi";
// Temporarily disabled due to vanilla-extract build issue with RainbowKit
/*
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { bitfinityService } from "@/lib/bitfinity-contract-service";

import { TokenizeStockForm } from "./_components/tokenize-stock-form";
*/

/*
interface AdminStats {
  totalTokens: number;
  totalMarketCap: string;
  activeTokens: number;
  totalUsers: number;
  totalVolume: string;
  totalTransactions: number;
}
*/

export default function AdminDashboard() {
  // Temporarily disabled due to vanilla-extract build issue with RainbowKit
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard Temporarily Unavailable</h1>
        <p className="text-gray-600">This page is temporarily disabled due to a build configuration issue with @vanilla-extract/sprinkles.</p>
        <p className="text-gray-600 mt-2">We are working to resolve this issue.</p>
      </div>
    </div>
  );
}

/*
// Original implementation commented out due to vanilla-extract build issue
function AdminDashboardOriginal() {
  const { address, isConnected } = useAccount();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      checkAdminStatus();
      loadAdminData();
    }
  }, [isConnected, address]);

  const checkAdminStatus = async () => {
    try {
      setIsAdmin(true); // For demo purposes
    } catch (error) {
      console.error("Failed to check admin status:", error);
      setIsAdmin(false);
    }
  };

  const loadAdminData = async () => {
    try {
      setLoading(true);

      const factoryStats = await bitfinityService.getFactoryStats();
      if (factoryStats) {
        setStats({
          totalTokens: Number(factoryStats.totalDeployedTokens),
          totalMarketCap: `₦${(Number(factoryStats.totalMarketCap) / 1e12).toFixed(2)}T`,
          activeTokens: Number(factoryStats.totalSymbols),
          totalUsers: 1250,
          totalVolume: "₦45.2B",
          totalTransactions: 8934,
        });
      }
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to access the admin dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            You don&apos;t have admin permissions to access this dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage Nigerian Stock Exchange tokens on Bitfinity EVM
          </p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Tokens
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTokens}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeTokens} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Market Cap
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMarketCap}</div>
              <p className="text-xs text-muted-foreground">Across all tokens</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Active traders</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVolume}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalTransactions} transactions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="tokens" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tokens">Token Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="space-y-4">
          <TokenizeStockForm />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                View detailed analytics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <BarChart3 className="h-4 w-4" />
                <AlertDescription>
                  Advanced analytics features will be implemented here.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system-wide settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Emergency Pause</Label>
                    <p className="text-sm text-muted-foreground">
                      Pause all token operations system-wide
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
*/
