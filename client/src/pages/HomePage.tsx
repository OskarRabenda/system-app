import { Suspense, useLayoutEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text3D, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

const FONT = "/fonts/helvetiker_bold.typeface.json";
const SIZE = 1.25;
const DEPTH = 0.44; // extrusion depth

const APPEAR = 0.35; // scales up into view
const HOLD = 0.3; // a beat before it goes
const SPIN = 0.9; // one turn, decelerating into place

/** Second at which the S has come to rest — drives the app's phase timing. */
export const HERO_SETTLED = HOLD + SPIN + 0.15;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/* Fast off the mark, easing down to a stop. Monotonic on purpose — it never
   passes the full turn and rocks back. Cubic rather than quartic: a steeper
   power leaves a long tail where the last degree crawls and the spin looks
   stalled while the transition waits. */
const spinEase = (t: number) => 1 - Math.pow(1 - t, 3);

const eOut = (t: number) => 1 - Math.pow(1 - t, 3);

function Letter() {
  const mesh = useRef<THREE.Mesh>(null!);
  const ready = useRef(false);

  // Centre the geometry so it turns about itself, not the font origin.
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
    const t = clock.elapsedTime;

    mesh.current.visible = t > 0.02;
    mesh.current.scale.setScalar(eOut(clamp(t / APPEAR, 0, 1)));

    const since = t - HOLD;
    if (since > 0) {
      mesh.current.rotation.y =
        spinEase(clamp(since / SPIN, 0, 1)) * Math.PI * 2;
    }
  });

  return (
    <Text3D
      ref={mesh}
      font={FONT}
      size={SIZE}
      height={DEPTH}
      curveSegments={14}
      bevelEnabled
      bevelThickness={0.055}
      bevelSize={0.035}
      bevelSegments={5}
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

export default function HomePage() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8] , fov: 35 }}
      dpr={[1, 2]}
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh" }}
    >
      <color attach="background" args={["#06070b"]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 7, 6]} intensity={1.5} />
      <directionalLight position={[-6, 2, 3]} intensity={0.55} />
      <pointLight position={[0, -1, 5]} intensity={0.6} color="#8fd7ff" />

      <Suspense fallback={null}>
        <Letter />
      </Suspense>

      {/* Kept faint and static: it grounds the letter without reading as a
          second element now that nothing jumps. */}
      <ContactShadows
        position={[0, -1.15, 0]}
        scale={6}
        blur={2.8}
        opacity={0.4}
        far={4}
        resolution={512}
        color="#000000"
      />

      <EffectComposer>
        <Bloom
          intensity={1.1}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
