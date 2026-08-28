import { useState, type FormEvent } from "react";
import GlassCard from "../../../components/ui/GlassCard";
import {
  bandOf,
  DEFAULT_PRIORITY,
  parsePriority,
  todayISO,
  validateDeadline,
  type Priority,
} from "../data";

export type NewTask = {
  title: string;
  description?: string;
  deadline?: string;
  priority: Priority;
};

type Props = {
  onSubmit: (task: NewTask) => void;
  onCancel: () => void;
};

export default function TaskForm({ onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("");

  const parsed = parsePriority(priority);
  const text = priority.trim().replace(",", ".");
  // "0." and "-" are on the way to a valid number; flagging them mid-keystroke
  // would flash an error at someone who is typing correctly. A bare "0" is
  // NOT mid-typing — it is a complete entry, and an invalid one.
  const midType = text === "-" || /^-?\d*\.$/.test(text);
  const showError = text !== "" && !midType && !parsed.ok;
  const band = parsed.ok ? bandOf(parsed.value) : null;

  const deadlineError = validateDeadline(deadline);
  /* A name is the only thing actually required. Priority and deadline are
     blocking only when they have been filled in wrongly — leaving them empty
     is a normal way to jot something down. */
  const canSave =
    title.trim().length > 0 && !deadlineError && (text === "" || parsed.ok);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: deadline || undefined,
      priority: parsed.ok ? parsed.value : DEFAULT_PRIORITY,
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

        <label className="field">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Any detail worth remembering (optional)"
            rows={2}
          />
        </label>

        <div className="task-form-row">
          <label className="field">
            <span>Deadline</span>
            <input
              type="date"
              className={deadlineError ? "is-invalid" : ""}
              value={deadline}
              // Blocks past dates in the picker itself; validateDeadline still
              // runs, since the field can be typed into directly.
              min={todayISO()}
              onChange={(e) => setDeadline(e.target.value)}
              aria-invalid={!!deadlineError}
              aria-describedby="deadline-note"
            />
            <span
              id="deadline-note"
              className={`field-note ${deadlineError ? "is-error" : ""}`}
              role={deadlineError ? "alert" : undefined}
            >
              {deadlineError ?? "Today or later (optional)"}
            </span>
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
                  : "0 to 1 (optional)"}
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
