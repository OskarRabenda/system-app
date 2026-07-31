import { useEffect, useRef, type ReactNode } from "react";

/* Tuned values. Change deliberately — they are balanced against each other. */
export const DURATION = 900; // ms for the front to cross the whole viewport
export const BAND = 140; // px width of the soft edge. Narrow = crisp, wide = bloom
const NOISE_FREQ = 0.0045; // per-px noise frequency; ~220px feature size
const NOISE_AMP = 270; // px peak-to-peak arrival offset, so ±135
const DIST_WEIGHT = 0.835; // how strongly true distance dominates the noise
const TEXEL = 4; // CSS px per mask sample. 4 = smooth; 20 = chunky mosaic
const REDUCED_FADE = 200; // ms crossfade when prefers-reduced-motion

export type Origin = { x: number; y: number };

type Props = {
  /** True while the reveal should be running. */
  active: boolean;
  /** Click/tap point. Null falls back to viewport centre. */
  origin: Origin | null;
  onDone: () => void;
  children: ReactNode;
  className?: string;
};

/* ---------- 3-octave value noise, output 0..1 ---------- */

/** fbm(x, y) = sum over octaves of WEIGHT[o] * valueNoise(x * FREQ[o], y * FREQ[o]). */
const OCTAVE_FREQ = [1, 2.3, 4.7] as const;
const OCTAVE_WEIGHT = [0.6, 0.3, 0.1] as const; // sums to 1, so fbm stays 0..1

function hash2(ix: number, iy: number): number {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);

/**
 * Reveals `children` over whatever is painted beneath it, along a noise-warped
 * wavefront expanding from `origin`.
 *
 * Resize mid-transition: the run finishes against the field computed at its
 * start, and the new viewport size is picked up on the next transition.
 * Recomputing mid-flight would cost another field pass and visibly jump the
 * boundary, and a transition only lasts 900ms.
 */
