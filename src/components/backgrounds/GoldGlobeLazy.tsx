"use client";

import dynamic from "next/dynamic";

/**
 * Client-only, code-split entry for the three.js globe so the WebGL bundle
 * never blocks first paint or ships on pages that don't use it.
 */
const GoldGlobeLazy = dynamic(() => import("./GoldGlobe"), { ssr: false });

export default GoldGlobeLazy;
