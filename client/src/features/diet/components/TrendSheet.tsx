import { useEffect, useMemo, useState } from "react";
import { RANGES, series, tickLabel, type Range } from "../history";
import { DAILY_TARGET } from "../data";

/**
 * Categorical hues, validated for a dark surface (OKLCH lightness band,
 * chroma floor, CVD separation and contrast). The card colours used elsewhere
 * fail as a chart palette — amber against coral sits at ΔE 13.6, which is below
 * the readable floor even with normal colour vision.
 */
export const SERIES = {
  calories: { key: "calories", label: "Calories", unit: "kcal", hue: "#2f86cc" },
  protein: { key: "protein", label: "Protein", unit: "g", hue: "#2f86cc" },
  carbs: { key: "carbs", label: "Carbs", unit: "g", hue: "#b8842c" },
  fat: { key: "fat", label: "Fat", unit: "g", hue: "#8f66d6" },
} as const;

export type MacroKey = "protein" | "carbs" | "fat";
type Mode = "calories" | "macros";

type Props = {
  mode: Mode;
  onClose: () => void;
};

const W = 720;
const H = 260;
const PAD = { l: 46, r: 16, t: 14, b: 26 };

export default function TrendSheet({ mode, onClose }: Props) {
  const [range, setRange] = useState<Range>("week");
  const [active, setActive] = useState<MacroKey[]>(["protein"]);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const points = useMemo(() => series(range), [range]);

  const keys: (MacroKey | "calories")[] =
    mode === "calories" ? ["calories"] : active;

  const values = points.map((p) =>
    keys.map((k) => (k === "calories" ? p.eaten.calories : p.eaten[k])),
  );
  const target = mode === "calories" ? DAILY_TARGET.calories : null;
  const flat = values.flat().filter((n) => Number.isFinite(n));
  const max = Math.max(...flat, target ?? 0, 1) * 1.12;

  const x = (i: number) =>
    PAD.l +
    (points.length < 2
      ? 0
      : (i / (points.length - 1)) * (W - PAD.l - PAD.r));
  const y = (v: number) => H - PAD.b - (v / max) * (H - PAD.t - PAD.b);

  const path = (k: MacroKey | "calories") =>
    points
      .map((p, i) => {
        const v = k === "calories" ? p.eaten.calories : p.eaten[k];
        return `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
      })
      .join(" ");

  // Enough ticks to orient without crowding the axis.
  const tickEvery = Math.max(1, Math.ceil(points.length / 6));

  const toggle = (k: MacroKey) =>
    setActive((cur) =>
      cur.includes(k)
        ? cur.length > 1
          ? cur.filter((x) => x !== k)
          : cur // never leave the chart with nothing plotted
        : [...cur, k],
    );

  /* Switching from Month to Week leaves the hover index pointing past the end
     of the shorter series. Reading through it threw and, with no error
     boundary above, took the whole app down — so the index is validated here
     rather than trusted. */
  const at = hover !== null && hover < points.length ? hover : null;
  const hovered = at !== null ? points[at] : null;

  return (
    <div className="sheet-backdrop" onPointerDown={onClose}>
      <div
        className="sheet trend-sheet glass"
        role="dialog"
        aria-modal="true"
        aria-label={mode === "calories" ? "Calorie trend" : "Macro trend"}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="glass-sheen" aria-hidden="true" />
        <div className="sheet-body">
          <header className="sheet-head">
            <h2>{mode === "calories" ? "Calories over time" : "Macros over time"}</h2>
            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </header>

          <div className="trend-controls">
            <div className="range-tabs" role="group" aria-label="Time range">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`day-tab ${range === r.id ? "is-on" : ""}`}
                  aria-pressed={range === r.id}
                  onClick={() => { setHover(null); setRange(r.id); }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {mode === "macros" && (
            <div className="macro-picker" role="group" aria-label="Macros shown">
              {(["protein", "carbs", "fat"] as MacroKey[]).map((k) => {
                const s = SERIES[k];
                const on = active.includes(k);
                return (
                  <button
                    key={k}
                    type="button"
                    className={`macro-choice ${on ? "is-on" : ""}`}
                    style={{ ["--hue" as string]: s.hue }}
                    aria-pressed={on}
                    onClick={() => toggle(k)}
                  >
                    <span className="swatch" aria-hidden="true" />
                    <span className="macro-choice-name">{s.label}</span>
                    <span className="macro-choice-val">
                      {Math.round(
                        points.reduce((a, p) => a + p.eaten[k], 0) /
                          Math.max(points.length, 1),
                      )}
                      {s.unit} avg
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <figure className="chart">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              role="img"
              aria-label={`${keys.join(", ")} over the last ${points.length} days`}
              onPointerLeave={() => setHover(null)}
              onPointerMove={(e) => {
                const box = e.currentTarget.getBoundingClientRect();
                const px = ((e.clientX - box.left) / box.width) * W;
                const i = Math.round(
                  ((px - PAD.l) / (W - PAD.l - PAD.r)) * (points.length - 1),
                );
                setHover(Math.min(Math.max(i, 0), points.length - 1));
              }}
            >
              {/* recessive grid */}
              {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                <line
                  key={f}
                  className="grid"
                  x1={PAD.l}
                  x2={W - PAD.r}
                  y1={y(max * f)}
                  y2={y(max * f)}
                />
              ))}
              {[0, 0.5, 1].map((f) => (
                <text key={f} className="axis" x={PAD.l - 8} y={y(max * f) + 4}>
                  {Math.round(max * f)}
                </text>
              ))}

              {target !== null && (
                <>
                  <line
                    className="target-line"
                    x1={PAD.l}
                    x2={W - PAD.r}
                    y1={y(target)}
                    y2={y(target)}
                  />
                  <text className="target-label" x={W - PAD.r} y={y(target) - 6}>
                    target {target}
                  </text>
                </>
              )}

              {points.map((p, i) =>
                i % tickEvery === 0 ? (
                  <text key={i} className="axis" x={x(i)} y={H - 8}>
                    {tickLabel(p.date, range)}
                  </text>
                ) : null,
              )}

              {keys.map((k) => (
                <path
                  key={k}
                  className="line"
                  d={path(k)}
                  stroke={SERIES[k].hue}
                />
              ))}

              {at !== null && (
                <line
                  className="crosshair"
                  x1={x(at)}
                  x2={x(at)}
                  y1={PAD.t}
                  y2={H - PAD.b}
                />
              )}
              {at !== null &&
                keys.map((k) => {
                  const v =
                    k === "calories"
                      ? points[at].eaten.calories
                      : points[at].eaten[k];
                  return (
                    <circle
                      key={k}
                      className="dot"
                      cx={x(at)}
                      cy={y(v)}
                      r={5}
                      fill={SERIES[k].hue}
                    />
                  );
                })}
            </svg>

            <figcaption className="chart-caption">
              {hovered ? (
                <>
                  <strong>
                    {hovered.date.toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </strong>
                  {keys.map((k) => (
                    <span key={k} className="chart-read">
                      <i style={{ background: SERIES[k].hue }} aria-hidden="true" />
                      {SERIES[k].label}{" "}
                      {k === "calories"
                        ? hovered.eaten.calories
                        : hovered.eaten[k]}
                      {SERIES[k].unit}
                    </span>
                  ))}
                  {mode === "calories" && hovered.burned > 0 && (
                    <span className="chart-read">burned {hovered.burned} kcal</span>
                  )}
                </>
              ) : (
                <span className="chart-hint">
                  Plan intake per day, plus anything you added by hand. Hover for a
                  reading.
                </span>
              )}
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}
