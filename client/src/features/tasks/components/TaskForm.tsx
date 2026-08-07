import { useState, type FormEvent } from "react";
import GlassCard from "../../../components/ui/GlassCard";
import { bandOf, parsePriority, type Priority } from "../data";

export type NewTask = {
  title: string;
  deadline?: string;
  priority: Priority;
};

type Props = {
  onSubmit: (task: NewTask) => void;
  onCancel: () => void;
};

export default function TaskForm({ onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("");

  const parsed = parsePriority(priority);
  const text = priority.trim().replace(",", ".");
  // "0." and "-" are on the way to a valid number; flagging them mid-keystroke
  // would flash an error at someone who is typing correctly. A bare "0" is
  // NOT mid-typing — it is a complete entry, and an invalid one.
  const midType = text === "-" || /^-?\d*\.$/.test(text);
  const showError = text !== "" && !midType && !parsed.ok;
  const canSave = title.trim().length > 0 && parsed.ok;
  const band = parsed.ok ? bandOf(parsed.value) : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSave || !parsed.ok) return;
    onSubmit({
      title: title.trim(),
      deadline: deadline || undefined,
      priority: parsed.value,
    });
  };

  return (
    <GlassCard className="task-form-card" accent={band?.hue}>
      <form className="manual" onSubmit={submit} noValidate>
        <label className="field">
          <span>Task</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs doing?"
            autoFocus
          />
        </label>

        <div className="task-form-row">
          <label className="field">
            <span>Deadline</span>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Priority</span>
            <input
              className={showError ? "is-invalid" : ""}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              placeholder="0 – 1, e.g. 0.8"
              inputMode="decimal"
              aria-invalid={showError}
              aria-describedby="priority-note"
            />
            <span
              id="priority-note"
              className={`field-note ${showError ? "is-error" : ""}`}
              role={showError ? "alert" : undefined}
            >
              {showError
                ? parsed.error
                : band
                  ? `${band.label} priority`
                  : "Greater than 0, up to 1"}
            </span>
          </label>
        </div>

        <div className="manual-actions">
          <button type="button" className="ghost-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="add-btn" disabled={!canSave}>
            Add task
          </button>
        </div>
      </form>
    </GlassCard>
  );
}
