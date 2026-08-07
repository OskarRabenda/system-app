import GlassCard from "../../../components/ui/GlassCard";
import type { Macros } from "../data";

type Row = { key: keyof Macros; label: string; hue: string };

const ROWS: Row[] = [
  { key: "protein", label: "Protein", hue: "#7fd3ff" },
  { key: "carbs", label: "Carbs", hue: "#f5c15c" },
  { key: "fat", label: "Fat", hue: "#ff8b6b" },
];

export default function MacroBreakdown({
  consumed,
  target,
  onOpenTrend,
}: {
  consumed: Macros;
  target: Macros;
  onOpenTrend: () => void;
}) {
  const protPct =
    target.protein > 0
      ? Math.round((consumed.protein / target.protein) * 100)
      : 0;

  return (
    <GlassCard className="stat-card" accent="#7fd3ff">
      <p className="stat-label">
        Protein
        <span className="stat-tools">
          <button
            type="button"
            className="mini-btn"
            onClick={onOpenTrend}
            title="See the trend"
            aria-label="See the macro trend"
          >
            <svg viewBox="0 0 16 12" aria-hidden="true">
              <polyline points="1,10 5,6 8,8 15,2" />
            </svg>
          </button>
        </span>
      </p>

      <p className="macro-hero">
        <span className="macro-value">{consumed.protein}</span>
        <span className="macro-unit">/ {target.protein} g</span>
      </p>

      <div className="macro-rows">
        {ROWS.map((row) => {
          const have = consumed[row.key];
          const want = target[row.key];
          const pct = want > 0 ? Math.min((have / want) * 100, 100) : 0;
          return (
            <div className="macro-row" key={row.key}>
              <span className="macro-name">{row.label}</span>
              <span className="macro-bar">
                <span
                  className="macro-fill"
                  style={{ width: `${pct}%`, background: row.hue }}
                />
              </span>
              <span className="macro-num">
                {have}
                <em>/{want}g</em>
              </span>
            </div>
          );
        })}
      </div>

      <p className="stat-foot">
        <strong>{protPct}%</strong> of protein target
      </p>
    </GlassCard>
  );
}
