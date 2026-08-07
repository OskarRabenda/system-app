import { useState, type FormEvent } from "react";
import GlassCard from "../../../components/ui/GlassCard";
import { PRIORITIES, type Priority } from "../data";

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
  const [priority, setPriority] = useState<Priority>("medium");

  const canSave = title.trim().length > 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSubmit({
      title: title.trim(),
      deadline: deadline || undefined,
      priority,
    });
  };

  return (
    <GlassCard className="task-form-card" accent={PRIORITIES.find((p) => p.id === priority)?.hue}>
      <form className="manual" onSubmit={submit}>
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

          <fieldset className="field priority-field">
            <legend>Priority</legend>
            <div className="priority-picker">
              {PRIORITIES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`priority-chip ${priority === p.id ? "is-on" : ""}`}
                  style={{ ["--hue" as string]: p.hue }}
                  aria-pressed={priority === p.id}
                  onClick={() => setPriority(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </fieldset>
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
