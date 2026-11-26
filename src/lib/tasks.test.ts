import { test } from "node:test";
import assert from "node:assert/strict";
import { addTask, moveTask, removeTask, toggleTask, updateTask } from "./tasks.ts";
import type { Task } from "./types.ts";

const ids = (tasks: Task[]) => tasks.map((t) => t.id).join("");
const many = (spec: string): Task[] =>
  [...spec].map((id) => ({ id, text: id, type: id === id.toUpperCase() ? "recurring" : "normal", doneOn: null }));

test("moveTask move para baixo e para cima", () => {
  const tasks = many("abcd");
  assert.equal(ids(moveTask(tasks, "a", "c")), "bcad");
  assert.equal(ids(moveTask(tasks, "d", "b")), "adbc");
  assert.equal(moveTask(tasks, "a", "a"), tasks);
  assert.equal(moveTask(tasks, "a", "x"), tasks);
});

test("moveTask preserva a ordem relativa do outro tipo", () => {
  // maiúsculas = recorrentes, minúsculas = normais, intercaladas
  const tasks = many("AbBcC");
  const moved = moveTask(tasks, "C", "A");
  assert.equal(ids(moved.filter((t) => t.type === "recurring")), "CAB");
  assert.equal(ids(moved.filter((t) => t.type === "normal")), "bc");
});

const D = "2026-01-01";

for (const type of ["normal", "recurring"] as const) {
  test(`concluir tarefa ${type} alterna o dia de hoje (fica na lista, riscada)`, () => {
    let tasks = addTask([], "1", "x", type);
    tasks = toggleTask(tasks, "1", D);
    assert.equal(tasks.length, 1);
    assert.equal(tasks[0].doneOn, D);
    tasks = toggleTask(tasks, "1", D);
    assert.equal(tasks[0].doneOn, null);
  });
}

test("editar tipo limpa a conclusão; editar só texto mantém", () => {
  let tasks = toggleTask(addTask([], "1", "x", "recurring"), "1", D);
  tasks = updateTask(tasks, "1", "y", "recurring");
  assert.deepEqual(tasks[0], { id: "1", text: "y", type: "recurring", doneOn: D });
  tasks = updateTask(tasks, "1", "y", "normal");
  assert.equal(tasks[0].doneOn, null);
});

test("remover", () => {
  assert.deepEqual(removeTask(addTask([], "1", "x", "normal"), "1"), []);
});
