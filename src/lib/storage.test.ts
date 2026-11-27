import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, migrateCompletion, migrateGoal, migrateTask, parseState } from "./storage.ts";
import { rollover } from "./streak.ts";

const TODAY = "2026-01-10";

/** Dados salvos pela v1.0 (recorrentes diárias). */
const V1 = JSON.stringify({
  tasks: [
    { id: "r1", text: "Ler", type: "recurring", doneOn: "2026-01-09" },
    { id: "n1", text: "Mercado", type: "normal", doneOn: null },
    { id: "r2", text: "Treinar", type: "recurring", doneOn: null },
  ],
  streak: { length: 5, best: 9, totalCycles: 1, completedDays: 14, lastDay: "2026-01-09" },
  showDone: false,
});

test("migração: recorrentes viram periódicas prioritárias de todos os dias, sem perder nada", () => {
  const s = parseState(V1, TODAY);
  assert.deepEqual(s.tasks, [
    { id: "r1", text: "Ler", priority: true, type: "periodic", weekdays: [0, 1, 2, 3, 4, 5, 6], doneOn: "2026-01-09", goalId: null, linkedOn: null },
    { id: "n1", text: "Mercado", priority: false, type: "normal", doneOn: null, goalId: null, linkedOn: null },
    { id: "r2", text: "Treinar", priority: true, type: "periodic", weekdays: [0, 1, 2, 3, 4, 5, 6], doneOn: null, goalId: null, linkedOn: null },
  ]);
  assert.deepEqual(s.streak, { length: 5, best: 9, totalCycles: 1, completedDays: 14, lastDay: "2026-01-09" });
  assert.equal(s.showDone, false);
});

test("migração: sequência atual continua com a regra nova", () => {
  const done = JSON.parse(V1);
  done.tasks[2].doneOn = "2026-01-09"; // todas as recorrentes feitas no último dia
  const s = rollover(parseState(JSON.stringify(done), TODAY), TODAY);
  assert.equal(s.streak.length, 6);
  assert.equal(s.streak.completedDays, 15);
});

test("migração: dados da primeira versão sem best/completedDays", () => {
  const raw = JSON.stringify({
    tasks: [{ id: "r", text: "r", type: "recurring", doneOn: null }],
    streak: { length: 2, totalCycles: 0, lastDay: "2026-01-09" },
  });
  const s = parseState(raw, TODAY);
  assert.deepEqual(s.streak, { length: 2, best: 2, totalCycles: 0, completedDays: 2, lastDay: "2026-01-09" });
  assert.equal(s.tasks[0].type, "periodic");
  assert.equal(s.showDone, true);
});

test("migração: tarefas sem prioridade (v1.1) — periódicas viram prioritárias, as demais não", () => {
  const p = migrateTask({ id: "p", text: "p", type: "periodic", weekdays: [1], doneOn: null });
  const s = migrateTask({ id: "s", text: "s", type: "scheduled", date: TODAY, doneOn: null });
  const n = migrateTask({ id: "n", text: "n", type: "normal", doneOn: null });
  assert.equal(p?.priority, true);
  assert.equal(s?.priority, false);
  assert.equal(n?.priority, false);
});

test("migração da v1.1: sem objetivos, tarefas sem vínculo, conclusões de hoje registradas, sequência mantida", () => {
  const v11 = {
    tasks: [
      { id: "p", text: "p", priority: true, type: "periodic", weekdays: [1], doneOn: "2026-01-09" },
      { id: "n", text: "n", priority: false, type: "normal", doneOn: "2026-01-09" },
      { id: "m", text: "m", priority: false, type: "normal", doneOn: null },
    ],
    streak: { length: 7, best: 12, totalCycles: 1, completedDays: 40, lastDay: "2026-01-09" },
    showDone: true,
  };
  const s = parseState(JSON.stringify(v11), TODAY);
  assert.deepEqual(s.goals, []);
  assert.deepEqual(
    s.tasks.map((t) => [t.id, t.goalId, t.linkedOn, t.doneOn]),
    [
      ["p", null, null, "2026-01-09"],
      ["n", null, null, "2026-01-09"],
      ["m", null, null, null],
    ],
  );
  assert.deepEqual(s.completions, [
    { taskId: "p", goalId: null, day: "2026-01-09", once: false },
    { taskId: "n", goalId: null, day: "2026-01-09", once: true },
  ]);
  assert.deepEqual(s.streak, v11.streak);
});

test("vínculo para objetivo inexistente é limpo ao carregar", () => {
  const raw = JSON.stringify({
    tasks: [
      { id: "a", text: "a", priority: false, type: "normal", doneOn: null, goalId: "sumiu", linkedOn: TODAY },
      { id: "b", text: "b", priority: false, type: "normal", doneOn: null, goalId: "g", linkedOn: TODAY },
    ],
    goals: [{ id: "g", title: "g", start: TODAY, end: TODAY, featured: false, completedOn: null }],
    completions: [],
    streak: { length: 0, best: 0, totalCycles: 0, completedDays: 0, lastDay: TODAY },
    showDone: true,
  });
  assert.deepEqual(
    parseState(raw, TODAY).tasks.map((t) => [t.goalId, t.linkedOn]),
    [
      [null, null],
      ["g", TODAY],
    ],
  );
});

