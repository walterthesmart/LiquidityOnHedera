"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function AdminKeyBoardShortcut() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const isAdmin = user?.publicMetadata?.role === "admin";

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !isAdmin) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      //  Alt+Shift+A to access admin route
      if (e.altKey && e.shiftKey && e.key === "A") {
        router.push("/admin");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoaded, isSignedIn, isAdmin, router]);
  return null;
}
