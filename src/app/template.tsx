"use client";

import { motion } from "framer-motion";

/**
 * Route-level fade transition. `template.tsx` re-mounts on every navigation,
 * so this plays a subtle fade-in on each route change. We animate opacity only
 * (never transform) so it doesn't create a containing block that would break
 * the fixed navbar. Next.js already restores scroll to top on navigation.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex min-h-full flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
