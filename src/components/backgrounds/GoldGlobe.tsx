"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const POINT_COUNT = 1800;
const RADIUS = 1.6;

/** Evenly distributed points on a sphere (Fibonacci lattice). Deterministic. */
function fibonacciSphere(count: number, radius: number): Float32Array {
  const out = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    out[i * 3] = Math.cos(theta) * r * radius;
    out[i * 3 + 1] = y * radius;
    out[i * 3 + 2] = Math.sin(theta) * r * radius;
  }
  return out;
}

/** Round, soft-edged points that fade toward the back of the sphere. */
const vertexShader = /* glsl */ `
  uniform float uSize;
  uniform float uPixelRatio;
  varying float vDepth;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Normal points toward the camera on the front face, away on the back.
    vec3 n = normalize(normalMatrix * normalize(position));
    vDepth = n.z * 0.5 + 0.5;
    gl_PointSize = uSize * uPixelRatio * (0.55 + 0.45 * vDepth) * (4.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vDepth;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float disc = smoothstep(0.5, 0.15, d);
    gl_FragColor = vec4(uColor, disc * uOpacity * (0.18 + 0.82 * vDepth));
  }
`;

function Globe({
  pointer,
  animate,
}: {
  pointer: React.RefObject<{ x: number; y: number }>;
  animate: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const dpr = useThree((s) => s.viewport.dpr);
  const positions = useMemo(() => fibonacciSphere(POINT_COUNT, RADIUS), []);
  const uniforms = useMemo(
    () => ({
      uSize: { value: 5.5 },
      uPixelRatio: { value: dpr },
      uColor: { value: new THREE.Color("#d4a853") },
      uOpacity: { value: 0.95 },
    }),
    [dpr]
  );

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    // Slow spin plus a gentle tilt toward the cursor, eased so it never snaps.
    if (animate) g.rotation.y += delta * 0.08;
    const p = pointer.current;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, 0.35 + p.y * 0.18, 3, delta);
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, p.x * 0.12, 3, delta);
  });

  return (
    <group ref={group} rotation={[0.35, 0, 0]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {/* Equator + a tilted orbit ring for a little structure. */}
      {[0, 0.9].map((tilt) => (
        <mesh key={tilt} rotation={[Math.PI / 2 + tilt, tilt * 0.6, 0]}>
          <torusGeometry args={[RADIUS * 1.18, 0.003, 8, 160]} />
          <meshBasicMaterial color="#d4a853" transparent opacity={0.28} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * WebGL gold point globe (three.js via react-three-fiber). Purely decorative:
 * pointer-events off, aria-hidden. Renders only while on screen, and holds a
 * still frame under prefers-reduced-motion.
 */
export default function GoldGlobe({ className = "" }: { className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const [inView, setInView] = useState(false);
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      rootMargin: "200px",
    });
    io.observe(el);
    if (reduced) return () => io.disconnect();

    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduced]);

  return (
    <div ref={wrap} aria-hidden className={`pointer-events-none ${className}`}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 4.6], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        frameloop={inView && !reduced ? "always" : "demand"}
      >
        <Globe pointer={pointer} animate={!reduced} />
      </Canvas>
    </div>
  );
}
