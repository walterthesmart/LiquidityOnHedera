"use client";
import { motion } from "framer-motion";
import { Rocket, Shield, Zap, Code, Accessibility } from "lucide-react";
import { PartnerShowcase } from "./partner-showcase";
import {
  IconBrandStocktwits,
  IconDeviceMobile,
  IconLock,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
const partnersData = [
  {
    name: "NSE Integration",
    logo: <IconBrandStocktwits className="h-8 w-8 text-primary" />,
    description: "Real-time  integration with NSE for current market data.",
  },
  {
    name: "Blockchain Security",
    logo: <IconLock className="h-8 w-8 text-primary" />,
    description:
      "Leveraging cutting-edge blockchain technology to secure transactions.",
  },
  {
    name: "Mobile Money Payments",
    logo: <IconDeviceMobile className="h-8 w-8 text-primary" />,
    description:
      "Seamless integration with mobile payment providers such as MPESA and Airtel Money.",
  },
];

export function TechnologyShowcaseSection(/*{ scrollY }: { scrollY: number }*/) {
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
        opacity: scrollY > 1300 ? 1 : 0,
        y: scrollY > 1300 ? 0 : 30,
      }}
      transition={{ duration: 0.6 }}
      className="z-20 py-20 px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Code className="h-8 w-8 text-primary" />
          <h2 className="text-3xl lg:text-4xl font-bold text-center">
            Cutting-Edge Technology
          </h2>
        </div>
        <p className="text-center text-muted-foreground max-w-3xl mx-auto mb-16">
          Built with innovative technologies for a seamless trading experience.
        </p>
        <PartnerShowcase partners={partnersData} />
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center"
          >
            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Rocket className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Fast Execution</h3>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center"
          >
            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Accessibility className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Easily Accessible</h3>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center"
          >
            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Secure Platform</h3>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center"
          >
            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Zap className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Smart Contracts</h3>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
