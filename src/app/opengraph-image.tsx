import { ImageResponse } from "next/og";

export const alt =
  "Alpha Kappa Psi — Omicron Tau Chapter, Rutgers University";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(120% 120% at 50% 0%, #2d3e5f 0%, #1a2744 55%, #0f172a 100%)",
          color: "white",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            fontSize: 40,
            letterSpacing: 12,
            color: "#d4a853",
            fontFamily: "sans-serif",
            textTransform: "uppercase",
          }}
        >
          Omicron Tau
        </div>
        <div style={{ display: "flex", fontSize: 260, fontWeight: 800, marginTop: 10 }}>
          <span>AK</span>
          <span style={{ color: "#d4a853" }}>Ψ</span>
        </div>
        <div
          style={{
            fontSize: 34,
            color: "rgba(255,255,255,0.85)",
            fontFamily: "sans-serif",
            marginTop: 8,
          }}
        >
          Rutgers University&apos;s premier business fraternity
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 24,
            color: "rgba(255,255,255,0.55)",
            fontFamily: "sans-serif",
          }}
        >
          60+ members · 200+ alumni · 10+ industries
        </div>
      </div>
    ),
    { ...size }
  );
}
