import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addGoal,
  addHabit,
  daysLeft,
  decodeLink,
  encodeLink,
  goalState,
  isValidGoalDraft,
  isValidHabitDraft,
  linkLabel,
  linkOptions,
  longTermGoal,
  removeGoal,
  removeHabit,
  toggleGoalDone,
  updateGoal,
  updateHabit,
} from "./goals.ts";
import type { AppState, Goal, GoalDraft, Habit, Task } from "./types.ts";

const TODAY = "2026-11-27";

const draft = (over: Partial<GoalDraft> = {}): GoalDraft => ({
  title: "Renda",
  criterion: "R$ 11 mil líquidos por mês",
  deadline: "2026-12-31",
  longTerm: false,
  ...over,
});

const goal = (id: string, over: Partial<Goal> = {}): Goal => ({ id, ...draft(), completedOn: null, ...over });

const task = (id: string, link: Task["link"] = null): Task => ({
  id,
  text: id,
  priority: false,
  type: "normal",
  doneOn: null,
  link,
});

const state = (over: Partial<AppState> = {}): AppState => ({
  tasks: [],
  goals: [],
  habits: [],
  streak: { length: 0, best: 0, totalCycles: 0, completedDays: 0, lastDay: TODAY },
  showDone: true,
  ...over,
});


test("goalState: em andamento até o prazo (inclusive), não alcançado depois, concluído se marcado", () => {
  assert.equal(goalState(goal("g", { deadline: "2026-12-31" }), TODAY), "active");
  assert.equal(goalState(goal("g", { deadline: TODAY }), TODAY), "active");
  assert.equal(goalState(goal("g", { deadline: "2026-11-26" }), TODAY), "missed");
  assert.equal(goalState(goal("g", { completedOn: "2026-11-20" }), TODAY), "done");
  assert.equal(goalState(goal("g", { deadline: "2026-11-01", completedOn: "2026-11-20" }), TODAY), "done");
});

test("daysLeft: dias até o prazo (0 no dia, negativo depois)", () => {
  assert.equal(daysLeft(goal("g", { deadline: "2026-12-31" }), TODAY), 34);
  assert.equal(daysLeft(goal("g", { deadline: TODAY }), TODAY), 0);
  assert.equal(daysLeft(goal("g", { deadline: "2026-11-25" }), TODAY), -2);
});

test("toggleGoalDone marca com a data de hoje e desmarca", () => {
  let goals = [goal("a"), goal("b")];
  goals = toggleGoalDone(goals, "a", TODAY);
  assert.equal(goals[0].completedOn, TODAY);
  assert.equal(goals[1].completedOn, null);
  goals = toggleGoalDone(goals, "a", TODAY);
  assert.equal(goals[0].completedOn, null);
});


test("só um objetivo pode ser de longo prazo", () => {
  let goals = addGoal([], "a", draft({ longTerm: true }));
  goals = addGoal(goals, "b", draft({ longTerm: true }));
  assert.deepEqual(
    goals.map((g) => g.longTerm),
    [false, true],
  );
  goals = updateGoal(goals, "a", draft({ title: "Novo", longTerm: true }));
  assert.deepEqual(
    goals.map((g) => [g.title, g.longTerm]),
    [
      ["Novo", true],
      ["Renda", false],
    ],
  );
  assert.equal(longTermGoal(goals)?.id, "a");
  goals = updateGoal(goals, "a", draft({ longTerm: false }));
  assert.equal(longTermGoal(goals), null);
});

test("addGoal limpa espaços e começa em andamento; updateGoal mantém a conclusão", () => {
  let goals = addGoal([], "a", draft({ title: "  Renda  ", criterion: " 11 mil " }));
  assert.deepEqual(goals[0], {
    id: "a",
    title: "Renda",
    criterion: "11 mil",
    deadline: "2026-12-31",
    longTerm: false,
    completedOn: null,
  });
  goals = toggleGoalDone(goals, "a", TODAY);
  goals = updateGoal(goals, "a", draft({ title: "Renda 2" }));
  assert.equal(goals[0].completedOn, TODAY);
});

test("validação de objetivo: título, critério e prazo obrigatórios", () => {
  assert.ok(isValidGoalDraft(draft()));
  assert.ok(!isValidGoalDraft(draft({ title: "  " })));
  assert.ok(!isValidGoalDraft(draft({ criterion: "" })));
  assert.ok(!isValidGoalDraft(draft({ deadline: "" })));
  assert.ok(!isValidGoalDraft(draft({ deadline: "2026-02-30" })));
});


