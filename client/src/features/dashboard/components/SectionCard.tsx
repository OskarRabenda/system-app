import type { CSSProperties } from "react";
import type { Section } from "../sections";

type Props = {
  section: Section;
  /** Receives the click point so the next screen can reveal from it. */
  onSelect: (section: Section, origin: { x: number; y: number }) => void;
  /** Fired with the section on enter and null on leave, to tint the page. */
  onHover: (section: Section | null) => void;
};

export default function SectionCard({ section, onSelect, onHover }: Props) {
  return (
    <button
      type="button"
      className="card"
      data-enter
      style={{ "--accent": section.accent } as CSSProperties}
      onClick={(e) => onSelect(section, { x: e.clientX, y: e.clientY })}
      onPointerEnter={() => onHover(section)}
      onPointerLeave={() => onHover(null)}
      onFocus={() => onHover(section)}
      onBlur={() => onHover(null)}
    >
      <span className="card-rule" aria-hidden="true" />
      <span className="card-emoji" aria-hidden="true">
        {section.emoji}
      </span>
      <span className="card-body">
        <span className="card-name">{section.name}</span>
        <span className="card-blurb">{section.blurb}</span>
      </span>
      <span className="card-arrow" aria-hidden="true">
        →
      </span>
    </button>
  );
}
