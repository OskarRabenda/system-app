import type { CSSProperties, ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Optional hue for the card's edge light and glow. */
  accent?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Frosted panel. Relies on `backdrop-filter`, so it needs something behind it
 * to refract — see Atmosphere.
 */
export default function GlassCard({
  children,
  accent,
  className = "",
  style,
}: Props) {
  return (
    <section
      className={`glass ${className}`}
      style={{ ...(accent ? { "--accent": accent } : {}), ...style } as CSSProperties}
    >
      <span className="glass-sheen" aria-hidden="true" />
      <div className="glass-body">{children}</div>
    </section>
  );
}
