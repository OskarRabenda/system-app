import { useEffect, useState } from "react";
import { totalSets, WORKOUT_SETS } from "../data";

type Props = {
  onClose: () => void;
};

export default function WorkoutSetSheet({ onClose }: Props) {
  const [active, setActive] = useState(WORKOUT_SETS[0].id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = WORKOUT_SETS.find((s) => s.id === active) ?? WORKOUT_SETS[0];

  return (
    <div className="sheet-backdrop" onPointerDown={onClose}>
      <div
        className="sheet set-sheet glass"
        role="dialog"
        aria-modal="true"
        aria-label="Workout set"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="glass-sheen" aria-hidden="true" />
        <div className="sheet-body">
          <header className="sheet-head">
            <div>
              <p className="eyebrow">Workout set</p>
              <h2>{set.name}</h2>
              <p className="set-focus">{set.focus}</p>
            </div>
            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </header>

          <nav className="day-tabs" aria-label="Set">
            {WORKOUT_SETS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`day-tab ${s.id === active ? "is-on" : ""}`}
                aria-pressed={s.id === active}
                onClick={() => setActive(s.id)}
              >
                {s.name}
              </button>
            ))}
          </nav>

          <ul className="exercises">
            {set.exercises.map((e, i) => (
              <li key={e.id} className="exercise">
                <span className="exercise-no">{i + 1}</span>
                <span className="exercise-main">
                  <span className="exercise-name">{e.name}</span>
                  {e.detail && (
                    <span className="exercise-detail">{e.detail}</span>
                  )}
                </span>
                <span className="exercise-load">
                  {e.sets} × {e.reps}
                </span>
              </li>
            ))}
          </ul>

          <p className="stat-foot">
            <strong>{set.exercises.length}</strong> exercises ·{" "}
            <strong>{totalSets(set)}</strong> working sets
          </p>
        </div>
      </div>
    </div>
  );
}
