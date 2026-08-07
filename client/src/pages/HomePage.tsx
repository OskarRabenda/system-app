import { Suspense, useLayoutEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text3D, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

const FONT = "/fonts/helvetiker_bold.typeface.json";
const SIZE = 2.6;
const DEPTH = 0.9; // extrusion depth

const APPEAR = 0.4; // scales up into view
const HOLD = 0.55; // stands still, letting it register
const JUMP = 0.95; // airborne, carrying one full turn
const LIFT = 1.15; // peak height in world units

/** Second at which the S has landed — drives the app's phase timing. */
export const HERO_SETTLED = HOLD + JUMP + 0.2;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const eOut = (t: number) => 1 - Math.pow(1 - t, 3);
const eInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function Letter() {
  const mesh = useRef<THREE.Mesh>(null!);
  const shadow = useRef<THREE.Group>(null!);
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

    const appear = eOut(clamp(t / APPEAR, 0, 1));
    mesh.current.scale.setScalar(appear);
    mesh.current.visible = t > 0.02;

    const since = t - HOLD;
    let height = 0;
    if (since > 0) {
      const p = clamp(since / JUMP, 0, 1);
      // One arc up and down, with a full turn spread across it.
      height = Math.sin(Math.PI * p) * LIFT;
      mesh.current.rotation.y = eInOut(p) * Math.PI * 2;
    }
    mesh.current.position.y = height;

    // The shadow tightens as it rises, which is what sells the height.
    if (shadow.current) {
      const k = 1 - (height / LIFT) * 0.45;
      shadow.current.scale.setScalar(k);
    }
  });

  return (
    <>
      <Text3D
        ref={mesh}
        font={FONT}
        size={SIZE}
        height={DEPTH}
        curveSegments={14}
        bevelEnabled
        bevelThickness={0.08}
        bevelSize={0.05}
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

      <ContactShadows
        ref={shadow}
        position={[0, -1.9, 0]}
        scale={9}
        blur={2.6}
        opacity={0.6}
        far={5}
        resolution={512}
        color="#000000"
      />
    </>
  );
}

export default function HomePage() {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 9], fov: 35 }}
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
