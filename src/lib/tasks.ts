import type { DayKey } from "./dates.ts";
import type { Schedule, Task, TaskDraft } from "./types.ts";

export function addTask(tasks: Task[], id: string, draft: TaskDraft): Task[] {
  return [...tasks, { id, doneOn: null, ...draft }];
}

/** Atualiza texto, prioridade e agendamento; trocar o tipo limpa a conclusão. */
export function updateTask(tasks: Task[], id: string, draft: TaskDraft): Task[] {
  return tasks.map((t) => (t.id === id ? { id: t.id, doneOn: t.type === draft.type ? t.doneOn : null, ...draft } : t));
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
 * Alterna feita/não feita hoje, registrando a data de conclusão.
 * Periódicas voltam pendentes no próximo dia em que se aplicam;
 * normal e agendada concluídas são removidas na virada do dia (ver rollover).
 */
export function toggleTask(tasks: Task[], id: string, today: DayKey): Task[] {
  return tasks.map((t) =>
    t.id === id ? { ...t, doneOn: t.doneOn === today ? null : today } : t,
  );
}

/** Extrai só o agendamento de uma tarefa. */
export function scheduleOf(task: Task): Schedule {
  switch (task.type) {
    case "normal":
      return { type: "normal" };
    case "periodic":
      return { type: "periodic", weekdays: task.weekdays };
    case "interval":
      return { type: "interval", every: task.every, start: task.start };
    case "scheduled":
      return { type: "scheduled", date: task.date };
  }
}
