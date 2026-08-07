import GlassCard from "../../../components/ui/GlassCard";
import { SUPPLEMENTS } from "../data";

type Props = {
  /** Ids ticked off today. */
  taken: string[];
  onToggle: (id: string) => void;
};

export default function SupplementsCard({ taken, onToggle }: Props) {
  const done = SUPPLEMENTS.filter((s) => taken.includes(s.id)).length;
  const all = done === SUPPLEMENTS.length;

  return (
    <GlassCard className="supp-card" accent="#c9a7ff">
      <p className="stat-label">Daily checklist</p>

      <ul className="supps">
        {SUPPLEMENTS.map((s) => {
          const isTaken = taken.includes(s.id);
          return (
            <li key={s.id} className={`supp ${isTaken ? "is-taken" : ""}`}>
              <label className="supp-label">
                <input
                  type="checkbox"
                  className="check"
                  checked={isTaken}
                  onChange={() => onToggle(s.id)}
                />
                <span className="supp-body">
                  <span className="supp-name">{s.name}</span>
                  <span className="supp-detail">{s.detail}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <p className="stat-foot">
        {all ? (
          <strong>All taken today</strong>
        ) : (
          <>
            <strong>
              {done} of {SUPPLEMENTS.length}
            </strong>{" "}
            taken today
          </>
        )}
      </p>
    </GlassCard>
  );
}
