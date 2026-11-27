import type { DayKey, TimeKey } from "./dates.ts";
import { appliesOn } from "./schedule.ts";
import type { Task } from "./types.ts";

const timeOf = (task: Task): TimeKey | undefined => (task.type === "normal" ? undefined : task.time);

const pendingWithTime = (tasks: Task[], today: DayKey) =>
  tasks.filter((t) => timeOf(t) !== undefined && t.doneOn !== today && appliesOn(t, today));

export function nextReminderTime(tasks: Task[], today: DayKey, now: TimeKey): TimeKey | null {
  const times = pendingWithTime(tasks, today)
    .map((t) => timeOf(t) as TimeKey)
    .filter((time) => time > now)
    .sort();
  return times[0] ?? null;
}

export function remindersAt(tasks: Task[], today: DayKey, time: TimeKey): Task[] {
  return pendingWithTime(tasks, today).filter((t) => timeOf(t) === time);
}
