import type { Macros } from "./data";
import { PLAN as EXAMPLE } from "./plan.example";

export type PlannedMeal = {
  /** Breakfast, Lunch, Afternoon, Dinner, Evening snack */
  slot: string;
  startMin: number;
  endMin: number;
  /** e.g. "around gym", "light" */
  note: string | null;
  /** Original name, then the English one. */
  pl: string;
  en: string;
  /** Hands-on time in minutes, where the plan states it. */
  minutes: number | null;
  servings: number;
  macros: Macros;
  fiber: number;
  sodium: number;
  link: string | null;
  /** Hero photo from the recipe page, resolved when the plan was generated. */
  image: string | null;
  recipe: Recipe | null;
};

/**
 * Read from the recipe page's structured data, verbatim — so the wording is
 * the original Polish. Meals with no recipe page (overnight oats, the evening
 * snacks) carry only the ingredients the plan itself lists, and no steps.
 */
export type Recipe = {
  name: string | null;
  yield: string | null;
  prepMin: number | null;
  totalMin: number | null;
  ingredients: string[];
  /**
   * Ingredients the plan deliberately leaves out — the oatmeal is taken
   * "no protein powder", which is why its macros are 78 kcal and 16 g of
   * protein below the published recipe. Listed so the method, which still
   * mentions them, is not confusing.
   */
  omitted: string[];
  steps: string[];
};

export type PlanDay = {
  /** Mon … Sun */
  code: string;
  full: string;
  total: Macros;
  fiber: number;
  sodium: number;
  meals: PlannedMeal[];
};

export type WeekPlan = {
  title: string;
  summary: string;
  average: Macros;
  /** The ranges exactly as written in the plan, for display. */
  targetLabels: Record<"calories" | "protein" | "carbs" | "fat" | "fiber", string>;
  /** Single numbers behind those ranges, for progress rings and bars. */
  target: Macros;
  days: PlanDay[];
};

/**
 * The real plan is personal data, so it lives in `plan.local.ts`, which is
 * git-ignored. This picks it up when present and falls back to the committed
 * example otherwise, so a fresh clone still builds and runs.
 */
const local = import.meta.glob<{ PLAN: WeekPlan }>("./plan.local.ts", {
  eager: true,
});

const loaded = Object.values(local)[0]?.PLAN;

export const PLAN: WeekPlan = loaded ?? EXAMPLE;
export const IS_REAL_PLAN = Boolean(loaded);

/**
 * Stand-in for meals with no recipe photo — the overnight oats and the
 * evening snacks. Matched on the dish text in both languages, so it keeps
 * working if the plan is regenerated, then falls back to the time of day.
 */
const ICON_RULES: [RegExp, string][] = [
  [/oats|owsianka|porridge/i, "🥣"],
  [/shake|koktajl|smoothie/i, "🥤"],
  // The dish rules come first: fruit words like "honey" and "apple" turn up
  // inside a sauce or a topping, and would otherwise claim the whole meal.
  [/salmon|cod|fish|tuna|łoso|ryba|tuńczyk/i, "🐟"],
  [/pork|beef|loin|schab|wołowin/i, "🥩"],
  [/penne|pasta|makaron|spaghetti/i, "🍝"],
  [/sandwich|kanapk|toast/i, "🥪"],
  [/egg|jajk|avocado|awokado/i, "🥑"],
  [/beetroot|barley|burak|kaszotto/i, "🥗"],
  [/rice cakes|banana|apple|honey|wafle|banan|jab/i, "🍌"],
];

const SLOT_ICONS: Record<string, string> = {
  Breakfast: "🥣",
  Lunch: "🍽️",
  Afternoon: "🥤",
  Dinner: "🍽️",
  "Evening snack": "🍎",
};

export function mealIcon(meal: PlannedMeal): string {
  const text = `${meal.en} ${meal.pl}`;
  for (const [pattern, icon] of ICON_RULES) {
    if (pattern.test(text)) return icon;
  }
  return SLOT_ICONS[meal.slot] ?? "🍽️";
}

/**
 * How many portions the recipe as written makes. It is not always one — the
 * pork loin and the beetroot barley both make three, the pastas two — so the
 * printed amounts are for that many people, not for one sitting.
 */
export function yieldPortions(recipe: Recipe | null): number {
  const n = recipe?.yield?.match(/(\d+(?:[.,]\d+)?)/);
  const value = n ? Number(n[1].replace(",", ".")) : 1;
  return value > 0 ? value : 1;
}

/**
 * What to multiply the printed ingredients by: the plan says how many portions
 * are eaten, the recipe says how many it makes.
 */
export function ingredientFactor(meal: PlannedMeal): number {
  return meal.servings / yieldPortions(meal.recipe);
}

/**
 * Shoppable amounts. Rounds to the nearest 5 g, except under 10 g where that
 * would distort a small quantity — 4 g of dill must not become 5 g while 3 g
 * of it rounds away to nothing.
 */
export function roundGrams(grams: number): number {
  if (grams >= 10) return Math.round(grams / 5) * 5;
  return Math.max(1, Math.round(grams));
}

/** "175 g łososia świeżego" scaled and rounded, name left untouched. */
export function scaleIngredient(text: string, factor: number): string {
  return text.replace(
    /^(\d+(?:[.,]\d+)?)\s*g\b/,
    (_whole, amount: string) =>
      `${roundGrams(Number(amount.replace(",", ".")) * factor)} g`,
  );
}

const DAY_CODES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The plan for a given date, falling back to the first day if unmatched. */
export function dayFor(date: Date): PlanDay {
  const code = DAY_CODES[date.getDay()];
  return PLAN.days.find((d) => d.code === code) ?? PLAN.days[0];
}