test("hábitos: nome obrigatório, objetivo opcional", () => {
  assert.ok(isValidHabitDraft({ name: "Programar", goalId: null }));
  assert.ok(!isValidHabitDraft({ name: " ", goalId: null }));
  let habits = addHabit([], "h", { name: " Desenhar ", goalId: null });
  assert.deepEqual(habits, [{ id: "h", name: "Desenhar", goalId: null }]);
  habits = updateHabit(habits, "h", { name: "Ler", goalId: "g" });
  assert.deepEqual(habits, [{ id: "h", name: "Ler", goalId: "g" }]);
});


test("remover objetivo: tarefas e hábitos vinculados continuam, sem vínculo", () => {
  const s = state({
    goals: [goal("g1"), goal("g2")],
    habits: [
      { id: "h1", name: "Programar", goalId: "g1" },
      { id: "h2", name: "Ler", goalId: "g2" },
    ],
    tasks: [
      task("t1", { type: "goal", id: "g1" }),
      task("t2", { type: "goal", id: "g2" }),
      task("t3", { type: "habit", id: "h1" }),
    ],
  });
  const next = removeGoal(s, "g1");
  assert.deepEqual(
    next.goals.map((g) => g.id),
    ["g2"],
  );
  assert.deepEqual(next.habits, [
    { id: "h1", name: "Programar", goalId: null },
    { id: "h2", name: "Ler", goalId: "g2" },
  ]);
  assert.deepEqual(
    next.tasks.map((t) => [t.id, t.link]),
    [
      ["t1", null],
      ["t2", { type: "goal", id: "g2" }],
      ["t3", { type: "habit", id: "h1" }],
    ],
  );
});

test("remover hábito: tarefas vinculadas continuam, sem vínculo", () => {
  const s = state({
    habits: [{ id: "h1", name: "Programar", goalId: null } satisfies Habit],
    tasks: [task("t1", { type: "habit", id: "h1" }), task("t2")],
  });
  const next = removeHabit(s, "h1");
  assert.deepEqual(next.habits, []);
  assert.deepEqual(
    next.tasks.map((t) => [t.id, t.link]),
    [
      ["t1", null],
      ["t2", null],
    ],
  );
});

test("linkOptions: objetivos em andamento e todos os hábitos, mantendo o vínculo atual", () => {
  const goals = [
    goal("ativo", { title: "Ativo" }),
    goal("feito", { title: "Feito", completedOn: TODAY }),
    goal("vencido", { title: "Vencido", deadline: "2026-01-01" }),
  ];
  const habits: Habit[] = [{ id: "h", name: "Ler", goalId: null }];
  assert.deepEqual(linkOptions(goals, habits, TODAY, null), {
    goals: [{ id: "ativo", label: "Ativo" }],
    habits: [{ id: "h", label: "Ler" }],
  });
  assert.deepEqual(
    linkOptions(goals, habits, TODAY, { type: "goal", id: "feito" }).goals.map((g) => g.id),
    ["ativo", "feito"],
  );
});

test("linkLabel: nome do objetivo ou hábito vinculado", () => {
  const goals = [goal("g", { title: "Renda" })];
  const habits: Habit[] = [{ id: "h", name: "Ler", goalId: null }];
  assert.equal(linkLabel({ type: "goal", id: "g" }, goals, habits), "Renda");
  assert.equal(linkLabel({ type: "habit", id: "h" }, goals, habits), "Ler");
  assert.equal(linkLabel({ type: "habit", id: "x" }, goals, habits), null);
  assert.equal(linkLabel(null, goals, habits), null);
});

test("encodeLink/decodeLink: ida e volta, e valores inválidos viram sem vínculo", () => {
  assert.equal(encodeLink(null), "");
  assert.equal(encodeLink({ type: "goal", id: "a:b" }), "goal:a:b");
  assert.deepEqual(decodeLink("goal:a:b"), { type: "goal", id: "a:b" });
  assert.deepEqual(decodeLink("habit:h"), { type: "habit", id: "h" });
  assert.equal(decodeLink(""), null);
  assert.equal(decodeLink("outro:x"), null);
  assert.equal(decodeLink("goal:"), null);
});
