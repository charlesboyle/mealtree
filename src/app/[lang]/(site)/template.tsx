"use client";

import { motion } from "motion/react";
import { useEffect } from "react";

// Set once the first page has mounted, so only later (client) navigations animate.
let mounted = false;

/**
 * A template remounts on every navigation, so each page eases in while the frame around it stays put.
 * The first page is rendered fully visible: starting it at opacity 0 would ship the server HTML invisible until hydration.
 */
export default function SiteTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    mounted = true;
  }, []);
  return (
    <motion.div
      initial={mounted ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}
