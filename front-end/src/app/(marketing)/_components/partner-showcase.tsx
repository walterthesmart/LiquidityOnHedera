"use client";
import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
interface Partner {
  name: string;
  logo: React.ReactNode;
  description: string;
}

interface PartnerShowcaseProps {
  partners: Partner[];
}

export const PartnerShowcase = ({ partners }: PartnerShowcaseProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {partners.map((partner, index) => {
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true, margin: "-50px" }}
            className=" duration-300"
          >
            <Card className="border-primary/10 ">
              <CardHeader>
                <div className="h-16 w-16 rounded-full overflow-hidden bg-primary/20 mb-4 flex items-center justify-center">
                  {partner.logo}
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold text-lg mb-2">{partner.name}</h4>
                <p className="text-muted-foreground">{partner.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
