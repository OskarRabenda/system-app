import GlassCard from "../../../components/ui/GlassCard";
import { formatAway, formatWindow, type CurrentMeal } from "../data";
import { mealIcon } from "../plan";

export default function NextMealCard({
  current,
  onOpenRecipe,
}: {
  current: CurrentMeal;
  onOpenRecipe?: () => void;
}) {
  const { meal, status, minutesAway } = current;
  const eatingNow = status === "now";
  const plan = meal.planned;

  return (
    <GlassCard className="meal-card" accent="#58d68d">
      <div className="meal-layout">
        <div className="meal-text">
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

      {plan && (
        <button type="button" className="recipe-btn" onClick={onOpenRecipe}>
          {plan.recipe?.steps.length ? "Recipe" : "What's in it"}
        </button>
      )}

        </div>

        {plan &&
          (plan.image ? (
            <figure className="meal-photo">
              <img
                src={plan.image}
                alt={plan.en || plan.pl}
                loading="lazy"
                // A missing file should fall back to the icon, not a broken image.
                onError={(e) => {
                  const figure = e.currentTarget.closest("figure");
                  if (figure) {
                    figure.classList.add("is-icon");
                    figure.textContent = mealIcon(plan);
                  }
                }}
              />
            </figure>
          ) : (
            <figure className="meal-photo is-icon" aria-hidden="true">
              {mealIcon(plan)}
            </figure>
          ))}
      </div>

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
