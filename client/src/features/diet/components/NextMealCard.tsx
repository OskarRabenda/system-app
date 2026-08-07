import GlassCard from "../../../components/ui/GlassCard";
import { formatAway, formatWindow, type CurrentMeal } from "../data";

export default function NextMealCard({ current }: { current: CurrentMeal }) {
  const { meal, status, minutesAway } = current;
  const eatingNow = status === "now";
  const plan = meal.planned;

  return (
    <GlassCard className="meal-card" accent="#58d68d">
      <div className="meal-head">
        <span className={`pill ${eatingNow ? "pill-now" : ""}`}>
          {eatingNow ? "Eating now" : "Up next"}
        </span>
        <span className="meal-window">{formatWindow(meal)}</span>
        {plan?.note && <span className="meal-note">{plan.note}</span>}
      </div>

      <h2 className="meal-name">{plan?.en || meal.name}</h2>
      {plan?.pl && <p className="meal-original">{plan.pl}</p>}

      <p className="meal-away">
        {eatingNow
          ? `${formatAway(minutesAway)} left in this window`
          : `starts in ${formatAway(minutesAway)}`}
        {plan?.minutes ? ` · ${plan.minutes} min to make` : ""}
        {plan && plan.servings !== 1 ? ` · ${plan.servings} servings` : ""}
      </p>

      {plan?.link && (
        <a
          className="recipe-btn"
          href={plan.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          Recipe <span aria-hidden="true">↗</span>
        </a>
      )}

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
