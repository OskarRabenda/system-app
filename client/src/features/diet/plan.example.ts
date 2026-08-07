import type { WeekPlan } from "./plan";

/**
 * Placeholder plan, used when `plan.local.ts` is absent — the real one is
 * personal data and stays out of the repository. Same shape, generic food, so
 * a fresh clone runs with something sensible on screen.
 */
const DAY_NAMES: [string, string][] = [
  ["Mon", "Monday"],
  ["Tue", "Tuesday"],
  ["Wed", "Wednesday"],
  ["Thu", "Thursday"],
  ["Fri", "Friday"],
  ["Sat", "Saturday"],
  ["Sun", "Sunday"],
];

const TEMPLATE = [
  {
    slot: "Breakfast",
    startMin: 450,
    endMin: 510,
    note: null,
    pl: "Owsianka",
    en: "Oats with fruit and nut butter",
    minutes: 15,
    servings: 1,
    macros: { calories: 620, protein: 20, carbs: 90, fat: 22 },
    fiber: 10,
    sodium: 200,
    link: null,
  },
  {
    slot: "Lunch",
    startMin: 750,
    endMin: 810,
    note: null,
    pl: "Obiad",
    en: "Lean protein with grains and vegetables",
    minutes: 35,
    servings: 1,
    macros: { calories: 620, protein: 45, carbs: 70, fat: 15 },
    fiber: 12,
    sodium: 600,
    link: null,
  },
  {
    slot: "Afternoon",
    startMin: 960,
    endMin: 990,
    note: "around gym",
    pl: "Koktajl",
    en: "Protein shake",
    minutes: 5,
    servings: 1,
    macros: { calories: 420, protein: 32, carbs: 55, fat: 10 },
    fiber: 6,
    sodium: 120,
    link: null,
  },
  {
    slot: "Dinner",
    startMin: 1170,
    endMin: 1230,
    note: null,
    pl: "Kolacja",
    en: "Fish with potatoes and greens",
    minutes: 40,
    servings: 1,
    macros: { calories: 480, protein: 33, carbs: 50, fat: 16 },
    fiber: 7,
    sodium: 400,
    link: null,
  },
  {
    slot: "Evening snack",
    startMin: 1290,
    endMin: 1350,
    note: "light",
    pl: "Przekąska",
    en: "Fruit and rice cakes",
    minutes: null,
    servings: 1,
    macros: { calories: 360, protein: 5, carbs: 85, fat: 2 },
    fiber: 8,
    sodium: 40,
    link: null,
  },
];

export const PLAN: WeekPlan = {
  title: "Example plan",
  summary:
    "Placeholder week. Drop your own plan in plan.local.ts to replace it.",
  average: { calories: 2500, protein: 135, carbs: 350, fat: 65 },
  targetLabels: {
    calories: "2400–2600",
    protein: "≥117",
    carbs: "~300–320",
    fat: "60–75",
    fiber: "≥30",
  },
  target: { calories: 2500, protein: 117, carbs: 310, fat: 68 },
  days: DAY_NAMES.map(([code, full]) => ({
    code,
    full,
    total: { calories: 2500, protein: 135, carbs: 350, fat: 65 },
    fiber: 43,
    sodium: 1360,
    meals: TEMPLATE,
  })),
};
