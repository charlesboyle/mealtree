"use client";

import { motion } from "motion/react";

/** A template remounts on every navigation, so each page eases in while the frame around it stays put. */
export default function SiteTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}
