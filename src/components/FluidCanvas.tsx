"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { startFluid, type FluidController } from "@/lib/fluidSimulation";
import SilkBackground from "@/components/backgrounds/SilkBackground";

/**
 * WebGL fluid-simulation hero background with graceful degradation:
 *  - `prefers-reduced-motion` or unsupported WebGL  → static silk gradient
 *  - Off-screen (IntersectionObserver) or hidden tab → render loop paused
 *  - User pause/resume toggle in the corner
 */
export default function FluidCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<FluidController | null>(null);
  const inViewRef = useRef(true);

  const [fallback, setFallback] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) {
      setFallback(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const controller = startFluid(canvas);
    if (!controller) {
      // WebGL unavailable / shader failure → static fallback.
      setFallback(true);
      return;
    }
    controllerRef.current = controller;
    controller.resume();
    setReady(true);

    // Pause when the hero scrolls out of view.
    const io = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        if (!entry.isIntersecting) controller.pause();
        else if (!document.hidden && !pausedByUser.current) controller.resume();
      },
      { threshold: 0.05 }
    );
    io.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) controller.pause();
      else if (inViewRef.current && !pausedByUser.current) controller.resume();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      controller.destroy();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track user intent separately so IO/visibility handlers respect it.
  const pausedByUser = useRef(false);

  function toggle() {
    const c = controllerRef.current;
    if (!c) return;
    if (c.isRunning()) {
      pausedByUser.current = true;
      c.pause();
      setPaused(true);
    } else {
      pausedByUser.current = false;
      c.resume();
      setPaused(false);
    }
  }

  if (fallback) {
    return <SilkBackground />;
  }

  return (
    <div className="absolute inset-0">
      <canvas
        ref={canvasRef}
        aria-hidden
        className="h-full w-full"
        style={{ display: "block", background: "#0f172a" }}
      />
      {ready && (
        <button
          onClick={toggle}
          aria-label={paused ? "Resume background animation" : "Pause background animation"}
          className="absolute bottom-4 right-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/20 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm transition-colors hover:bg-black/40 hover:text-white"
        >
          {paused ? <Play size={13} /> : <Pause size={13} />}
          {paused ? "Play" : "Pause"}
        </button>
      )}
    </div>
  );
}
