import { Button } from "@/components/ui/button";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";
import { IconChartBar } from "@tabler/icons-react";
import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { Footer } from "./_components/footer";
import { TechnologyShowcaseSection } from "./_components/technology-showcase-section";
import { TrustSection } from "./_components/trust-section";
import { FeaturesSection } from "./_components/features";

export default function LandingPage() {
  const words = [
    {
      text: "Trade",
    },
    {
      text: "stocks",
    },
    {
      text: "with",
    },
    {
      text: "Tokenized",
      className: "text-primary",
    },
    {
      text: "Naira",
      className: "text-primary",
    },
    {
      text: "and",
    },
    {
      text: "BFT & ICP",
      className: "text-primary",
    },
    {
      text: "on",
    },
    {
      text: "ICP",
      className: "text-primary",
    },
  ];

  // Animation variants
  // const container = {
  //   hidden: { opacity: 0 },
  //   show: {
  //     opacity: 1,
  //     transition: {
  //       staggerChildren: 0.1,
  //       delayChildren: 0.3,
  //     },
  //   },
  // };
  // const item = {
  //   hidden: { y: 20, opacity: 0 },
  //   show: { y: 0, opacity: 1 },
  // };
  //
  // const fadeIn = {
  //   hidden: { opacity: 0, y: 20 },
  //   visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  // };
  return (
    <div className="relative  grid justify-items-center ">
      <section className="pt-32 px-8  w-full relative pb-6 md:pt-56 md:pb-10">
        <div className="grid gap-8   items-center">
          <div className="space-y-6 w-full ">
            <h1 className="text-4xl  md:hidden my-auto max-w-xl font-bold tracking-tight">
              Trade stocks with{" "}
              <span className="text-primary">Tokenized Naira</span> and{" "}
              <span className="text-primary">BFT & ICP</span> on{" "}
              <span className="text-primary">ICP</span>
            </h1>
            <TypewriterEffectSmooth
              words={words}
              className="font-bold  flex justify-center  text-5xl hidden md:flex tracking-tight flex-wrap"
              cursorClassName="bg-primary my-auto"
            />
            <p className="text-lg mx-auto  md:text-xl lg:text-2xl text-muted-foreground md:max-w-5xl  text-left md:text-center ">
              Connect your wallet and start investing in Nigerian stocks using
              tokenized Naira or BFT & ICP on the ICP network. Track your
              portfolio and trade when you&apos;re ready.
            </p>
            <div className="md:flex gap-4  justify-center items-center grid">
              <Button
                size="lg"
                asChild
                className="w-64 h-12 text-lg  font-semibold"
              >
                <Link href="/marketplace">
                  <TrendingUp className="mr-2 h-6 w-6" /> Explore Stocks
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-64 h-12 text-lg  font-semibold"
                asChild
              >
                <Link href="/dashboard">
                  <IconChartBar className="mr-2 h-6 w-6 text-black" /> Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>



      {/* Features Section */}
      <FeaturesSection />

      {/*Trust Section*/}
      <TrustSection />
      {/*Technology showcase section*/}
      <TechnologyShowcaseSection />
      <Footer />
    </div>
  );
}
