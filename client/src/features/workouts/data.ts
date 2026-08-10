export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  /** Load, rest or tempo — whatever the routine specifies. */
  detail?: string;
};

export type WorkoutSet = {
  id: string;
  name: string;
  focus: string;
  exercises: Exercise[];
};

/**
 * Placeholder routine, in the same spirit as the diet plan before the
 * spreadsheet arrived: the shape is real so the screen works, the contents are
 * a stand-in. Swap this for the actual programme and nothing else changes.
 */
export const WORKOUT_SETS: WorkoutSet[] = [
  {
    id: "push",
    name: "Push",
    focus: "Chest · shoulders · triceps",
    exercises: [
      { id: "bench", name: "Bench press", sets: 4, reps: "6–8", detail: "2 min rest" },
      { id: "ohp", name: "Overhead press", sets: 3, reps: "8–10", detail: "90 s rest" },
      { id: "incline", name: "Incline dumbbell press", sets: 3, reps: "10–12" },
      { id: "lateral", name: "Lateral raise", sets: 3, reps: "12–15" },
      { id: "pushdown", name: "Triceps pushdown", sets: 3, reps: "12–15" },
    ],
  },
  {
    id: "pull",
    name: "Pull",
    focus: "Back · biceps",
    exercises: [
      { id: "deadlift", name: "Deadlift", sets: 3, reps: "5", detail: "3 min rest" },
      { id: "pullup", name: "Pull-up", sets: 4, reps: "to failure" },
      { id: "row", name: "Barbell row", sets: 3, reps: "8–10" },
      { id: "facepull", name: "Face pull", sets: 3, reps: "15" },
      { id: "curl", name: "Biceps curl", sets: 3, reps: "10–12" },
    ],
  },
  {
    id: "legs",
    name: "Legs",
    focus: "Quads · hamstrings · calves",
    exercises: [
      { id: "squat", name: "Back squat", sets: 4, reps: "6–8", detail: "2 min rest" },
      { id: "rdl", name: "Romanian deadlift", sets: 3, reps: "8–10" },
      { id: "split", name: "Bulgarian split squat", sets: 3, reps: "10 each" },
      { id: "legcurl", name: "Leg curl", sets: 3, reps: "12" },
      { id: "calf", name: "Calf raise", sets: 4, reps: "15" },
    ],
  },
];

/** Total working sets, which is the honest measure of how long it will take. */
export function totalSets(set: WorkoutSet): number {
  return set.exercises.reduce((n, e) => n + e.sets, 0);
}

/** mm:ss, or h:mm:ss once it runs past an hour. */
export function formatElapsed(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}
