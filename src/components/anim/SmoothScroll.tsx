"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/**
 * Inertial smooth scrolling (Lenis) for the public site. Lenis drives the
 * native scroll position, so framer-motion's useScroll and the parallax
 * components keep working unchanged. Wheel/trackpad only: touch devices keep
 * native momentum scrolling. Skipped entirely under prefers-reduced-motion and
 * inside the portal, which is an app UI with its own scroll panes.
 */
export default function SmoothScroll() {
  const pathname = usePathname();
  const enabled = !pathname.startsWith("/portal");

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      anchors: true,
      allowNestedScroll: true,
      stopInertiaOnNavigate: true,
    });
    return () => lenis.destroy();
  }, [enabled]);

  return null;
}
