import type { DayKey } from "./dates.ts";
import { daysBetween, isDayKey, weekdayOf } from "./dates.ts";
import type { Schedule, Task, Weekday } from "./types.ts";

export const ALL_WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/** Limites do "a cada X dias" (1 dia é a periódica com todos os dias marcados). */
export const MIN_INTERVAL = 2;
export const MAX_INTERVAL = 30;

/** Periódicas (dias da semana ou a cada X dias): voltam pendentes no próximo dia em que se aplicam. */
export function isRepeating(schedule: Schedule): boolean {
  return schedule.type === "periodic" || schedule.type === "interval";
}

/** Se a tarefa aparece na lista do dia `day`. */
export function appliesOn(schedule: Schedule, day: DayKey): boolean {
  switch (schedule.type) {
    case "normal":
      return true;
    case "periodic":
      return schedule.weekdays.includes(weekdayOf(day) as Weekday);
    case "interval": {
      const n = daysBetween(schedule.start, day);
      return n >= 0 && n % schedule.every === 0;
    }
    case "scheduled":
      return schedule.date <= day;
  }
}

export function tasksForDay(tasks: Task[], day: DayKey): Task[] {
  return tasks.filter((t) => appliesOn(t, day));
}

export type ScheduledState = "upcoming" | "today" | "overdue";

/** Situação de uma agendada: do dia, atrasada (data já passou) ou futura. */
export function scheduledState(date: DayKey, today: DayKey): ScheduledState {
  if (date === today) return "today";
  return date < today ? "overdue" : "upcoming";
}

/** Liga/desliga um dia da semana, mantendo a lista ordenada. */
export function toggleWeekday(weekdays: Weekday[], day: Weekday): Weekday[] {
  return weekdays.includes(day)
    ? weekdays.filter((d) => d !== day)
    : [...weekdays, day].sort((a, b) => a - b);
}

export function isValidInterval(every: unknown): every is number {
  return Number.isInteger(every) && (every as number) >= MIN_INTERVAL && (every as number) <= MAX_INTERVAL;
}

/** Agendamento pronto para salvar (periódica sem dias ou agendada sem data não vale). */
export function isValidSchedule(schedule: Schedule): boolean {
  switch (schedule.type) {
    case "normal":
      return true;
    case "periodic":
      return schedule.weekdays.length > 0;
    case "interval":
      return isValidInterval(schedule.every) && isDayKey(schedule.start);
    case "scheduled":
      return isDayKey(schedule.date);
  }
}
