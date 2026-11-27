import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_WEEKDAYS } from "./schedule.ts";
import { addTask, moveTask, removeTask, scheduleOf, toggleTask, toggleTaskDone, updateTask } from "./tasks.ts";
import type { AppState, Schedule, Task } from "./types.ts";

const PERIODIC: Schedule = { type: "periodic", weekdays: ALL_WEEKDAYS };

const ids = (tasks: Task[]) => tasks.map((t) => t.id).join("");
const many = (spec: string): Task[] =>
  [...spec].map((id) => ({
    id,
    text: id,
    priority: false,
    doneOn: null,
    goalId: null,
    linkedOn: null,
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
    let tasks = addTask([], "1", { text: "x", priority: false, goalId: null, ...schedule }, D);
    tasks = toggleTask(tasks, "1", D);
    assert.equal(tasks.length, 1);
    assert.equal(tasks[0].doneOn, D);
    tasks = toggleTask(tasks, "1", D);
    assert.equal(tasks[0].doneOn, null);
  });
}

test("editar tipo limpa a conclusão; editar texto, prioridade ou dias mantém", () => {
  let tasks = toggleTask(addTask([], "1", { text: "x", priority: false, goalId: null, ...PERIODIC }, D), "1", D);
  tasks = updateTask(tasks, "1", { text: "y", priority: true, goalId: null, type: "periodic", weekdays: [1, 3, 5] }, D);
  assert.deepEqual(tasks[0], { id: "1", text: "y", priority: true, goalId: null, linkedOn: null, type: "periodic", weekdays: [1, 3, 5], doneOn: D });
  tasks = updateTask(tasks, "1", { text: "y", priority: true, goalId: null, type: "interval", every: 3, start: D }, D);
  assert.deepEqual(tasks[0], { id: "1", text: "y", priority: true, goalId: null, linkedOn: null, type: "interval", every: 3, start: D, doneOn: null });
  tasks = updateTask(tasks, "1", { text: "y", priority: false, goalId: null, type: "scheduled", date: "2026-02-01" }, D);
  assert.deepEqual(tasks[0], { id: "1", text: "y", priority: false, goalId: null, linkedOn: null, type: "scheduled", date: "2026-02-01", doneOn: null });
  tasks = updateTask(tasks, "1", { text: "y", priority: false, goalId: null, type: "normal" }, D);
  assert.deepEqual(tasks[0], { id: "1", text: "y", priority: false, goalId: null, linkedOn: null, type: "normal", doneOn: null });
});

test("scheduleOf extrai só o agendamento", () => {
  const [t] = addTask([], "1", { text: "x", priority: true, goalId: null, type: "scheduled", date: D }, D);
  assert.deepEqual(scheduleOf(t), { type: "scheduled", date: D });
});

test("remover", () => {
  assert.deepEqual(removeTask(addTask([], "1", { text: "x", priority: false, goalId: null, type: "normal" }, D), "1"), []);
});

test("vínculo: guarda o dia em que a tarefa foi vinculada; trocar de objetivo recomeça a contagem", () => {
  let tasks = addTask([], "1", { text: "x", priority: false, goalId: "g", type: "normal" }, D);
  assert.deepEqual([tasks[0].goalId, tasks[0].linkedOn], ["g", D]);
  tasks = toggleTask(tasks, "1", D);
  tasks = updateTask(tasks, "1", { text: "y", priority: false, goalId: "g", type: "normal" }, "2026-01-05");
  assert.deepEqual([tasks[0].goalId, tasks[0].linkedOn, tasks[0].doneOn], ["g", D, D]);
  tasks = updateTask(tasks, "1", { text: "y", priority: false, goalId: "h", type: "normal" }, "2026-01-05");
  assert.deepEqual([tasks[0].goalId, tasks[0].linkedOn], ["h", "2026-01-05"]);
  tasks = updateTask(tasks, "1", { text: "y", priority: false, goalId: null, type: "normal" }, "2026-01-06");
  assert.deepEqual([tasks[0].goalId, tasks[0].linkedOn], [null, null]);
});

const withTasks = (tasks: Task[]): AppState => ({
  tasks,
  goals: [],
  completions: [],
  streak: { length: 0, best: 0, totalCycles: 0, completedDays: 0, lastDay: D },
  showDone: true,
});

test("toggleTaskDone registra a conclusão com o objetivo e desfaz ao desmarcar", () => {
  const periodic = addTask([], "p", { text: "p", priority: false, goalId: "g", ...PERIODIC }, D);
  const normal = addTask([], "n", { text: "n", priority: false, goalId: null, type: "normal" }, D);
  let s = withTasks([...periodic, ...normal]);
  s = toggleTaskDone(s, "p", D);
  s = toggleTaskDone(s, "n", D);
  assert.equal(s.tasks[0].doneOn, D);
  assert.deepEqual(s.completions, [
    { taskId: "p", goalId: "g", day: D, once: false },
    { taskId: "n", goalId: null, day: D, once: true },
  ]);
  s = toggleTaskDone(s, "p", D);
  assert.equal(s.tasks[0].doneOn, null);
  assert.deepEqual(s.completions, [{ taskId: "n", goalId: null, day: D, once: true }]);
  assert.equal(toggleTaskDone(s, "inexistente", D), s);
});
