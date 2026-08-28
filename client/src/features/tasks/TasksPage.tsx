import { useEffect, useMemo, useState } from "react";
import Atmosphere from "../../components/Atmosphere";
import GlassCard from "../../components/ui/GlassCard";
import TaskForm, { type NewTask } from "./components/TaskForm";
import TaskRow from "./components/TaskRow";
import {
  loadTasks,
  saveTasks,
  sortHistory,
  sortTasks,
  type Task,
} from "./data";
import type { Origin } from "../../components/WaveReveal";

type Props = {
  onBack?: (origin: Origin) => void;
};

export default function TasksPage({ onBack }: Props) {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const open = useMemo(
    () => sortTasks(tasks.filter((t) => !t.done)),
    [tasks],
  );
  const done = useMemo(
    () => sortHistory(tasks.filter((t) => t.done)),
    [tasks],
  );

  /* Checking a task moves it to history and stamps when; restoring clears the
     stamp so it rejoins the open list as though it had never been finished. */
  const toggle = (id: string) =>
    setTasks((list) =>
      list.map((t) =>
        t.id === id
          ? t.done
            ? { ...t, done: false, completedAt: undefined }
            : { ...t, done: true, completedAt: new Date().toISOString() }
          : t,
      ),
    );

  const remove = (id: string) =>
    setTasks((list) => list.filter((t) => t.id !== id));

  const submit = (draft: NewTask) => {
    if (editing) {
      setTasks((list) =>
        list.map((t) => (t.id === editing.id ? { ...t, ...draft } : t)),
      );
      setEditing(null);
      return;
    }
    setTasks((list) => [
      ...list,
      {
        id: `task-${Date.now()}`,
        title: draft.title,
        description: draft.description,
        deadline: draft.deadline,
        priority: draft.priority,
        done: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    setAdding(false);
  };

  const formOpen = adding || editing !== null;

  return (
    <main className="screen tasks">
      <Atmosphere />

      <header className="screen-head">
        <button
          type="button"
          className="back"
          onClick={(e) => onBack?.({ x: e.clientX, y: e.clientY })}
        >
          <span aria-hidden="true">←</span> Dashboard
        </button>
        <div className="screen-title">
          <span className="screen-emoji" aria-hidden="true">
            📋
          </span>
          <h1>Tasks</h1>
        </div>
        <p className="screen-stamp">
          {open.length === 0
            ? "Nothing outstanding"
            : `${open.length} open task${open.length === 1 ? "" : "s"}`}
        </p>
      </header>

      <div className="task-stack">
        {open.length > 0 && (
          <GlassCard className="task-list-card">
            <ul className="tasks-list">
              {open.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={toggle}
                  onRemove={remove}
                  onEdit={(t) => {
                    setAdding(false);
                    setEditing(t);
                  }}
                />
              ))}
            </ul>
          </GlassCard>
        )}

        {open.length === 0 && !formOpen && (
          <p className="empty-note">No current tasks</p>
        )}

        {formOpen ? (
          <TaskForm
            // Remounts between add and edit so the fields re-initialise.
            key={editing?.id ?? "new"}
            initial={editing ?? undefined}
            onSubmit={submit}
            onCancel={() => {
              setAdding(false);
              setEditing(null);
            }}
          />
        ) : (
          <button
            type="button"
            className="add-task"
            onClick={() => setAdding(true)}
          >
            <span aria-hidden="true">＋</span> Add task
          </button>
        )}

        {done.length > 0 && (
          <div className="history">
            <button
              type="button"
              className="history-toggle"
              aria-expanded={historyOpen}
              onClick={() => setHistoryOpen((v) => !v)}
            >
              <span className="history-caret" aria-hidden="true">
                {historyOpen ? "▾" : "▸"}
              </span>
              History
              <span className="history-count">{done.length}</span>
            </button>

            {historyOpen && (
              <GlassCard className="task-list-card">
                <ul className="tasks-list">
                  {done.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      variant="history"
                      onToggle={toggle}
                      onRemove={remove}
                    />
                  ))}
                </ul>
              </GlassCard>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
