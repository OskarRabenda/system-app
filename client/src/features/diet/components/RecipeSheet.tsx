import { useEffect } from "react";
import { mealIcon, type PlannedMeal } from "../plan";
import { formatWindow } from "../data";

type Props = {
  meal: PlannedMeal;
  onClose: () => void;
};

export default function RecipeSheet({ meal, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const r = meal.recipe;
  const hasSteps = !!r?.steps.length;

  return (
    <div className="sheet-backdrop" onPointerDown={onClose}>
      <div
        className="sheet recipe-sheet glass"
        role="dialog"
        aria-modal="true"
        aria-label={meal.en || meal.pl}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="glass-sheen" aria-hidden="true" />
        <div className="sheet-body">
          <header className="sheet-head">
            <div className="recipe-heading">
              <p className="eyebrow">
                {meal.slot} · {formatWindow(meal)}
              </p>
              <h2>{meal.en || meal.pl}</h2>
              {meal.en && meal.pl && (
                <p className="recipe-original">{meal.pl}</p>
              )}
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

          <div className="recipe-top">
            {meal.image ? (
              <img className="recipe-photo" src={meal.image} alt="" />
            ) : (
              <span className="recipe-photo is-icon" aria-hidden="true">
                {mealIcon(meal)}
              </span>
            )}

            <dl className="recipe-facts">
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
              {r?.totalMin && (
                <div>
                  <dt>time</dt>
                  <dd>{r.totalMin} min</dd>
                </div>
              )}
              {meal.servings !== 1 && (
                <div>
                  <dt>servings</dt>
                  <dd>{meal.servings}</dd>
                </div>
              )}
            </dl>
          </div>

          {r?.ingredients.length ? (
            <section className="recipe-block">
              <h3>
                Ingredients
                {r.yield && <span className="recipe-yield">{r.yield}</span>}
              </h3>
              <ul className="ingredients">
                {r.ingredients.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {hasSteps ? (
            <section className="recipe-block">
              <h3>Method</h3>
              <ol className="steps">
                {r!.steps.map((step, i) => (
                  <li key={i}>
                    <span className="step-no">{i + 1}</span>
                    <span className="step-text">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : (
            <p className="sheet-hint">
              No method — this one is just assembled from the items above.
            </p>
          )}

          {meal.link && (
            <a
              className="recipe-btn"
              href={meal.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open the original <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
