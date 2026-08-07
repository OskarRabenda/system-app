import { useEffect, useMemo, useState } from "react";
import NextMealCard from "./components/NextMealCard";
import CalorieTracker from "./components/CalorieTracker";
import MacroBreakdown from "./components/MacroBreakdown";
import ExtrasCard from "./components/ExtrasCard";
import SupplementsCard from "./components/SupplementsCard";
import AddFoodPanel from "./components/AddFoodPanel";
import PlanCalendar from "./components/PlanCalendar";
import RecipeSheet from "./components/RecipeSheet";
import TrendSheet from "./components/TrendSheet";
import { dayFor, type PlannedMeal } from "./plan";
import Atmosphere from "../../components/Atmosphere";
import {
  addMacros,
  consumedSoFar,
  currentMeal,
  DAILY_TARGET,
  loadExtras,
  saveExtras,
  loadSupplements,
  saveSupplements,
  loadBurned,
  saveBurned,
  totalExtras,
  type ExtraItem,
} from "./data";
import type { FoodHit } from "./foodSearch";
import type { ManualEntry } from "./components/ManualFoodForm";
import type { Origin } from "../../components/WaveReveal";

type Props = {
  onBack?: (origin: Origin) => void;
};

export default function DietPage({ onBack }: Props) {
  const [now, setNow] = useState(() => new Date());
  const [extras, setExtras] = useState<ExtraItem[]>(() => loadExtras(new Date()));
  const [taken, setTaken] = useState<string[]>(() => loadSupplements(new Date()));
  const [adding, setAdding] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [recipeOf, setRecipeOf] = useState<PlannedMeal | null>(null);
  const [trend, setTrend] = useState<"calories" | "macros" | null>(null);
  const [burned, setBurned] = useState(() => loadBurned(new Date()));

  // Which meal is current depends on the clock, so keep it honest.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    saveExtras(now, extras);
    // `now` only matters for the day it falls in; re-saving on each tick is
    // cheap and keeps the stored day correct across midnight.
  }, [extras, now]);

  useEffect(() => {
    saveSupplements(now, taken);
  }, [taken, now]);

  useEffect(() => {
    saveBurned(now, burned);
  }, [burned, now]);

  const current = currentMeal(now);

  // Planned meals eaten so far, plus anything added by hand.
  const consumed = useMemo(
    () => addMacros(consumedSoFar(now), totalExtras(extras)),
    [now, extras],
  );

  const handleAdd = (hit: FoodHit, grams: number) => {
    setExtras((list) => [
      ...list,
      {
        id: `${hit.id}-${Date.now()}`,
        name: hit.name,
        brand: hit.brand,
        grams,
        per100: hit.per100,
        addedAt: new Date().toISOString(),
      },
    ]);
    setAdding(false);
  };

  // Hand-entered macros describe the whole portion, so storing them as a
  // 100g basis with grams:100 makes the arithmetic identical to a search hit.
  const handleAddManual = (entry: ManualEntry) => {
    setExtras((list) => [
      ...list,
      {
        id: `manual-${Date.now()}`,
        name: entry.name,
        grams: 100,
        per100: entry.macros,
        portion: entry.portion,
        addedAt: new Date().toISOString(),
      },
    ]);
    setAdding(false);
  };

  const stamp = `${now.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  })} · ${now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <main className="screen diet">
      <Atmosphere />

      <header className="screen-head">
        <button
          type="button"
          className="back"
          onClick={(e) => onBack?.({ x: e.clientX, y: e.clientY })}
        >
          <span aria-hidden="true">←</span> Dashboard
        </button>
        <div className="screen-title">
          <span className="screen-emoji" aria-hidden="true">
            🥗
          </span>
          <h1>Diet</h1>
          <button
            type="button"
            className="add-food"
            onClick={() => setAdding(true)}
          >
            <span aria-hidden="true">＋</span> Add food
          </button>
          <button
            type="button"
            className="plan-btn"
            onClick={() => setPlanOpen(true)}
            title="See the whole week"
            aria-label="See the whole week"
          >
            <span aria-hidden="true">🗓</span>
          </button>
        </div>
        <p className="screen-stamp">{stamp}</p>
      </header>

      <div className="diet-grid">
        <NextMealCard
          current={current}
          onOpenRecipe={() =>
            current.meal.planned && setRecipeOf(current.meal.planned)
          }
        />
        <CalorieTracker
          consumed={consumed.calories}
          target={DAILY_TARGET.calories}
          burned={burned}
          onBurnedChange={setBurned}
          onOpenTrend={() => setTrend("calories")}
        />
        <MacroBreakdown
          consumed={consumed}
          target={DAILY_TARGET}
          onOpenTrend={() => setTrend("macros")}
        />
        <SupplementsCard
          taken={taken}
          onToggle={(id) =>
            setTaken((list) =>
              list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
            )
          }
        />
        {extras.length > 0 && (
          <ExtrasCard
            extras={extras}
            onRemove={(id) =>
              setExtras((list) => list.filter((e) => e.id !== id))
            }
          />
        )}
      </div>

      {planOpen && (
        <PlanCalendar
          initialDay={dayFor(now).code}
          onClose={() => setPlanOpen(false)}
          onOpenRecipe={(meal) => setRecipeOf(meal)}
        />
      )}

      {trend && <TrendSheet mode={trend} onClose={() => setTrend(null)} />}

      {recipeOf && (
        <RecipeSheet meal={recipeOf} onClose={() => setRecipeOf(null)} />
      )}

      {adding && (
        <AddFoodPanel
          onAdd={handleAdd}
          onAddManual={handleAddManual}
          onClose={() => setAdding(false)}
        />
      )}
    </main>
  );
}
