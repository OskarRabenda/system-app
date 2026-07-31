import { useEffect, useState } from "react";

function greetingFor(hour: number): string {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Live date and time, so the screen reads as current rather than a static menu. */
export default function ContextHeader() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Minute precision, so a 15s tick is enough to stay honest without churn.
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  const day = now.toLocaleDateString(undefined, { weekday: "long" });
  const date = now.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
  });
  const time = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header className="ctx" data-enter>
      <h1 className="ctx-greet">{greetingFor(now.getHours())}</h1>
      <p className="ctx-meta">
        <span>{day}</span>
        <span className="ctx-dot" aria-hidden="true" />
        <span>{date}</span>
        <span className="ctx-dot" aria-hidden="true" />
        <time dateTime={now.toISOString()}>{time}</time>
      </p>
    </header>
  );
}
