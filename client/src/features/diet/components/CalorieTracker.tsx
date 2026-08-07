import { useState } from "react";
import GlassCard from "../../../components/ui/GlassCard";

const RADIUS = 52;
const CIRC = 2 * Math.PI * RADIUS;

type Props = {
  consumed: number;
  target: number;
  burned: number;
  onBurnedChange: (value: number) => void;
  onOpenTrend: () => void;
};

export default function CalorieTracker({
  consumed,
  target,
  burned,
  onBurnedChange,
  onOpenTrend,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  // Exercise widens the day's allowance rather than deleting what was eaten.
  const allowance = target + burned;
  const pct = allowance > 0 ? Math.min(consumed / allowance, 1) : 0;
  const remaining = Math.max(allowance - consumed, 0);

  const commit = () => {
    const n = Number(draft.replace(",", "."));
    onBurnedChange(Number.isFinite(n) && n > 0 ? Math.round(n) : 0);
    setEditing(false);
    setDraft("");
  };

  return (
    <GlassCard className="stat-card" accent="#ffb26b">
      <p className="stat-label">
        Calories
        <span className="stat-tools">
          <button
            type="button"
            className="mini-btn"
            onClick={() => {
              setDraft(burned ? String(burned) : "");
              setEditing((v) => !v);
            }}
            title="Calories burned"
            aria-label="Log calories burned"
          >
            ⚡
          </button>
          <button
            type="button"
            className="mini-btn"
            onClick={onOpenTrend}
            title="See the trend"
            aria-label="See the calorie trend"
          >
            <svg viewBox="0 0 16 12" aria-hidden="true">
              <polyline points="1,10 5,6 8,8 15,2" />
            </svg>
          </button>
        </span>
      </p>

      {editing && (
        <div className="burn-row">
          <label className="burn-field">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={draft}
              placeholder="kcal burned"
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") setEditing(false);
              }}
            />
          </label>
          <button type="button" className="add-btn" onClick={commit}>
            Save
          </button>
        </div>
      )}

      <div className="ring-wrap">
        <svg
          className="ring"
          viewBox="0 0 128 128"
          role="img"
          aria-label={`${consumed} of ${allowance} kcal`}
        >
          <circle className="ring-track" cx="64" cy="64" r={RADIUS} />
          <circle
            className="ring-fill"
            cx="64"
            cy="64"
            r={RADIUS}
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - pct)}
          />
        </svg>
        <div className="ring-centre">
          <span className="ring-value">{consumed}</span>
          <span className="ring-unit">of {allowance}</span>
        </div>
      </div>

      <p className="stat-foot">
        <strong>{remaining}</strong> kcal remaining
        {burned > 0 && (
          <span className="burn-chip">
            <span aria-hidden="true">⚡</span> {burned} burned
          </span>
        )}
      </p>
    </GlassCard>
  );
}
