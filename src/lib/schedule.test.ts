import { test } from "node:test";
import assert from "node:assert/strict";
import { appliesOn, isRepeating, isValidSchedule, scheduledState, tasksForDay, toggleWeekday } from "./schedule.ts";
import type { Task } from "./types.ts";

// 2026-01-05 é segunda-feira.
const MON = "2026-01-05";
const TUE = "2026-01-06";
const WED = "2026-01-07";

test("normal aparece todo dia", () => {
  assert.ok(appliesOn({ type: "normal" }, MON));
});

test("periódica aparece só nos dias da semana escolhidos", () => {
  const mwf = { type: "periodic", weekdays: [1, 3, 5] } as const;
  assert.ok(appliesOn({ ...mwf, weekdays: [...mwf.weekdays] }, MON));
  assert.ok(!appliesOn({ ...mwf, weekdays: [...mwf.weekdays] }, TUE));
  assert.ok(appliesOn({ ...mwf, weekdays: [...mwf.weekdays] }, WED));
  assert.ok(appliesOn({ type: "periodic", weekdays: [0] }, "2026-01-04")); // domingo
});

test("agendada aparece a partir da data", () => {
  const s = { type: "scheduled", date: TUE } as const;
  assert.ok(!appliesOn(s, MON));
  assert.ok(appliesOn(s, TUE));
  assert.ok(appliesOn(s, WED));
});

test("tasksForDay filtra mantendo a ordem", () => {
  const tasks: Task[] = [
    { id: "a", text: "a", priority: false, doneOn: null, goalId: null, linkedOn: null, type: "periodic", weekdays: [2] },
    { id: "b", text: "b", priority: false, doneOn: null, goalId: null, linkedOn: null, type: "normal" },
    { id: "c", text: "c", priority: false, doneOn: null, goalId: null, linkedOn: null, type: "scheduled", date: WED },
  ];
  assert.deepEqual(tasksForDay(tasks, MON).map((t) => t.id), ["b"]);
  assert.deepEqual(tasksForDay(tasks, TUE).map((t) => t.id), ["a", "b"]);
  assert.deepEqual(tasksForDay(tasks, WED).map((t) => t.id), ["b", "c"]);
});

test("toggleWeekday liga e desliga mantendo a ordem", () => {
  assert.deepEqual(toggleWeekday([1, 5], 3), [1, 3, 5]);
  assert.deepEqual(toggleWeekday([1, 3, 5], 3), [1, 5]);
});

test("isValidSchedule exige dias ou data válida", () => {
  assert.ok(isValidSchedule({ type: "normal" }));
  assert.ok(!isValidSchedule({ type: "periodic", weekdays: [] }));
  assert.ok(isValidSchedule({ type: "periodic", weekdays: [2] }));
  assert.ok(!isValidSchedule({ type: "scheduled", date: "" }));
  assert.ok(!isValidSchedule({ type: "scheduled", date: "2026-02-30" }));
  assert.ok(isValidSchedule({ type: "scheduled", date: MON }));
  assert.ok(isValidSchedule({ type: "interval", every: 2, start: MON }));
  assert.ok(isValidSchedule({ type: "interval", every: 30, start: MON }));
  assert.ok(!isValidSchedule({ type: "interval", every: 1, start: MON }));
  assert.ok(!isValidSchedule({ type: "interval", every: 31, start: MON }));
  assert.ok(!isValidSchedule({ type: "interval", every: 2.5, start: MON }));
  assert.ok(!isValidSchedule({ type: "interval", every: Number.NaN, start: MON }));
  assert.ok(!isValidSchedule({ type: "interval", every: 3, start: "" }));
});

test("a cada X dias: aparece no início e depois de X em X dias", () => {
  const s = { type: "interval", every: 3, start: MON } as const;
  assert.ok(!appliesOn(s, "2026-01-04")); // antes do início
  assert.ok(appliesOn(s, MON));
  assert.ok(!appliesOn(s, TUE));
  assert.ok(!appliesOn(s, WED));
  assert.ok(appliesOn(s, "2026-01-08"));
  assert.ok(appliesOn(s, "2026-02-01")); // 27 dias depois, atravessando o mês
  // Atravessa a mudança de horário de verão (BR/EUA) sem errar a conta.
  assert.ok(appliesOn({ type: "interval", every: 7, start: "2026-03-01" }, "2026-03-15"));
  assert.ok(appliesOn({ type: "interval", every: 2, start: "2026-10-31" }, "2026-11-02"));
});

test("isRepeating: periódicas e a cada X dias", () => {
  assert.ok(isRepeating({ type: "periodic", weekdays: [1] }));
  assert.ok(isRepeating({ type: "interval", every: 2, start: MON }));
  assert.ok(!isRepeating({ type: "normal" }));
  assert.ok(!isRepeating({ type: "scheduled", date: MON }));
});

test("scheduledState: do dia, atrasada ou futura", () => {
  assert.equal(scheduledState(TUE, TUE), "today");
  assert.equal(scheduledState(MON, TUE), "overdue");
  assert.equal(scheduledState(WED, TUE), "upcoming");
});
