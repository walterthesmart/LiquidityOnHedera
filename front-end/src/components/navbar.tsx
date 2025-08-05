"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header className="shadow-sm bg-background fixed flex items-center justify-between top-0 left-0 right-0 z-50 px-4">
        <div className="flex h-16 items-center justify-between w-full">
          {/* Logo - Always visible on mobile */}
          <div className="flex items-center">
            <div
              className="flex gap-1 cursor-pointer"
              onClick={() => router.push("/")}
            >
              <Image
                alt="logo"
                src="/Liquidity.png"
                width={100}
                height={100}
                className="w-6 h-6"
              />
              <div className="text-xl font-semibold">Liquidity</div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <ConnectButton />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2 h-10 w-10"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={toggleMobileMenu}
          />
          <div className="fixed top-16 left-0 right-0 bg-background border-b shadow-lg p-4">
            <div className="flex flex-col space-y-4">
              <ConnectButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
