import { Suspense, useLayoutEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text3D, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

const FONT = "/fonts/helvetiker_bold.typeface.json";
const SIZE = 1.8;
const DEPTH = 0.62; // extrusion depth

const APPEAR = 0.4; // scales up into view
const HOLD = 0.55; // stands still, letting it register
const JUMP = 0.95; // airborne
const SPIN = 1.3; // the turn keeps ringing briefly after landing
const LIFT = 1.0; // peak height in world units

/* Overshoot, as in the curve editor: the turn accelerates hard, sails past a
   full rotation, then rocks back in shrinking swings. */
/* Frequency is lower than the 3 in the curve editor because that panel counts
   oscillations over its own timebase. At 3 the whole turn is over in ~140ms,
   too fast to read as a spin; 1.4 completes it in ~300ms and peaks near the
   top of the jump, then rocks to a stop as the S lands. */
const FREQUENCY = 1.4;
const AMPLITUDE = 0.2; // 20% past the target on the first swing

// Damping ratio that yields exactly AMPLITUDE of overshoot.
const ZETA = (() => {
  const l = Math.log(AMPLITUDE);
  return -l / Math.sqrt(Math.PI * Math.PI + l * l);
})();

/** Step response of a damped oscillator: 0 at rest, settling on 1. */
function overshoot(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const root = Math.sqrt(1 - ZETA * ZETA);
  const wd = FREQUENCY * 2 * Math.PI; // damped frequency over the unit move
  const wn = wd / root;
  return 1 - (Math.exp(-ZETA * wn * t) / root) * Math.sin(wd * t + Math.acos(ZETA));
}

/** Second at which the S has landed and stopped ringing. */
export const HERO_SETTLED = HOLD + SPIN + 0.15;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const eOut = (t: number) => 1 - Math.pow(1 - t, 3);

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
      // The jump is a plain arc — gravity does not overshoot the floor.
      height = Math.sin(Math.PI * clamp(since / JUMP, 0, 1)) * LIFT;
      // The turn does, settling a little after the landing.
      mesh.current.rotation.y =
        overshoot(clamp(since / SPIN, 0, 1)) * Math.PI * 2;
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
