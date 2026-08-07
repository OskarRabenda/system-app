import { useEffect, useMemo, useState } from "react";
import Atmosphere from "../../components/Atmosphere";
import GlassCard from "../../components/ui/GlassCard";
import TaskForm, { type NewTask } from "./components/TaskForm";
import TaskRow from "./components/TaskRow";
import { loadTasks, saveTasks, sortTasks, type Task } from "./data";
import type { Origin } from "../../components/WaveReveal";

type Props = {
  onBack?: (origin: Origin) => void;
};

export default function TasksPage({ onBack }: Props) {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const ordered = useMemo(() => sortTasks(tasks), [tasks]);
  const open = tasks.filter((t) => !t.done).length;

  const handleAdd = (draft: NewTask) => {
    setTasks((list) => [
      ...list,
      {
        id: `task-${Date.now()}`,
        title: draft.title,
        deadline: draft.deadline,
        priority: draft.priority,
        done: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    setAdding(false);
  };

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
          {open === 0
            ? "Nothing outstanding"
            : `${open} open task${open === 1 ? "" : "s"}`}
        </p>
      </header>

      <div className="task-stack">
        {ordered.length > 0 && (
          <GlassCard className="task-list-card">
            <ul className="tasks-list">
              {ordered.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={(id) =>
                    setTasks((list) =>
                      list.map((t) =>
                        t.id === id ? { ...t, done: !t.done } : t,
                      ),
                    )
                  }
                  onRemove={(id) =>
                    setTasks((list) => list.filter((t) => t.id !== id))
                  }
                />
              ))}
            </ul>
          </GlassCard>
        )}

        {ordered.length === 0 && !adding && (
          <p className="empty-note">No current tasks</p>
        )}

        {adding ? (
          <TaskForm onSubmit={handleAdd} onCancel={() => setAdding(false)} />
        ) : (
          <button
            type="button"
            className="add-task"
            onClick={() => setAdding(true)}
          >
            <span aria-hidden="true">＋</span> Add task
          </button>
        )}
      </div>
    </main>
  );
}
