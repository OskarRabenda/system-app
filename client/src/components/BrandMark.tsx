import { Suspense, useLayoutEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text3D } from "@react-three/drei";
import * as THREE from "three";

const FONT = "/fonts/helvetiker_bold.typeface.json";
const DEPTH = 0.28;
const CYCLE = 7; // seconds between performances
const HOP = 0.9; // seconds per hop
const BEAT = 0.1; // pause between the two hops
const LIFT = 0.24;

const eOut = (t: number) => 1 - Math.pow(1 - t, 3);

function Glyph() {
  const mesh = useRef<THREE.Mesh>(null!);
  const ready = useRef(false);

  // Centre the geometry so it spins about itself, not the font origin.
  useLayoutEffect(() => {
    const g = mesh.current.geometry;
    g.computeBoundingBox();
    const bb = g.boundingBox!;
    g.translate(
      -(bb.max.x + bb.min.x) / 2,
      -(bb.max.y + bb.min.y) / 2,
      -DEPTH / 2,
    );
    ready.current = true;
  }, []);

  useFrame(({ clock }) => {
    if (!ready.current) return;
    const t = clock.elapsedTime % CYCLE;

    // Two hops, each carrying a half turn, then still until the cycle repeats.
    if (t < HOP) {
      const p = t / HOP;
      mesh.current.position.y = Math.sin(Math.PI * p) * LIFT;
      mesh.current.rotation.y = eOut(p) * Math.PI;
    } else if (t < HOP + BEAT) {
      mesh.current.position.y = 0;
      mesh.current.rotation.y = Math.PI;
    } else if (t < HOP * 2 + BEAT) {
      const p = (t - HOP - BEAT) / HOP;
      mesh.current.position.y = Math.sin(Math.PI * p) * LIFT;
      mesh.current.rotation.y = Math.PI + eOut(p) * Math.PI;
    } else {
      mesh.current.position.y = 0;
      mesh.current.rotation.y = 0;
    }
  });

  return (
    <Text3D
      ref={mesh}
      font={FONT}
      size={1}
      height={DEPTH}
      curveSegments={8}
      bevelEnabled
      bevelThickness={0.04}
      bevelSize={0.025}
      bevelSegments={3}
    >
      S
      <meshStandardMaterial
        color="#ffffff"
        roughness={0.32}
        metalness={0.18}
        emissive="#aecbff"
        emissiveIntensity={0.18}
      />
    </Text3D>
  );
}

type Props = {
  /** Replays the intro. Receives the click point so the reveal starts there. */
  onClick?: (origin: { x: number; y: number }) => void;
};

/** The hero wordmark's opening letter, kept alive in the corner. */
export default function BrandMark({ onClick }: Props) {
  return (
    <button
      type="button"
      className="brand"
      aria-label="Replay the intro"
      title="Replay the intro"
      onClick={(e) => onClick?.({ x: e.clientX, y: e.clientY })}
    >
      <Canvas
        camera={{ position: [0, 0, 3.1], fov: 35 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[4, 6, 5]} intensity={1.6} />
        <directionalLight position={[-5, 2, 3]} intensity={0.5} />
        <pointLight position={[0, -1, 4]} intensity={0.5} color="#8fd7ff" />
        <Suspense fallback={null}>
          <Glyph />
        </Suspense>
      </Canvas>
    </button>
  );
}
