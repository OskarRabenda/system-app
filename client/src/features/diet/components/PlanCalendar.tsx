import { useEffect, useState } from "react";
import { PLAN } from "../plan";
import { formatWindow } from "../data";

type Props = {
  /** Day code to open on, e.g. "Wed". */
  initialDay: string;
  onClose: () => void;
};

export default function PlanCalendar({ initialDay, onClose }: Props) {
  const [active, setActive] = useState(initialDay);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const day = PLAN.days.find((d) => d.code === active) ?? PLAN.days[0];

  return (
    <div className="sheet-backdrop" onPointerDown={onClose}>
      <div
        className="sheet plan-sheet glass"
        role="dialog"
        aria-modal="true"
        aria-label="Weekly plan"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="glass-sheen" aria-hidden="true" />
        <div className="sheet-body">
          <header className="sheet-head">
            <div>
              <h2>{PLAN.title}</h2>
              <p className="plan-summary">{PLAN.summary}</p>
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

          <nav className="day-tabs" aria-label="Day">
            {PLAN.days.map((d) => (
              <button
                key={d.code}
                type="button"
                className={`day-tab ${d.code === active ? "is-on" : ""}`}
                aria-pressed={d.code === active}
                onClick={() => setActive(d.code)}
              >
                {d.code}
              </button>
            ))}
          </nav>

          <ul className="plan-meals">
            {day.meals.map((m, i) => (
              <li key={`${m.slot}-${i}`} className="plan-meal">
                <div className="plan-when">
                  <span className="plan-slot">{m.slot}</span>
                  <span className="plan-time">
                    {formatWindow(m)}
                  </span>
                </div>

                {m.image ? (
                  <img
                    className="plan-thumb"
                    src={m.image}
                    alt=""
                    loading="lazy"
                    onError={(e) => e.currentTarget.remove()}
                  />
                ) : (
                  <span className="plan-thumb is-empty" aria-hidden="true" />
                )}

                <div className="plan-what">
                  <span className="plan-title">{m.en || m.pl}</span>
                  {m.pl && m.en && <span className="plan-original">{m.pl}</span>}
                  <span className="plan-macros">
                    {m.macros.calories} kcal · {m.macros.protein}g P ·{" "}
                    {m.macros.carbs}g C · {m.macros.fat}g F
                    {m.minutes ? ` · ⏱ ${m.minutes} min` : ""}
                  </span>
                </div>

                {m.link ? (
                  <a
                    className="recipe-btn small"
                    href={m.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Recipe <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <span className="no-recipe">no recipe</span>
                )}
              </li>
            ))}
          </ul>

          <div className="plan-totals">
            <span className="plan-totals-label">{day.full} total</span>
            <span className="plan-totals-values">
              <strong>{day.total.calories}</strong> kcal ·{" "}
              <strong>{day.total.protein}</strong>g protein ·{" "}
              <strong>{day.total.carbs}</strong>g carbs ·{" "}
              <strong>{day.total.fat}</strong>g fat · {day.fiber}g fiber
            </span>
          </div>

          <dl className="plan-targets">
            {(
              [
                ["calories", "kcal"],
                ["protein", "protein"],
                ["carbs", "carbs"],
                ["fat", "fat"],
                ["fiber", "fiber"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <dt>{label}</dt>
                <dd>{PLAN.targetLabels[key]}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
