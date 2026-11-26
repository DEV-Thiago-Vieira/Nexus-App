import type { DayKey } from "./dates.ts";
import type { Task, TaskType } from "./types.ts";

export function addTask(tasks: Task[], id: string, text: string, type: TaskType): Task[] {
  return [...tasks, { id, text, type, doneOn: null }];
}

export function updateTask(tasks: Task[], id: string, text: string, type: TaskType): Task[] {
  return tasks.map((t) =>
    t.id === id ? { ...t, text, type, doneOn: t.type === type ? t.doneOn : null } : t,
  );
}

export function removeTask(tasks: Task[], id: string): Task[] {
  return tasks.filter((t) => t.id !== id);
}

/** Move a tarefa `id` para a posição da tarefa `overId`, mantendo a ordem das demais. */
export function moveTask(tasks: Task[], id: string, overId: string): Task[] {
  const from = tasks.findIndex((t) => t.id === id);
  const to = tasks.findIndex((t) => t.id === overId);
  if (from === -1 || to === -1 || from === to) return tasks;
  const next = [...tasks];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * Alterna feita/não feita hoje. Recorrente volta pendente no dia seguinte;
 * normal concluída é removida na virada do dia (ver rollover).
 */
export function toggleTask(tasks: Task[], id: string, today: DayKey): Task[] {
  return tasks.map((t) =>
    t.id === id ? { ...t, doneOn: t.doneOn === today ? null : today } : t,
  );
}
