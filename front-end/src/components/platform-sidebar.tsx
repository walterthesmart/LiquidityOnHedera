"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  // IconSettings,
  IconSocial,
  IconUserExclamation,
  IconChartCandle,
} from "@tabler/icons-react";
import Link from "next/link";
import { motion } from "motion/react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
export function PlatformSidebar() {
  const { user } = useUser();
  const adminLink = {
    label: "Admin Panel",
    href: "/admin",
    icon: <IconUserExclamation className="h-5 w-5 shrink-0" />,
  };
  const links = [
    {
      label: "Marketplace",
      href: "/marketplace",
      icon: <IconSocial className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Exchange",
      href: "/dex",
      icon: <IconChartCandle className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <IconBrandTabler className=" h-5 w-5 shrink-0" />,
    },
    // {
    //   label: "Settings",
    //   href: "/settings",
    //   icon: <IconSettings className="h-5 w-5 shrink-0" />,
    // },
    //
    {
      label: "Logout",
      href: "/",
      icon: <IconArrowLeft className=" h-5 w-5 shrink-0" />,
    },
  ];
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "rounded-md  flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800   border border-neutral-200 dark:border-neutral-700 overflow-hidden",
        "h-screen",
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}

            <div className="mt-8 flex flex-col gap-2">
              {/*admin link*/}
              {user?.publicMetadata?.role === "admin" && (
                <SidebarLink link={adminLink} />
              )}
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: "Guest",
                href: "#",
                icon: (
                  <Image
                    src="/globe.svg"
                    className="h-7 w-7 shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="Avatar"
                  />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
    </div>
  );
}
export const Logo = () => {
  return (
    <Link
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-black dark:text-white whitespace-pre"
      >
        Liquidity
      </motion.span>
    </Link>
  );
};
export const LogoIcon = () => {
  return (
    <Link
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-primary  rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm shrink-0" />
    </Link>
  );
};