test("mais de um objetivo em destaque salvo: mantém só o primeiro", () => {
  const g = (id: string) => ({ id, title: id, start: TODAY, end: TODAY, featured: true, completedOn: null });
  const raw = JSON.stringify({
    tasks: [],
    goals: [g("a"), g("b")],
    streak: { length: 0, best: 0, totalCycles: 0, completedDays: 0, lastDay: TODAY },
  });
  assert.deepEqual(
    parseState(raw, TODAY).goals.map((x) => x.featured),
    [true, false],
  );
});

test("formato novo é lido como está", () => {
  const state = {
    tasks: [
      { id: "p", text: "p", priority: false, type: "periodic", weekdays: [1, 3, 5], doneOn: null, goalId: null, linkedOn: null },
      { id: "i", text: "i", priority: true, type: "interval", every: 3, start: "2026-01-02", doneOn: null, goalId: "g", linkedOn: "2026-01-03" },
      { id: "s", text: "s", priority: true, type: "scheduled", date: "2026-02-01", time: "14:30", doneOn: null, goalId: "g", linkedOn: "2026-01-03" },
    ],
    goals: [
      { id: "g", title: "Renda", start: "2026-01-01", end: "2026-12-31", featured: true, completedOn: null },
      { id: "g2", title: "Curso", start: "2026-01-01", end: "2026-06-30", featured: false, completedOn: "2026-05-01" },
    ],
    completions: [
      { taskId: "i", goalId: "g", day: "2026-01-05", once: false },
      { taskId: "sumiu", goalId: "g", day: "2026-01-04", once: true },
    ],
    streak: { length: 1, best: 1, totalCycles: 0, completedDays: 1, lastDay: TODAY },
    showDone: true,
  };
  assert.deepEqual(parseState(JSON.stringify(state), TODAY), state);
});

test("dados inválidos voltam ao estado inicial", () => {
  const empty = initialState(TODAY);
  assert.deepEqual(parseState(null, TODAY), empty);
  assert.deepEqual(parseState("{", TODAY), empty);
  assert.deepEqual(parseState(JSON.stringify({ tasks: [], streak: { length: 0 } }), TODAY), empty);
  assert.equal(migrateTask({ id: "x", text: "x", type: "periodic", weekdays: [], doneOn: null }), null);
  assert.equal(migrateTask({ id: "x", text: "x", type: "periodic", weekdays: [7], doneOn: null }), null);
  assert.equal(migrateTask({ id: "x", text: "x", type: "scheduled", date: "amanhã", doneOn: null }), null);
  assert.equal(migrateTask({ id: "x", text: "x", type: "outro", doneOn: null }), null);
  assert.equal(migrateTask({ id: "x", text: "x", type: "normal", doneOn: 5 }), null);
  assert.equal(migrateTask({ id: "x", text: "x", type: "normal", priority: "sim", doneOn: null }), null);
  assert.equal(migrateTask({ id: "x", text: "x", type: "interval", every: 1, start: TODAY, doneOn: null }), null);
  assert.equal(migrateTask({ id: "x", text: "x", type: "interval", every: 3, start: "x", doneOn: null }), null);
  assert.equal(migrateTask({ id: "x", text: "x", type: "normal", doneOn: null, goalId: 3, linkedOn: TODAY }), null);
  assert.equal(migrateTask({ id: "x", text: "x", type: "normal", doneOn: null, goalId: "g", linkedOn: "x" }), null);
  assert.equal(migrateTask({ id: "x", text: "x", type: "scheduled", date: TODAY, time: "8h", doneOn: null }), null);
  assert.equal(migrateTask({ id: "x", text: "x", type: "periodic", weekdays: [1], time: "24:00", doneOn: null }), null);
  assert.equal(migrateTask({ id: "x", text: "x", type: "interval", every: 2, start: TODAY, time: 800, doneOn: null }), null);
  const g = { id: "g", title: "t", start: TODAY, end: TODAY, featured: false, completedOn: null };
  assert.deepEqual(migrateGoal(g), g);
  assert.equal(migrateGoal({ ...g, title: " " }), null);
  assert.equal(migrateGoal({ ...g, start: "x" }), null);
  assert.equal(migrateGoal({ ...g, end: "2026-01-09" }), null);
  assert.equal(migrateGoal({ ...g, featured: 1 }), null);
  assert.equal(migrateGoal({ ...g, completedOn: "x" }), null);
  assert.equal(migrateCompletion({ taskId: "t", goalId: null, day: "x", once: true }), null);
  assert.equal(migrateCompletion({ taskId: "t", goalId: 1, day: TODAY, once: true }), null);
  assert.equal(migrateCompletion({ taskId: "t", goalId: null, day: TODAY }), null);
  const base = { tasks: [], streak: { length: 0, totalCycles: 0, lastDay: TODAY } };
  assert.deepEqual(parseState(JSON.stringify({ ...base, goals: [{ id: "g" }] }), TODAY), empty);
  assert.deepEqual(parseState(JSON.stringify({ ...base, goals: "x" }), TODAY), empty);
  assert.deepEqual(parseState(JSON.stringify({ ...base, completions: [{}] }), TODAY), empty);
});
