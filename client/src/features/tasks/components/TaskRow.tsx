import type { CSSProperties } from "react";
import { bandOf, describeDeadline, formatPriority, type Task } from "../data";

type Props = {
  task: Task;
  /** "history" swaps the checkbox for a restore control. */
  variant?: "active" | "history";
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onEdit?: (task: Task) => void;
};

export default function TaskRow({
  task,
  variant = "active",
  onToggle,
  onRemove,
  onEdit,
}: Props) {
  const band = bandOf(task.priority);
  const due = task.deadline ? describeDeadline(task.deadline) : null;
  const history = variant === "history";

  const finished = task.completedAt
    ? new Date(task.completedAt).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <li
      className={`task ${task.done ? "is-done" : ""}`}
      style={{ "--accent": band.hue } as CSSProperties}
    >
      {history ? (
        <button
          type="button"
          className="task-restore"
          onClick={() => onToggle(task.id)}
          title="Restore to tasks"
          aria-label={`Restore ${task.title}`}
        >
          <span aria-hidden="true">↩</span>
        </button>
      ) : (
        <button
          type="button"
          className="task-check"
          role="checkbox"
          aria-checked={task.done}
          aria-label={`Mark ${task.title} as done`}
          onClick={() => onToggle(task.id)}
        />
      )}

      <div className="task-main">
        <span className="task-title">{task.title}</span>
        {task.description && (
          <span className="task-desc">{task.description}</span>
        )}
        <span className="task-meta">
          <span className="task-priority" title={`${band.label} priority`}>
            {formatPriority(task.priority)}
          </span>
          {history && finished && (
            <>
              <span className="task-sep" aria-hidden="true">
                ·
              </span>
              <span>done {finished}</span>
            </>
          )}
          {!history && due && (
            <>
              <span className="task-sep" aria-hidden="true">
                ·
              </span>
              <span
                className={
                  due.overdue
                    ? "task-due is-overdue"
                    : due.soon
                      ? "task-due is-soon"
                      : "task-due"
                }
              >
                {due.label}
              </span>
            </>
          )}
        </span>
      </div>

      <span className="task-actions">
        {!history && onEdit && (
          <button
            type="button"
            className="icon-btn"
            onClick={() => onEdit(task)}
            title="Edit"
            aria-label={`Edit ${task.title}`}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="edit-icon">
              <path d="M11.5 1.8 14.2 4.5 5.2 13.5 2 14.3l0.8-3.2z" />
            </svg>
          </button>
        )}
        <button
          type="button"
          className="icon-btn"
          onClick={() => onRemove(task.id)}
          aria-label={`Remove ${task.title}`}
        >
          ✕
        </button>
      </span>
    </li>
  );
}
