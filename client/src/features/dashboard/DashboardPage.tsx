import { useLayoutEffect, useRef } from "react";
import SectionCard from "./components/SectionCard";
import ContextHeader from "./components/ContextHeader";
import BrandMark from "../../components/BrandMark";
import Atmosphere, { setBleed } from "../../components/Atmosphere";
import { BAND, DURATION, type Origin } from "../../components/WaveReveal";
import { SECTIONS, type Section, type SectionId } from "./sections";

type Props = {
  onSelect?: (id: SectionId, origin: Origin) => void;
  /** Where the reveal started, so entrances can ride the same wavefront. */
  origin?: Origin | null;
  onReplayIntro?: (origin: Origin) => void;
};

export default function DashboardPage({
  onSelect,
  origin,
  onReplayIntro,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  /* Entrances are staggered by distance from the reveal origin rather than by
     index, so each element lands as the wavefront sweeps over it and the
     transition reads as one continuous motion. */
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = root.querySelectorAll<HTMLElement>("[data-enter]");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach((el) => el.style.setProperty("--enter-delay", "0ms"));
      return;
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const ox = origin ? origin.x : w / 2;
    const oy = origin ? origin.y : h / 2;
    const reach = Math.max(
      Math.hypot(ox, oy),
      Math.hypot(w - ox, oy),
      Math.hypot(ox, h - oy),
      Math.hypot(w - ox, h - oy),
    );

    targets.forEach((el) => {
      const r = el.getBoundingClientRect();
      const dx = r.left + r.width / 2 - ox;
      const dy = r.top + r.height / 2 - oy;
      // Mirrors WaveReveal's front: arrival normalises to ~distance, and the
      // front covers reach + BAND over DURATION.
      const delay = (Math.sqrt(dx * dx + dy * dy) / (reach + BAND)) * DURATION;
      el.style.setProperty("--enter-delay", `${Math.round(delay)}ms`);
    });
  }, [origin]);

  // Clear any lingering tint when leaving the dashboard.
  useLayoutEffect(() => () => setBleed(null), []);

  const handleSelect = (section: Section, from: Origin) => {
    setBleed(null);
    onSelect?.(section.id, from);
  };

  return (
    <div className="dash-root" ref={rootRef}>
      <Atmosphere />
      <BrandMark onClick={onReplayIntro} />

      <main className="dash">
        <ContextHeader />
        <div className="cards">
          {SECTIONS.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              onSelect={handleSelect}
              onHover={(s) => setBleed(s ? s.accent : null)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
