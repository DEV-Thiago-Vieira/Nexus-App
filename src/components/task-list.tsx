"use client";

import type { ReactNode } from "react";
import type { DayKey } from "@/lib/dates.ts";
import type { Task, TaskDraft } from "@/lib/types.ts";
import { TaskItem } from "./task-item";
import { SortableList } from "./sortable-list";

type Props = {
  title: string;
  /** Texto curto à direita do título (ex.: progresso de hoje). */
  aside?: ReactNode;
  tasks: Task[];
  today: DayKey;
  onMove: (id: string, overId: string) => void;
  onToggle: (id: string) => void;
  onUpdate: (id: string, draft: TaskDraft) => void;
  onRemove: (id: string) => void;
};

export function TaskList({ title, aside, tasks, today, onMove, onToggle, onUpdate, onRemove }: Props) {
  if (tasks.length === 0) return null;

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3 px-1.5">
        <h2 className="text-[15px] font-bold tracking-tight text-stone-800">{title}</h2>
        {aside && <span className="text-[13px] text-stone-500">{aside}</span>}
      </div>
      <SortableList items={tasks} noun="Tarefa" onMove={onMove}>
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            today={today}
            done={task.doneOn === today}
            onToggle={() => onToggle(task.id)}
            onUpdate={(draft) => onUpdate(task.id, draft)}
            onRemove={() => onRemove(task.id)}
          />
        ))}
      </SortableList>
    </section>
  );
}
