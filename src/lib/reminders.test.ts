import { test } from "node:test";
import assert from "node:assert/strict";
import { nextReminderTime, remindersAt } from "./reminders.ts";
import type { Task } from "./types.ts";

const MON = "2026-11-30";

const task = (id: string, over: Partial<Task> = {}): Task =>
  ({ id, text: id, priority: false, type: "normal", doneOn: null, goalId: null, linkedOn: null, ...over }) as Task;

const tasks = [
  task("remedio", { type: "periodic", weekdays: [1], time: "08:00" } as Partial<Task>),
  task("treino", { type: "periodic", weekdays: [1], time: "18:30" } as Partial<Task>),
  task("feito", { type: "periodic", weekdays: [1], time: "09:00", doneOn: MON } as Partial<Task>),
  task("outro-dia", { type: "periodic", weekdays: [2], time: "07:00" } as Partial<Task>),
  task("consulta", { type: "scheduled", date: MON, time: "08:00" } as Partial<Task>),
  task("futura", { type: "scheduled", date: "2026-12-01", time: "10:00" } as Partial<Task>),
  task("sem-hora", { type: "periodic", weekdays: [1] } as Partial<Task>),
];

test("nextReminderTime: próximo horário depois de agora, entre as pendentes de hoje", () => {
  assert.equal(nextReminderTime(tasks, MON, "06:00"), "08:00");
  assert.equal(nextReminderTime(tasks, MON, "08:00"), "18:30");
  assert.equal(nextReminderTime(tasks, MON, "18:30"), null);
});

test("remindersAt: pendentes de hoje com aquele horário", () => {
  assert.deepEqual(
    remindersAt(tasks, MON, "08:00").map((t) => t.id),
    ["remedio", "consulta"],
  );
  assert.deepEqual(remindersAt(tasks, MON, "09:00"), []);
});
