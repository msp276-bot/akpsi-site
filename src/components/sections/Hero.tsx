"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Pause, Play } from "lucide-react";

const FALLBACK_VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4";
const VIDEO_SRC =
  process.env.NEXT_PUBLIC_HERO_VIDEO_4K_URL || FALLBACK_VIDEO_SRC;

/**
 * Cinematic hero: fullscreen looping background video, Instrument Serif
 * headline with fade-rise entrances, liquid-glass CTA. The video is the only
 * visual layer — no decorative gradients — with a whisper of vignette for
 * legibility. Pause pill (bottom-right) halts the video; reduced-motion
 * starts it paused.
 */
export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      setPaused(true);
    }
  }, []);

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  }

  return (
    <section
      id="home"
      className="relative flex h-svh min-h-[640px] flex-col items-center justify-center overflow-hidden bg-[#0f172a]"
    >
      {/* Fullscreen video backdrop */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden
        className="absolute inset-0 z-0 h-full w-full object-cover"
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>

      {/* Subtle vignette so type stays legible over bright frames */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(90% 70% at 50% 45%, transparent 0%, rgba(15,23,42,0.3) 100%)",
        }}
      />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center px-6 pb-10 text-center">
        <p className="animate-fade-rise rounded-full border border-gold/50 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold sm:text-xs">
          Omicron Tau Chapter • Rutgers University
        </p>

        <h1
          className="animate-fade-rise mt-8 max-w-5xl font-cinematic text-5xl font-normal leading-[0.95] tracking-[-0.02em] text-white sm:text-7xl md:text-8xl"
        >
          Shaping People,
          <br />
          <em className="text-white/70">Shaping Business.</em>
        </h1>

        <p className="animate-fade-rise-delay mt-8 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
          The Omicron Tau Chapter is the premier developer of business talent at
          Rutgers University. We bridge the gap between academic theory and
          corporate reality.
        </p>

        <div className="animate-fade-rise-delay-2 mt-12 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/rush"
            className="liquid-glass inline-flex items-center justify-center rounded-full px-10 py-4 text-base font-medium text-white transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            Spring &rsquo;27 Application
          </Link>
          <Link
            href="/portal"
            className="inline-flex items-center justify-center rounded-full bg-gold px-10 py-4 text-base font-semibold text-navy transition-all duration-200 hover:scale-[1.03] hover:bg-gold-soft active:scale-[0.98]"
          >
            Access Portal
          </Link>
        </div>
      </div>

      {/* Bottom-center scroll indicator */}
      <a
        href="#about"
        aria-label="Scroll to about section"
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-white/40 transition-colors hover:text-white"
      >
        <ChevronDown className="animate-chevron" size={28} />
      </a>

      {/* Bottom-right video pause pill */}
      <button
        onClick={toggle}
        aria-label={paused ? "Play background video" : "Pause background video"}
        className="absolute bottom-6 right-6 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/50"
      >
        {paused ? <Play size={13} /> : <Pause size={13} />}
        {paused ? "Play" : "Pause"}
      </button>
    </section>
  );
}
