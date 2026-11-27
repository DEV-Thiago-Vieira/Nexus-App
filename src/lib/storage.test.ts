import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, migrateTask, parseState } from "./storage.ts";
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
    { id: "r1", text: "Ler", priority: true, type: "periodic", weekdays: [0, 1, 2, 3, 4, 5, 6], doneOn: "2026-01-09" },
    { id: "n1", text: "Mercado", priority: false, type: "normal", doneOn: null },
    { id: "r2", text: "Treinar", priority: true, type: "periodic", weekdays: [0, 1, 2, 3, 4, 5, 6], doneOn: null },
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

test("formato novo é lido como está", () => {
  const state = {
    tasks: [
      { id: "p", text: "p", priority: false, type: "periodic", weekdays: [1, 3, 5], doneOn: null },
      { id: "i", text: "i", priority: true, type: "interval", every: 3, start: "2026-01-02", doneOn: null },
      { id: "s", text: "s", priority: true, type: "scheduled", date: "2026-02-01", doneOn: null },
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
});
