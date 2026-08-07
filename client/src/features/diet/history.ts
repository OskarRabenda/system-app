import {
  addMacros,
  loadBurned,
  loadExtras,
  totalExtras,
  type Macros,
} from "./data";
import { dayFor } from "./plan";

export type Range = "week" | "month" | "ytd";

export const RANGES: { id: Range; label: string; days: number | "ytd" }[] = [
  { id: "week", label: "Week", days: 7 },
  { id: "month", label: "Month", days: 30 },
  { id: "ytd", label: "YTD", days: "ytd" },
];

export type DayPoint = {
  date: Date;
  /** What the plan calls for that weekday. */
  planned: Macros;
  /** Planned plus anything logged by hand that day. */
  eaten: Macros;
  burned: number;
};

const dayCount = (range: Range, now: Date): number => {
  if (range === "week") return 7;
  if (range === "month") return 30;
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000) + 1;
};

/**
 * One point per day, oldest first, ending today.
 *
 * The plan repeats weekly, so what was *planned* is known for any date. What
 * was actually added by hand only exists for days the app has stored, so those
 * days simply show the plan alone rather than a gap.
 */
export function series(range: Range, now = new Date()): DayPoint[] {
  const n = dayCount(range, now);
  const out: DayPoint[] = [];

  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(12, 0, 0, 0); // midday, so DST shifts cannot roll the date

    const day = dayFor(date);
    const planned = day.total;
    const extras = totalExtras(loadExtras(date));
    out.push({
      date,
      planned,
      eaten: addMacros(planned, extras),
      burned: loadBurned(date),
    });
  }
  return out;
}

/** Compact axis label: "7 Aug" for short spans, "Aug" at month boundaries. */
export function tickLabel(date: Date, range: Range): string {
  if (range === "ytd") {
    return date.toLocaleDateString(undefined, { month: "short" });
  }
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
