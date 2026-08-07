/** Weight in the half-open range (0, 1] — 1 is the most urgent. */
export type Priority = number;

export type Task = {
  id: string;
  title: string;
  /** Free text. Optional — a title is often enough. */
  description?: string;
  /** ISO date (YYYY-MM-DD). Optional — not every task has a deadline. */
  deadline?: string;
  priority: Priority;
  done: boolean;
  createdAt: string;
};

/** Local calendar date as YYYY-MM-DD — not toISOString(), which is UTC and
 *  can land on yesterday for anyone east of Greenwich. */
export function todayISO(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Null when acceptable; otherwise the reason it is not. */
export function validateDeadline(
  iso: string,
  now = new Date(),
): string | null {
  if (!iso) return null; // a deadline is optional
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "Not a valid date";
  if (iso < todayISO(now)) return "Deadline cannot be before today";
  return null;
}

export type PriorityBand = { label: string; hue: string };

/** Bands only drive colour and a scannable word; the stored value is the number. */
export function bandOf(priority: Priority): PriorityBand {
  if (priority >= 0.67) return { label: "High", hue: "#ff8b6b" };
  if (priority >= 0.34) return { label: "Medium", hue: "#f5c15c" };
  return { label: "Low", hue: "#7fd3ff" };
}

/** 0.9 -> "0.9", 0.75 -> "0.75", 1 -> "1" */
export const formatPriority = (p: Priority) =>
  String(Math.round(p * 100) / 100);

export type ParseResult =
  | { ok: true; value: Priority }
  | { ok: false; error: string };

/**
 * Parses the priority field. Kept here rather than in the form so the rule has
 * one home — the range is half-open, so 0 is rejected but 1 is allowed.
 */
export function parsePriority(raw: string): ParseResult {
  const text = raw.trim().replace(",", "."); // comma decimals are normal here
  if (text === "") return { ok: false, error: "Enter a priority" };

  // Number() would accept "0x1", "1e-3" and whitespace-only strings. The
  // leading minus is allowed through so a negative reads as out-of-range
  // rather than as gibberish — it is a number, just the wrong one.
  if (!/^-?\d*\.?\d+$/.test(text))
    return { ok: false, error: "Not a number" };

  const value = Number(text);
  if (!Number.isFinite(value)) return { ok: false, error: "Not a number" };
  if (value <= 0 || value > 1)
    return { ok: false, error: "Priority must be in the range (0, 1]" };

  return { ok: true, value };
}

/** Weights for tasks saved before priority became numeric. */
const LEGACY: Record<string, number> = { low: 0.25, medium: 0.6, high: 0.9 };

const STORE_KEY = "system.tasks";

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Task[];
    // Migrate "low"/"medium"/"high" from before priority was a number.
    return parsed.map((t) => ({
      ...t,
      priority:
        typeof t.priority === "number"
          ? t.priority
          : (LEGACY[String(t.priority)] ?? 0.6),
    }));
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(tasks));
  } catch {
    // Storage unavailable (private mode, quota) — tasks just won't persist.
  }
}

/** Open tasks first, then most urgent, then by deadline, then newest. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.priority !== b.priority) return b.priority - a.priority;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/** Midnight-aligned day difference, so "tomorrow" does not depend on the hour. */
function daysUntil(iso: string, now: Date): number {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, (m ?? 1) - 1, d ?? 1).setHours(0, 0, 0, 0);
  const today = new Date(now).setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86_400_000);
}

export type DeadlineInfo = { label: string; overdue: boolean; soon: boolean };

export function describeDeadline(iso: string, now = new Date()): DeadlineInfo {
  const days = daysUntil(iso, now);
  if (days < 0) {
    const n = Math.abs(days);
    return {
      label: n === 1 ? "1 day overdue" : `${n} days overdue`,
      overdue: true,
      soon: false,
    };
  }
  if (days === 0) return { label: "Due today", overdue: false, soon: true };
  if (days === 1) return { label: "Due tomorrow", overdue: false, soon: true };
  if (days < 7)
    return { label: `Due in ${days} days`, overdue: false, soon: true };

  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return {
    label: `Due ${date.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`,
    overdue: false,
    soon: false,
  };
}