export default function WaveReveal({
  active,
  origin,
  onDone,
  children,
  className = "",
}: Props) {
  const layerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const el = layerRef.current;
    if (!el || !active) return;

    const setMask = (value: string) => {
      el.style.setProperty("-webkit-mask-image", value);
      el.style.setProperty("mask-image", value);
    };
    // Snapping to "no mask" is what completion and interruption both look like:
    // the layer is fully painted, never left half-masked.
    const snapComplete = () => setMask("none");

    /* Reduced motion: no field, no noise, no mask — just a short crossfade. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      snapComplete();
      el.style.transition = "none";
      el.style.opacity = "0";
      const raf = requestAnimationFrame(() => {
        el.style.transition = `opacity ${REDUCED_FADE}ms linear`;
        el.style.opacity = "1";
      });
      const id = setTimeout(() => {
        el.style.transition = "";
        el.style.opacity = "";
        doneRef.current();
      }, REDUCED_FADE + 20);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(id);
        el.style.transition = "";
        el.style.opacity = "";
      };
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const ox = origin ? origin.x : w / 2;
    const oy = origin ? origin.y : h / 2;
    const cols = Math.ceil(w / TEXEL);
    const rows = Math.ceil(h / TEXEL);

    // A zero-sized viewport — backgrounded tab, container not laid out yet —
    // would make createImageData throw and, with no error boundary above us,
    // blank the whole app. There is nothing to reveal at that size: show the
    // page and move on.
    if (cols < 1 || rows < 1) {
      snapComplete();
      doneRef.current();
      return;
    }

    // Farthest corner: the front must still be travelling when the last pixel lands.
    const reach = Math.max(
      Math.hypot(ox, oy),
      Math.hypot(w - ox, oy),
      Math.hypot(ox, h - oy),
      Math.hypot(w - ox, h - oy),
    );

    /*
     * The arrival field. Every texel stores the front radius at which that
     * texel flips to the incoming page: true distance from the origin, warped
     * by fbm so the boundary breaks into lobes instead of staying a circle.
     * It is normalised so its maximum equals `reach`, which guarantees the
     * final pixel lands exactly on the last frame no matter where the user
     * clicked. Computed once per transition — never per frame.
     */
    if (import.meta.env.DEV) console.time("[WaveReveal] arrival field");
    const arrival = new Float32Array(cols * rows);
    let max = 0;

    // Noise-space x per column, per octave — hoisted out of the inner loop.
    const nx = [
      new Float64Array(cols),
      new Float64Array(cols),
      new Float64Array(cols),
    ];
    for (let i = 0; i < cols; i++) {
      const xn = i * TEXEL * NOISE_FREQ;
      for (let o = 0; o < 3; o++) nx[o][i] = xn * OCTAVE_FREQ[o];
    }

    // Lattice corners only change when the integer cell changes, which at this
    // frequency is every ~55 texels for octave 0. Caching them per row (and
    // sqrt instead of Math.hypot) makes this ~3.4x faster for identical output.
    const y0 = [0, 0, 0];
    const sy = [0, 0, 0];
    const lastX0 = [NaN, NaN, NaN];
    const c00 = [0, 0, 0];
    const c10 = [0, 0, 0];
    const c01 = [0, 0, 0];
    const c11 = [0, 0, 0];

    for (let j = 0; j < rows; j++) {
      const y = j * TEXEL;
      const yn = y * NOISE_FREQ;
      for (let o = 0; o < 3; o++) {
        const yy = yn * OCTAVE_FREQ[o];
        y0[o] = Math.floor(yy);
        sy[o] = smoothstep(yy - y0[o]);
        lastX0[o] = NaN; // row changed, corner cache is stale
      }

      for (let i = 0; i < cols; i++) {
        const x = i * TEXEL;
        const dx = x - ox;
        const dy = y - oy;
        const d = Math.sqrt(dx * dx + dy * dy);

        let n = 0;
        for (let o = 0; o < 3; o++) {
          const xx = nx[o][i];
          const cx = Math.floor(xx);
          if (cx !== lastX0[o]) {
            lastX0[o] = cx;
            c00[o] = hash2(cx, y0[o]);
            c10[o] = hash2(cx + 1, y0[o]);
            c01[o] = hash2(cx, y0[o] + 1);
            c11[o] = hash2(cx + 1, y0[o] + 1);
          }
          const sx = smoothstep(xx - cx);
          const a = c00[o] + (c10[o] - c00[o]) * sx;
          const b = c01[o] + (c11[o] - c01[o]) * sx;
          n += OCTAVE_WEIGHT[o] * (a + (b - a) * sy[o]);
        }

        const v = d * DIST_WEIGHT + (n - 0.5) * NOISE_AMP;
        arrival[j * cols + i] = v;
        if (v > max) max = v;
      }
    }

    const norm = max > 0 ? reach / max : 1;
    for (let k = 0; k < arrival.length; k++) arrival[k] *= norm;
    if (import.meta.env.DEV) console.timeEnd("[WaveReveal] arrival field");

    let canvas: HTMLCanvasElement | null = document.createElement("canvas");
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (!ctx) {
      snapComplete();
      doneRef.current();
      return;
    }

    const img = ctx.createImageData(cols, rows);
    const data = img.data;
    // Only alpha changes per frame; RGB stays white.
    for (let k = 0; k < cols * rows; k++) {
      data[k * 4] = 255;
      data[k * 4 + 1] = 255;
      data[k * 4 + 2] = 255;
    }

    const total = reach + BAND;
    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min((now - start) / DURATION, 1);
      const front = t * total;

      try {
        for (let k = 0; k < arrival.length; k++) {
          let p = (front - arrival[k]) / BAND;
          p = p < 0 ? 0 : p > 1 ? 1 : p;
          data[k * 4 + 3] = (p * p * (3 - 2 * p)) * 255;
        }

        ctx.putImageData(img, 0, 0);
        setMask(`url(${canvas!.toDataURL()})`);
      } catch (err) {
        // A decorative transition must never leave the page half-masked or
        // take the tree down. Snap to the finished state and carry on.
        console.warn("[WaveReveal] reveal aborted, showing page:", err);
        snapComplete();
        doneRef.current();
        return;
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        snapComplete();
        doneRef.current();
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafRef.current);
      // An interrupted run snaps to complete so the next one starts from a
      // fully painted layer — two masks never run at once.
      snapComplete();
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
        canvas = null;
      }
    };
  }, [active, origin]);

  return (
    <div ref={layerRef} className={`wave-layer ${className}`}>
      {children}
    </div>
  );
}

