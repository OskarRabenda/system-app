export type SectionId = "sleep" | "diet" | "tasks" | "workouts";

export type Section = {
  id: SectionId;
  name: string;
  emoji: string;
  blurb: string;
  /** Per-section hue. Used only on the glyph tile and top hairline. */
  accent: string;
};

export const SECTIONS: Section[] = [
  {
    id: "sleep",
    name: "Sleep",
    emoji: "🌙",
    blurb: "Quality, duration and recovery trends",
    accent: "#8b93ff",
  },
  {
    id: "diet",
    name: "Diet",
    emoji: "🥗",
    blurb: "Next meal, calories and macros",
    accent: "#58d68d",
  },
  {
    id: "tasks",
    name: "Tasks",
    emoji: "📋",
    blurb: "Your day, planned and tracked",
    accent: "#f5c15c",
  },
  {
    id: "workouts",
    name: "Workouts",
    emoji: "🏋️",
    blurb: "Sessions, volume and progression",
    accent: "#ff8b6b",
  },
];
