"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionStatusProps {
  status: "pending" | "confirmed" | "failed";
  className?: string;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  status,
  className,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "pending":
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          label: "Pending",
          variant: "secondary" as const,
          className: "text-yellow-700 bg-yellow-100 border-yellow-200",
        };
      case "confirmed":
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          label: "Confirmed",
          variant: "default" as const,
          className: "text-green-700 bg-green-100 border-green-200",
        };
      case "failed":
        return {
          icon: <XCircle className="h-3 w-3" />,
          label: "Failed",
          variant: "destructive" as const,
          className: "text-red-700 bg-red-100 border-red-200",
        };
      default:
        return {
          icon: <Clock className="h-3 w-3" />,
          label: "Unknown",
          variant: "outline" as const,
          className: "text-gray-700 bg-gray-100 border-gray-200",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        "flex items-center gap-1 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
};

export default TransactionStatus;
