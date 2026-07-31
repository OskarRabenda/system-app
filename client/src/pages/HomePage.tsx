import { Suspense, useLayoutEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text3D, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

const FONT = "/fonts/helvetiker_bold.typeface.json";
const CHARS = ["S", "y", "s", "t", "e", "m"];
const SIZE = 1.2;
const DEPTH = 0.5; // extrusion depth
const HOLD = 1.0; // the S sits alone before the word assembles
const GAP = 0.06; // letter spacing
const RISE = 0.22; // letters lift into place from below

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const eOut = (t: number) => 1 - Math.pow(1 - t, 3);
const eInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Second at which the wordmark has fully settled — drives the app's phase timing. */
export const HERO_SETTLED = 2.1;

function Wordmark() {
  const group = useRef<THREE.Group>(null!);
  const meshes = useRef<THREE.Mesh[]>([]);
  const slotX = useRef<number[]>([]);
  const sCenter = useRef(0);
  const ready = useRef(false);

  // Lay the word out once: measure each glyph, then recenter its geometry so
  // rotation pivots about the glyph itself rather than the font origin.
  useLayoutEffect(() => {
    const info = meshes.current.map((m) => {
      m.geometry.computeBoundingBox();
      const bb = m.geometry.boundingBox!;
      return { w: bb.max.x - bb.min.x, cx: (bb.max.x + bb.min.x) / 2 };
    });
    const total = info.reduce((a, b) => a + b.w, 0) + GAP * (info.length - 1);
    let x = -total / 2;
    const centers: number[] = [];
    info.forEach((f, i) => {
      centers.push(x + f.w / 2);
      meshes.current[i].geometry.translate(-f.cx, 0, -DEPTH / 2);
      x += f.w + GAP;
    });
    slotX.current = centers;
    sCenter.current = centers[0];
    ready.current = true;
  }, []);

  useFrame(({ clock }) => {
    if (!ready.current) return;
    const t = clock.elapsedTime;

    // The S holds at true center; the group then drifts so the finished
    // wordmark ends up centered instead.
    const assembled = eInOut(clamp((t - HOLD) / 0.9, 0, 1));
    group.current.position.x = lerp(-sCenter.current, 0, assembled);
    group.current.position.y = -0.5;

    meshes.current.forEach((m, i) => {
      m.position.x = slotX.current[i];

      if (i === 0) {
        const appear = eOut(clamp(t / 0.4, 0, 1));
        const since = t - HOLD;
        m.visible = t > 0.05;
        m.rotation.y =
          since <= 0 ? 0 : eOut(clamp(since / 1.2, 0, 1)) * Math.PI * 2;
        m.scale.setScalar(appear);
        m.position.y = (1 - appear) * -RISE;
      } else {
        const startsAt = HOLD + 0.12 + (i - 1) * 0.11;
        const e = eOut(clamp((t - startsAt) / 0.3, 0, 1));
        m.visible = e > 0.001;
        m.rotation.y = (1 - e) * (Math.PI / 2);
        m.scale.setScalar(e);
        m.position.y = (1 - e) * -RISE;
      }
    });
  });

  return (
    // A fixed slight tilt keeps the extruded sides readable at rest, with no drift.
    <group ref={group} rotation={[0.05, -0.12, 0]}>
      {CHARS.map((c, i) => (
        <Text3D
          key={i}
          ref={(el) => {
            if (el) meshes.current[i] = el as unknown as THREE.Mesh;
          }}
          font={FONT}
          size={SIZE}
          height={DEPTH}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.05}
          bevelSize={0.03}
          bevelSegments={4}
        >
          {c}
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.32}
            metalness={0.18}
            emissive="#aecbff"
            emissiveIntensity={0.18}
          />
        </Text3D>
      ))}
    </group>
  );
}

export default function HomePage() {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 35 }}
      dpr={[1, 2]}
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh" }}
    >
      <color attach="background" args={["#06070b"]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 7, 6]} intensity={1.5} />
      <directionalLight position={[-6, 2, 3]} intensity={0.55} />
      <pointLight position={[0, -1, 5]} intensity={0.6} color="#8fd7ff" />

      <Suspense fallback={null}>
        <Wordmark />
      </Suspense>

      <ContactShadows
        position={[0, -1.35, 0]}
        scale={13}
        blur={3}
        opacity={0.55}
        far={4.5}
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
