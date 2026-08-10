import { useEffect, useRef, useState } from "react";
import Atmosphere from "../../components/Atmosphere";
import WorkoutSetSheet from "./components/WorkoutSetSheet";
import { formatElapsed } from "./data";
import type { Origin } from "../../components/WaveReveal";

type Props = {
  onBack?: (origin: Origin) => void;
};

export default function WorkoutsPage({ onBack }: Props) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [setOpen, setSetOpen] = useState(false);
  const frame = useRef(0);

  /* Elapsed time is derived from the start timestamp rather than counted up,
     so a backgrounded tab cannot drift behind. */
  useEffect(() => {
    if (startedAt === null) return;
    const tick = () => {
      setElapsed((Date.now() - startedAt) / 1000);
      frame.current = window.setTimeout(tick, 250);
    };
    tick();
    return () => window.clearTimeout(frame.current);
  }, [startedAt]);

  const running = startedAt !== null;

  return (
    <main className="screen workouts">
      <Atmosphere />

      <header className="screen-head">
        <button
          type="button"
          className="back"
          onClick={(e) => onBack?.({ x: e.clientX, y: e.clientY })}
        >
          <span aria-hidden="true">←</span> Dashboard
        </button>
        <div className="screen-title">
          <span className="screen-emoji" aria-hidden="true">
            🏋️
          </span>
          <h1>Workouts</h1>
          <button
            type="button"
            className="plan-btn"
            onClick={() => setSetOpen(true)}
            title="Show the workout set"
            aria-label="Show the workout set"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" className="set-icon">
              <line x1="3" y1="5" x2="17" y2="5" />
              <line x1="3" y1="10" x2="17" y2="10" />
              <line x1="3" y1="15" x2="12" y2="15" />
            </svg>
          </button>
        </div>
      </header>

      <div className="workout-stage">
        <button
          type="button"
          className={`start-btn ${running ? "is-running" : ""}`}
          onClick={() => {
            if (running) {
              setStartedAt(null);
              setElapsed(0);
            } else {
              setStartedAt(Date.now());
            }
          }}
        >
          <span className="start-label">{running ? "Finish" : "Start"}</span>
          {running && (
            <span className="start-time">{formatElapsed(elapsed)}</span>
          )}
        </button>

        <p className="workout-hint">
          {running
            ? "Session running."
            : "Open the set to see what today holds."}
        </p>
      </div>

      {setOpen && <WorkoutSetSheet onClose={() => setSetOpen(false)} />}
    </main>
  );
}
