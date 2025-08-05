"use client";

import { motion } from "framer-motion";
import {
  CardContent,
  CardHeader,
  CardDescription,
  Card,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { IconTimeline, IconFileDollar, IconCash } from "@tabler/icons-react";
import { ArrowRight } from "lucide-react";

import Link from "next/link";

export function FeaturesSection() {
  return (
    <section className="z-20 pt-16 pb-12 md:pt-28 md:pb-20 px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl lg:text-5xl font-bold text-center mb-4">
          How It Works
        </h2>
        <p className="text-center text-muted-foreground max-w-3xl mx-auto mb-16">
          Our platform makes stock trading accessible to everyone through a
          simple three-step process.
        </p>
      </motion.div>
      <div className="grid gap-8 md:grid-cols-3 ">
        {/* Step 1 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-primary/10 relative md:h-[350px] bg-card backdrop-blur-sm border border-white/10 shadow-lg group hover:bg-black/5 transition-all duration-300">
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-transform duration-300 group-hover:scale-110">
              1
            </div>
            <CardHeader className="pt-8">
              <IconTimeline className="h-10 w-10 text-primary mb-4 transition-transform duration-300 group-hover:scale-110" />
              <CardTitle className="text-xl">Browse Stocks</CardTitle>
              <CardDescription className="text-base">
                Explore our selection of available stocks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground/80">
                Browse through a curated selection of stocks from various
                markets and sectors.
              </p>
            </CardContent>
            <CardFooter>
              <Link
                href="/marketplace"
                className="group flex items-center text-primary hover:text-primary/70 transition-colors"
              >
                <span className="mr-1">View Marketplace</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
        {/* Step 2 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-primary/10 relative md:h-[350px] bg-card backdrop-blur-sm border border-white/10 shadow-lg group hover:bg-black/5 transition-all duration-300">
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-transform duration-300 group-hover:scale-110">
              2
            </div>
            <CardHeader className="pt-8">
              <IconFileDollar className="h-10 w-10 text-primary mb-4 transition-transform duration-300 group-hover:scale-110" />
              <CardTitle className="text-xl">Buy Stocks</CardTitle>
              <CardDescription className="text-base">
                Purchase stocks using ETH or mobile money
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground/80">
                Choose from a wide range of stocks and pay with your preferred
                payment method. Transactions are secure and executed instantly.
              </p>
            </CardContent>
            <CardFooter>
              <Link
                href="/marketplace"
                className="group flex items-center text-primary hover:text-primary/70 transition-colors"
              >
                <span className="mr-1">View Marketplace</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
        {/* Step 3 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-primary/10 relative md:h-[350px] bg-card backdrop-blur-sm border border-white/10 shadow-lg group hover:bg-black/5 transition-all duration-300">
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-transform duration-300 group-hover:scale-110">
              3
            </div>
            <CardHeader className="pt-8">
              <IconCash className="h-10 w-10 text-primary mb-4 transition-transform duration-300 group-hover:scale-110" />
              <CardTitle className="text-xl">Sell & Cash Out</CardTitle>
              <CardDescription className="text-base">
                Sell your stocks and receive payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground/80">
                Sell your stocks anytime and receive funds via mobile money or
                BFT & ICP. Withdrawals are processed within 24 hours.
              </p>
            </CardContent>
            <CardFooter>
              <Link
                href="/dashboard"
                className="group flex items-center text-primary hover:text-primary/70 transition-colors"
              >
                <span className="mr-1">Manage Portfolio</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
