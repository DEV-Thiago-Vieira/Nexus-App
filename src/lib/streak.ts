import type { DayKey } from "./dates.ts";
import { addDays } from "./dates.ts";
import { appliesOn, isRepeating } from "./schedule.ts";
import type { AppState, Streak, Task } from "./types.ts";

export const WARMUP_DAYS = 3;
export const CYCLE_DAYS = 7;

export type DayStatus = "done" | "failed";

/**
 * Dia com prioritárias que se aplicam a ele: feito quando todas estão concluídas nele.
 * Dia sem prioritárias: feito se ao menos uma tarefa foi concluída nele.
 */
export function dayStatus(tasks: Task[], day: DayKey): DayStatus {
  const priority = tasks.filter((t) => t.priority && appliesOn(t, day));
  if (priority.length > 0) return priority.every((t) => t.doneOn === day) ? "done" : "failed";
  return tasks.some((t) => t.doneOn === day) ? "done" : "failed";
}

/** Um ciclo de 7 se completa quando a sequência chega a 3 + 7k dias (k ≥ 1). */
export function completesCycle(length: number): boolean {
  return length > WARMUP_DAYS && (length - WARMUP_DAYS) % CYCLE_DAYS === 0;
}

/** Quantos ciclos de 7 completos cabem numa sequência de `length` dias. */
export function cyclesIn(length: number): number {
  return length > WARMUP_DAYS ? Math.floor((length - WARMUP_DAYS) / CYCLE_DAYS) : 0;
}

/**
 * Avalia cada dia de streak.lastDay até ontem (today exclusive), aplicando dayStatus a cada um.
 * As tarefas salvas refletem o estado no fim de lastDay; nos dias em que o app não foi
 * aberto nada foi concluído, então esses dias zeram a sequência.
 * Também remove as normais e agendadas concluídas em dias anteriores (periódicas ficam).
 */
export function rollover(state: AppState, today: DayKey): AppState {
  const { tasks, streak } = state;
  if (streak.lastDay >= today) return state;

  let { length, best, totalCycles, completedDays } = streak;
  for (let day = streak.lastDay; day < today; day = addDays(day, 1)) {
    if (dayStatus(tasks, day) === "done") {
      length += 1;
      completedDays += 1;
      best = Math.max(best, length);
      if (completesCycle(length)) totalCycles += 1;
    } else {
      length = 0;
    }
  }

  return {
    ...state,
    tasks: tasks.filter((t) => isRepeating(t) || t.doneOn === null || t.doneOn >= today),
    streak: { length, best, totalCycles, completedDays, lastDay: today },
  };
}

export type ProgressView = {
  /** Medidor da etapa atual. */
  stage: "warmup" | "cycle";
  current: number;
  goal: number;
  /** Sequência atual (zera ao falhar). */
  streakDays: number;
  streakCycles: number;
  /** Melhor sequência já alcançada. */
  bestDays: number;
  bestCycles: number;
  /** Totais acumulados. */
  totalCycles: number;
  completedDays: number;
};

/** O que exibir agora, incluindo o dia de hoje se ele já estiver completo. */
export function progressView(streak: Streak, tasks: Task[], today: DayKey): ProgressView {
  const todayDone = dayStatus(tasks, today) === "done";
  const length = streak.length + (todayDone ? 1 : 0);
  const bestDays = Math.max(streak.best, length);
  const stats = {
    streakDays: length,
    streakCycles: cyclesIn(length),
    bestDays,
    bestCycles: cyclesIn(bestDays),
    totalCycles: streak.totalCycles + (todayDone && completesCycle(length) ? 1 : 0),
    completedDays: streak.completedDays + (todayDone ? 1 : 0),
  };

  if (length <= WARMUP_DAYS) {
    if (length === WARMUP_DAYS && !todayDone) {
      return { stage: "cycle", current: 0, goal: CYCLE_DAYS, ...stats };
    }
    return { stage: "warmup", current: length, goal: WARMUP_DAYS, ...stats };
  }

  const current = ((length - WARMUP_DAYS - 1) % CYCLE_DAYS) + 1;
  if (current === CYCLE_DAYS && !todayDone) {
    return { stage: "cycle", current: 0, goal: CYCLE_DAYS, ...stats };
  }
  return { stage: "cycle", current, goal: CYCLE_DAYS, ...stats };
}
