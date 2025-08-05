import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import RainbowKitAppProvider from "@/context/rainbowkit";
import { Navbar } from "@/components/navbar";
import { siteConfig } from "@/config/site";
import TanstackProvider from "@/context/tanstack";
import { ClerkProvider } from "@clerk/nextjs";
import { AdminKeyBoardShortcut } from "@/components/admin-shortcut";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GlobalErrorHandler } from "@/components/global-error-handler";
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["vietnamese"],
});
export const metadata: Metadata = {
  title: {
    template: `%s|${siteConfig.name}`,
    default: siteConfig.name,
  },
  description: siteConfig.description,
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${plusJakartaSans.className} antialiased`}>
          <GlobalErrorHandler />
          <TanstackProvider>
            <RainbowKitAppProvider>
              <Navbar />
              {children}
            </RainbowKitAppProvider>
            <AdminKeyBoardShortcut />
            <Analytics />
            <SpeedInsights />
          </TanstackProvider>
          <Toaster richColors closeButton expand visibleToasts={4} />
        </body>
      </html>
    </ClerkProvider>
  );
}
