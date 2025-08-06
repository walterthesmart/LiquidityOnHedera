"use client";

import { Button } from "@/components/ui/button";
import { IconEye } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export function ViewButton({ symbol }: { symbol: string }) {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => router.push(`/marketplace/${symbol}`)}
    >
      <IconEye className="h-4 w-4 mr-1" />
      View
    </Button>
  );
}
