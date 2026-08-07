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

const DAY_CODES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The plan for a given date, falling back to the first day if unmatched. */
export function dayFor(date: Date): PlanDay {
  const code = DAY_CODES[date.getDay()];
  return PLAN.days.find((d) => d.code === code) ?? PLAN.days[0];
}
