import GlassCard from "../../../components/ui/GlassCard";
import {
  formatAway,
  formatWindow,
  type CurrentMeal,
} from "../data";

export default function NextMealCard({ current }: { current: CurrentMeal }) {
  const { meal, status, minutesAway } = current;
  const eatingNow = status === "now";

  return (
    <GlassCard className="meal-card" accent="#58d68d">
      <div className="meal-head">
        <span className={`pill ${eatingNow ? "pill-now" : ""}`}>
          {eatingNow ? "Eating now" : "Up next"}
        </span>
        <span className="meal-window">{formatWindow(meal)}</span>
      </div>

      <h2 className="meal-name">{meal.name}</h2>
      <p className="meal-away">
        {eatingNow
          ? `${formatAway(minutesAway)} left in this window`
          : `starts in ${formatAway(minutesAway)}`}
      </p>

      <ul className="meal-items">
        {meal.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <dl className="meal-macros">
        <div>
          <dt>kcal</dt>
          <dd>{meal.macros.calories}</dd>
        </div>
        <div>
          <dt>protein</dt>
          <dd>{meal.macros.protein}g</dd>
        </div>
        <div>
          <dt>carbs</dt>
          <dd>{meal.macros.carbs}g</dd>
        </div>
        <div>
          <dt>fat</dt>
          <dd>{meal.macros.fat}g</dd>
        </div>
      </dl>
    </GlassCard>
  );
}
