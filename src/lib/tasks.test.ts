import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_WEEKDAYS } from "./schedule.ts";
import { addTask, moveTask, removeTask, scheduleOf, toggleTask, updateTask } from "./tasks.ts";
import type { Schedule, Task } from "./types.ts";

const PERIODIC: Schedule = { type: "periodic", weekdays: ALL_WEEKDAYS };

const ids = (tasks: Task[]) => tasks.map((t) => t.id).join("");
const many = (spec: string): Task[] =>
  [...spec].map((id) => ({
    id,
    text: id,
    priority: false,
    doneOn: null,
    ...(id === id.toUpperCase() ? PERIODIC : { type: "normal" as const }),
  }));

test("moveTask move para baixo e para cima", () => {
  const tasks = many("abcd");
  assert.equal(ids(moveTask(tasks, "a", "c")), "bcad");
  assert.equal(ids(moveTask(tasks, "d", "b")), "adbc");
  assert.equal(moveTask(tasks, "a", "a"), tasks);
  assert.equal(moveTask(tasks, "a", "x"), tasks);
});

test("moveTask preserva a ordem relativa do outro tipo", () => {
  // maiúsculas = periódicas, minúsculas = normais, intercaladas
  const tasks = many("AbBcC");
  const moved = moveTask(tasks, "C", "A");
  assert.equal(ids(moved.filter((t) => t.type === "periodic")), "CAB");
  assert.equal(ids(moved.filter((t) => t.type === "normal")), "bc");
});

const D = "2026-01-01";

const schedules: Schedule[] = [
  { type: "normal" },
  PERIODIC,
  { type: "interval", every: 2, start: D },
  { type: "scheduled", date: D },
];
for (const schedule of schedules) {
  test(`concluir tarefa ${schedule.type} registra a data de hoje (fica na lista, riscada)`, () => {
    let tasks = addTask([], "1", { text: "x", priority: false, ...schedule });
    tasks = toggleTask(tasks, "1", D);
    assert.equal(tasks.length, 1);
    assert.equal(tasks[0].doneOn, D);
    tasks = toggleTask(tasks, "1", D);
    assert.equal(tasks[0].doneOn, null);
  });
}

test("editar tipo limpa a conclusão; editar texto, prioridade ou dias mantém", () => {
  let tasks = toggleTask(addTask([], "1", { text: "x", priority: false, ...PERIODIC }), "1", D);
  tasks = updateTask(tasks, "1", { text: "y", priority: true, type: "periodic", weekdays: [1, 3, 5] });
  assert.deepEqual(tasks[0], { id: "1", text: "y", priority: true, type: "periodic", weekdays: [1, 3, 5], doneOn: D });
  tasks = updateTask(tasks, "1", { text: "y", priority: true, type: "interval", every: 3, start: D });
  assert.deepEqual(tasks[0], { id: "1", text: "y", priority: true, type: "interval", every: 3, start: D, doneOn: null });
  tasks = updateTask(tasks, "1", { text: "y", priority: false, type: "scheduled", date: "2026-02-01" });
  assert.deepEqual(tasks[0], { id: "1", text: "y", priority: false, type: "scheduled", date: "2026-02-01", doneOn: null });
  tasks = updateTask(tasks, "1", { text: "y", priority: false, type: "normal" });
  assert.deepEqual(tasks[0], { id: "1", text: "y", priority: false, type: "normal", doneOn: null }); // sem campos antigos
});

test("scheduleOf extrai só o agendamento", () => {
  const [t] = addTask([], "1", { text: "x", priority: true, type: "scheduled", date: D });
  assert.deepEqual(scheduleOf(t), { type: "scheduled", date: D });
});

test("remover", () => {
  assert.deepEqual(removeTask(addTask([], "1", { text: "x", priority: false, type: "normal" }), "1"), []);
});
