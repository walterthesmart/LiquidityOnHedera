"use client";

import React, { useEffect, useRef } from "react";
import QRCodeLib from "qrcode";
import { cn } from "@/lib/utils";

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
  level?: "L" | "M" | "Q" | "H";
  includeMargin?: boolean;
}

export const QRCode: React.FC<QRCodeProps> = ({
  value,
  size = 200,
  className,
  level = "M",
  includeMargin = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    const canvas = canvasRef.current;

    QRCodeLib.toCanvas(canvas, value, {
      width: size,
      margin: includeMargin ? 4 : 0,
      errorCorrectionLevel: level,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    }).catch((error) => {
      console.error("QR Code generation failed:", error);
    });

  }, [value, size, level, includeMargin]);

  if (!value) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-gray-100 rounded-lg",
          className
        )}
        style={{ width: size, height: size }}
      >
        <span className="text-gray-500 text-sm">No data</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn("rounded-lg border", className)}
      style={{ width: size, height: size }}
    />
  );
};

export default QRCode;
