import GlassCard from "../../../components/ui/GlassCard";
import { macrosOf, totalExtras, type ExtraItem } from "../data";

type Props = {
  extras: ExtraItem[];
  onRemove: (id: string) => void;
};

export default function ExtrasCard({ extras, onRemove }: Props) {
  const total = totalExtras(extras);

  return (
    <GlassCard className="extras-card" accent="#c9a7ff">
      <p className="stat-label">Added today</p>

      <ul className="extras">
        {extras.map((extra) => {
          const m = macrosOf(extra);
          return (
            <li key={extra.id} className="extra">
              <div className="extra-main">
                <span className="extra-name">{extra.name}</span>
                <span className="extra-sub">
                  {extra.brand ? `${extra.brand} · ` : ""}
                  {extra.portion ?? `${extra.grams}g`}
                </span>
              </div>
              <span className="extra-macros">
                {m.calories} kcal · {m.protein}g P
              </span>
              <button
                type="button"
                className="icon-btn"
                onClick={() => onRemove(extra.id)}
                aria-label={`Remove ${extra.name}`}
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>

      <p className="stat-foot">
        <strong>+{total.calories}</strong> kcal · <strong>+{total.protein}g</strong>{" "}
        protein on top of the plan
      </p>
    </GlassCard>
  );
}
