import type { CSSProperties } from "react";
import { describeDeadline, priorityOf, type Task } from "../data";

type Props = {
  task: Task;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
};

export default function TaskRow({ task, onToggle, onRemove }: Props) {
  const priority = priorityOf(task.priority);
  const due = task.deadline ? describeDeadline(task.deadline) : null;

  return (
    <li
      className={`task ${task.done ? "is-done" : ""}`}
      style={{ "--accent": priority.hue } as CSSProperties}
    >
      <button
        type="button"
        className="task-check"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.done ? "Mark as not done" : "Mark as done"}
        onClick={() => onToggle(task.id)}
      >
        {task.done ? "✓" : ""}
      </button>

      <div className="task-main">
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          <span className="task-priority">{priority.label}</span>
          {due && (
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

      <button
        type="button"
        className="icon-btn"
        onClick={() => onRemove(task.id)}
        aria-label={`Remove ${task.title}`}
      >
        ✕
      </button>
    </li>
  );
}
