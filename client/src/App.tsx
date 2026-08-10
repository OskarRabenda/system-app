import { useCallback, useEffect, useRef, useState } from "react";
import HomePage, { HERO_SETTLED } from "./pages/HomePage";
import WaveReveal, { type Origin } from "./components/WaveReveal";
import DashboardPage from "./features/dashboard/DashboardPage";
import DietPage from "./features/diet/DietPage";
import TasksPage from "./features/tasks/TasksPage";
import type { SectionId } from "./features/dashboard/sections";

type Screen = "hero" | "dashboard" | "diet" | "tasks";

const BEAT = 140; // pause after the S lands, before the reveal takes over

export default function App() {
  const [screen, setScreen] = useState<Screen>("hero");
  const [under, setUnder] = useState<Screen | null>(null); // outgoing, painted beneath
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [revealing, setRevealing] = useState(false);
  const startedRef = useRef(false);

  const go = useCallback((to: Screen, from: Origin | null) => {
    setUnder((prev) => prev ?? null);
    setScreen((current) => {
      setUnder(current);
      return to;
    });
    setOrigin(from);
    setRevealing(true);
  }, []);

  /* The intro advances on its own. Re-arms whenever we land back on the hero,
     so replaying from the corner mark behaves exactly like a fresh load. */
  useEffect(() => {
    if (screen !== "hero") return;
    startedRef.current = false;
    const id = setTimeout(() => {
      if (startedRef.current) return;
      startedRef.current = true;
      go("dashboard", null);
    }, HERO_SETTLED * 1000 + BEAT);
    return () => clearTimeout(id);
  }, [screen, go]);

  const skipIntro = (from: Origin) => {
    if (startedRef.current) return;
    startedRef.current = true;
    go("dashboard", from);
  };

  const handleSelect = (id: SectionId, from: Origin) => {
    if (id === "diet" || id === "tasks") {
      go(id, from);
      return;
    }
    // Sleep and workouts have no screen yet.
    console.log(`[system] section selected: ${id}`);
  };

  const render = (which: Screen) => {
    if (which === "hero") return <HomePage />;
    if (which === "diet")
      return <DietPage onBack={(from) => go("dashboard", from)} />;
    if (which === "tasks")
      return <TasksPage onBack={(from) => go("dashboard", from)} />;
    return (
      <DashboardPage
        onSelect={handleSelect}
        origin={origin}
        onReplayIntro={(from) => go("hero", from)}
      />
    );
  };

  return (
    <>
      {/* Outgoing screen: stays live and static while the wavefront runs. */}
      {revealing && under && <div className="under-layer">{render(under)}</div>}

      <WaveReveal
        className="page"
        active={revealing}
        origin={origin}
        onDone={() => {
          setRevealing(false);
          setUnder(null);
        }}
      >
        {render(screen)}
      </WaveReveal>

      {screen === "hero" && (
        <div
          className="hero-hit"
          onPointerDown={(e) => skipIntro({ x: e.clientX, y: e.clientY })}
        />
      )}
    </>
  );
}
