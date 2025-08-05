"use client";

import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
  lightTheme,
  Theme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  sepolia,
} from "wagmi/chains";
import { bitfinityTestnet, bitfinityMainnet } from "@/config";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";

// RainbowKit configuration for EVM wallet support
// Including Bitfinity EVM networks alongside standard EVM chains

const config = getDefaultConfig({
  appName: "Liquidity Nigerian Stock Trading",
  projectId:
    process.env.NEXT_PUBLIC_PROJECT_ID || "b56e18d47c72ab683b10814fe9495694",
  chains: [
    // Primary networks for Nigerian stock trading
    bitfinityTestnet,
    bitfinityMainnet,
    sepolia, // Ethereum Sepolia testnet for additional testing
    // Popular EVM chains for broader wallet support
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
  ],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

// Custom theme that matches the project's design system
const customLightTheme: Theme = {
  ...lightTheme({
    accentColor: "oklch(55.63% 0.2 151.38)", // --primary
    accentColorForeground: "oklch(97.2% 0.01 22.62)", // --primary-foreground
    borderRadius: "medium", // matches --radius: 0.5rem
    fontStack: "system",
    overlayBlur: "small",
  }),
  colors: {
    ...lightTheme().colors,
    accentColor: "oklch(55.63% 0.2 151.38)",
    accentColorForeground: "oklch(97.2% 0.01 22.62)",
    actionButtonBorder: "oklch(89.5% 0.01 264.37)", // --border
    actionButtonBorderMobile: "oklch(89.5% 0.01 264.37)",
    actionButtonSecondaryBackground: "oklch(97.5% 0.005 264.37)", // --secondary
    closeButton: "oklch(70% 0.03 264.37)", // --muted-foreground
    closeButtonBackground: "oklch(97.5% 0.005 264.37)", // --muted
    connectButtonBackground: "oklch(55.63% 0.2 151.38)", // --primary
    connectButtonBackgroundError: "oklch(63.7% 0.23 29.23)", // --destructive
    connectButtonInnerBackground: "oklch(100% 0 0)", // --card
    connectButtonText: "oklch(97.2% 0.01 22.62)", // --primary-foreground
    connectButtonTextError: "oklch(98% 0 0)", // --destructive-foreground
    connectionIndicator: "oklch(55.63% 0.2 151.38)", // --primary
    downloadBottomCardBackground: "oklch(100% 0 0)", // --card
    downloadTopCardBackground: "oklch(97.5% 0.005 264.37)", // --secondary
    error: "oklch(63.7% 0.23 29.23)", // --destructive
    generalBorder: "oklch(89.5% 0.01 264.37)", // --border
    generalBorderDim: "oklch(89.5% 0.01 264.37)",
    menuItemBackground: "oklch(100% 0 0)", // --card
    modalBackdrop: "rgba(0, 0, 0, 0.5)",
    modalBackground: "oklch(100% 0 0)", // --card
    modalBorder: "oklch(89.5% 0.01 264.37)", // --border
    modalText: "oklch(12.7% 0.01 264.37)", // --foreground
    modalTextDim: "oklch(70% 0.03 264.37)", // --muted-foreground
    modalTextSecondary: "oklch(29.6% 0.015 264.37)", // --secondary-foreground
    profileAction: "oklch(100% 0 0)", // --card
    profileActionHover: "oklch(97.5% 0.005 264.37)", // --secondary
    profileForeground: "oklch(100% 0 0)", // --card
    selectedOptionBorder: "oklch(55.63% 0.2 151.38)", // --primary
    standby: "oklch(70% 0.03 264.37)", // --muted-foreground
  },
};

const customDarkTheme: Theme = {
  ...darkTheme({
    accentColor: "#00a046", // --primary in dark mode
    accentColorForeground: "oklch(23.7% 0.12 153.15)", // --primary-foreground in dark
    borderRadius: "medium",
    fontStack: "system",
    overlayBlur: "small",
  }),
  colors: {
    ...darkTheme().colors,
    accentColor: "#00a046",
    accentColorForeground: "oklch(23.7% 0.12 153.15)",
    actionButtonBorder: "oklch(21.5% 0.01 264.37)", // --border dark
    actionButtonBorderMobile: "oklch(21.5% 0.01 264.37)",
    actionButtonSecondaryBackground: "oklch(21.5% 0.01 264.37)", // --secondary dark
    closeButton: "oklch(74% 0.03 264.37)", // --muted-foreground dark
    closeButtonBackground: "oklch(19.5% 0 0)", // --muted dark
    connectButtonBackground: "#00a046", // --primary dark
    connectButtonBackgroundError: "oklch(35.6% 0.14 29.23)", // --destructive dark
    connectButtonInnerBackground: "oklch(18.7% 0.02 65.12)", // --card dark
    connectButtonText: "oklch(23.7% 0.12 153.15)", // --primary-foreground dark
    connectButtonTextError: "oklch(97.3% 0.02 29.23)", // --destructive-foreground dark
    connectionIndicator: "#00a046", // --primary dark
    downloadBottomCardBackground: "oklch(18.7% 0.02 65.12)", // --card dark
    downloadTopCardBackground: "oklch(21.5% 0.01 264.37)", // --secondary dark
    error: "oklch(35.6% 0.14 29.23)", // --destructive dark
    generalBorder: "oklch(21.5% 0.01 264.37)", // --border dark
    generalBorderDim: "oklch(21.5% 0.01 264.37)",
    menuItemBackground: "oklch(18.7% 0.02 65.12)", // --card dark
    modalBackdrop: "rgba(0, 0, 0, 0.8)",
    modalBackground: "oklch(18.7% 0.02 65.12)", // --card dark
    modalBorder: "oklch(21.5% 0.01 264.37)", // --border dark
    modalText: "oklch(95% 0 0)", // --foreground dark
    modalTextDim: "oklch(74% 0.03 264.37)", // --muted-foreground dark
    modalTextSecondary: "oklch(98% 0 0)", // --secondary-foreground dark
    profileAction: "oklch(18.7% 0.02 65.12)", // --card dark
    profileActionHover: "oklch(21.5% 0.01 264.37)", // --secondary dark
    profileForeground: "oklch(18.7% 0.02 65.12)", // --card dark
    selectedOptionBorder: "#00a046", // --primary dark
    standby: "oklch(74% 0.03 264.37)", // --muted-foreground dark
  },
};

interface RainbowKitAppProviderProps {
  children: ReactNode;
}

export function RainbowKitAppProvider({
  children,
}: RainbowKitAppProviderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect theme changes
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };

    // Initial check
    checkTheme();

    // Listen for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkTheme);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkTheme);
    };
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          appInfo={{
            appName: "Liquidity Nigerian Stock Trading",
            learnMoreUrl: "https://liquidity-trading.com",
          }}
          theme={isDarkMode ? customDarkTheme : customLightTheme}
          showRecentTransactions={true}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default RainbowKitAppProvider;
