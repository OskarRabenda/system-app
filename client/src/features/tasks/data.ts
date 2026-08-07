export type Priority = "low" | "medium" | "high";

export type Task = {
  id: string;
  title: string;
  /** ISO date (YYYY-MM-DD). Optional — not every task has a deadline. */
  deadline?: string;
  priority: Priority;
  done: boolean;
  createdAt: string;
};

export const PRIORITIES: { id: Priority; label: string; hue: string }[] = [
  { id: "low", label: "Low", hue: "#7fd3ff" },
  { id: "medium", label: "Medium", hue: "#f5c15c" },
  { id: "high", label: "High", hue: "#ff8b6b" },
];

export const priorityOf = (id: Priority) =>
  PRIORITIES.find((p) => p.id === id) ?? PRIORITIES[1];

const STORE_KEY = "system.tasks";

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Task[]) : [];
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

const RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

/** Open tasks first, then most urgent, then by deadline, then newest. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.priority !== b.priority) return RANK[a.priority] - RANK[b.priority];
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
