"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { hasMounted, markMounted, ownsEntrance } from "@/lib/page-transition";

/**
 * A template remounts on every navigation, so each page eases in while the frame around it stays put.
 * The first page is rendered fully visible: starting it at opacity 0 would ship the server HTML invisible until hydration.
 * The map, and the list when it was left through the map transition, animate their own entrance instead.
 */
export default function SiteTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [fade] = useState(() => hasMounted() && !ownsEntrance(pathname));
  useEffect(() => {
    markMounted();
  }, []);
  return (
    <motion.div
      initial={fade ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}
