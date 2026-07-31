import { useEffect } from "react";

/**
 * Shared background for every screen: slow-drifting colour, a pointer-tracked
 * spotlight, and an accent tint. Glass surfaces need something behind them to
 * refract, so this sits under all content.
 *
 * Pointer coordinates live on the document element so any screen can use them
 * without threading props through the tree.
 */
export default function Atmosphere() {
  useEffect(() => {
    const el = document.documentElement;
    let x = 0;
    let y = 0;
    let queued = false;
    let raf = 0;

    const flush = () => {
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
      queued = false;
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!queued) {
        queued = true;
        raf = requestAnimationFrame(flush);
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="aurora" aria-hidden="true">
        <i className="aurora-a" />
        <i className="aurora-b" />
      </div>
      <div className="bleed" aria-hidden="true" />
      <div className="spotlight" aria-hidden="true" />
    </>
  );
}

/** Tint the page with a section's hue, or clear it when passed null. */
export function setBleed(color: string | null) {
  const el = document.documentElement;
  if (color) {
    el.style.setProperty("--bleed", color);
    el.classList.add("is-bleeding");
  } else {
    el.classList.remove("is-bleeding");
  }
}
