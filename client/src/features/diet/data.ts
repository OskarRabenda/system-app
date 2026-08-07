/**
 * Diet logic. The plan itself lives in `plan.ts`, which loads the real
 * spreadsheet-derived week when present and an example otherwise; everything
 * here is pure logic over that shape.
 */
import { dayFor, PLAN, type PlannedMeal } from "./plan";

export type Macros = {
  calories: number;
  protein: number; // grams
  carbs: number;
  fat: number;
};

export type Meal = {
  id: string;
  name: string;
  /** Minutes from midnight, local time. */
  startMin: number;
  endMin: number;
  items: string[];
  macros: Macros;
  /** The underlying plan entry — recipe name, link, prep time. */
  planned?: PlannedMeal;
};

export const DAILY_TARGET: Macros = PLAN.target;

/** Today's meals, taken from the weekly plan. */
export function mealsFor(date: Date): Meal[] {
  return dayFor(date).meals.map((m, i) => ({
    id: `${m.slot}-${i}`.toLowerCase().replace(/\s+/g, "-"),
    name: m.slot,
    startMin: m.startMin,
    endMin: m.endMin,
    items: [m.en || m.pl],
    macros: m.macros,
    planned: m,
  }));
}

export type MealStatus = "now" | "next" | "done";

export type CurrentMeal = {
  meal: Meal;
  status: MealStatus;
  /** Minutes until it starts (status "next"), or until it ends (status "now"). */
  minutesAway: number;
};

const minutesOf = (d: Date) => d.getHours() * 60 + d.getMinutes();

/**
 * The meal to show right now: the one whose window contains the current time,
 * otherwise the next one due. After the last meal, wraps to tomorrow's first.
 */
export function currentMeal(now: Date): CurrentMeal {
  const mins = minutesOf(now);
  const MEALS = mealsFor(now);

  const active = MEALS.find((m) => mins >= m.startMin && mins < m.endMin);
  if (active) {
    return { meal: active, status: "now", minutesAway: active.endMin - mins };
  }

  const upcoming = MEALS.find((m) => m.startMin > mins);
  if (upcoming) {
    return {
      meal: upcoming,
      status: "next",
      minutesAway: upcoming.startMin - mins,
    };
  }

  // Past the last meal — point at tomorrow's first.
  const first = MEALS[0];
  return {
    meal: first,
    status: "next",
    minutesAway: 24 * 60 - mins + first.startMin,
  };
}

/** Everything whose window has closed counts as eaten. */
export function consumedSoFar(now: Date): Macros {
  const mins = minutesOf(now);
  const MEALS = mealsFor(now);
  return MEALS.filter((m) => m.endMin <= mins).reduce<Macros>(
    (sum, m) => ({
      calories: sum.calories + m.macros.calories,
      protein: sum.protein + m.macros.protein,
      carbs: sum.carbs + m.macros.carbs,
      fat: sum.fat + m.macros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

/* ---------- extras: ad-hoc food added on top of the plan ---------- */

export type ExtraItem = {
  id: string;
  name: string;
  brand?: string;
  grams: number;
  /** Macros per 100 g; the eaten amount is derived from `grams`. */
  per100: Macros;
  addedAt: string;
  /**
   * Set for hand-entered items, where the macros given are the whole portion
   * rather than a per-100g figure. Stored as grams:100 so the arithmetic is
   * identical, with this label shown in place of a weight.
   */
  portion?: string;
};

export const EMPTY_MACROS: Macros = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
};

/** What this portion actually contributes. */
export function macrosOf(extra: ExtraItem): Macros {
  const k = extra.grams / 100;
  return {
    calories: Math.round(extra.per100.calories * k),
    protein: Math.round(extra.per100.protein * k),
    carbs: Math.round(extra.per100.carbs * k),
    fat: Math.round(extra.per100.fat * k),
  };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  };
}

export function totalExtras(extras: ExtraItem[]): Macros {
  return extras.reduce((sum, e) => addMacros(sum, macrosOf(e)), EMPTY_MACROS);
}

/* Both extras and supplements are per-day, so their keys roll over at midnight
   and yesterday's entries never leak into today. */
const dayStamp = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const dayKey = (d: Date) => `system.diet.extras.${dayStamp(d)}`;

export function loadExtras(day: Date): ExtraItem[] {
  try {
    const raw = localStorage.getItem(dayKey(day));
    return raw ? (JSON.parse(raw) as ExtraItem[]) : [];
  } catch {
    return [];
  }
}

export function saveExtras(day: Date, extras: ExtraItem[]): void {
  try {
    localStorage.setItem(dayKey(day), JSON.stringify(extras));
  } catch {
    // Storage unavailable (private mode, quota) — extras just won't persist.
  }
}

/* ---------- daily supplements ---------- */

export type Supplement = { id: string; name: string; detail: string };

/**
 * Order matters: the first three lay out as a row, and the last two sit
 * beneath, each straddling a gap in the row above (see `.supps` in the
 * stylesheet). Timing notes are general guidance for the vitamins; the
 * prescribed items just say so rather than inventing instructions.
 */
export const SUPPLEMENTS: Supplement[] = [
  { id: "vitamin-d", name: "Vitamin D", detail: "with a meal containing fat" },
  { id: "vitamin-c", name: "Vitamin C", detail: "any time of day" },
  { id: "vitamin-b12", name: "Vitamin B12", detail: "best on an empty stomach" },
  { id: "lotemax", name: "LoteMax", detail: "as prescribed" },
  { id: "epicare", name: "Epicare", detail: "as prescribed" },
];

const suppKey = (d: Date) => `system.diet.supplements.${dayStamp(d)}`;

/** Ids taken today. Absent ids are simply not taken yet. */
export function loadSupplements(day: Date): string[] {
  try {
    const raw = localStorage.getItem(suppKey(day));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveSupplements(day: Date, taken: string[]): void {
  try {
    localStorage.setItem(suppKey(day), JSON.stringify(taken));
  } catch {
    // Storage unavailable — the day's ticks just won't persist.
  }
}

/** Takes the times rather than a whole Meal, so plan entries can use it too. */
export function formatWindow(window: {
  startMin: number;
  endMin: number;
}): string {
  const fmt = (mins: number) =>
    `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  return `${fmt(window.startMin)} – ${fmt(window.endMin)}`;
}

export function formatAway(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
