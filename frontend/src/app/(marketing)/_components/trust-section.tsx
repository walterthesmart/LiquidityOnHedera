"use client";
import { motion } from "framer-motion";
import { Shield, Zap, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
export function TrustSection() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{
        opacity: scrollY > 1000 ? 1 : 0,
        y: scrollY > 1000 ? 0 : 30,
      }}
      transition={{ duration: 0.6 }}
      className="z-20 py-16 px-8 bg-gradient-to-r shadow from-slate-50 to-primary/60 backdrop-blur-md rounded-xl"
    >
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
          Why Choose Liquidity?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-md">
            <Shield className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Secure Platform</h3>
            <p className="text-muted-foreground">
              All transactions are encrypted and protected by advanced security
              protocols.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-md">
            <Zap className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              Easy and Quick cash-outs
            </h3>
            <p className="text-muted-foreground">
              Go to your dashboard, select the stocks you want to sell, and
              choose your preferred withdrawal method. Funds will be transferred
              within 24 hours.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-md">
            <CheckCircle2 className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Transparent Fees</h3>
            <p className="text-muted-foreground">
              There are no hidden fees or monthly charges.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
