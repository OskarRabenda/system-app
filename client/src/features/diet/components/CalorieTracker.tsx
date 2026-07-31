import GlassCard from "../../../components/ui/GlassCard";

const RADIUS = 52;
const CIRC = 2 * Math.PI * RADIUS;

export default function CalorieTracker({
  consumed,
  target,
}: {
  consumed: number;
  target: number;
}) {
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const remaining = Math.max(target - consumed, 0);

  return (
    <GlassCard className="stat-card" accent="#ffb26b">
      <p className="stat-label">Calories</p>

      <div className="ring-wrap">
        <svg className="ring" viewBox="0 0 128 128" role="img" aria-label={`${consumed} of ${target} kcal`}>
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
          <span className="ring-unit">of {target}</span>
        </div>
      </div>

      <p className="stat-foot">
        <strong>{remaining}</strong> kcal remaining
      </p>
    </GlassCard>
  );
}
