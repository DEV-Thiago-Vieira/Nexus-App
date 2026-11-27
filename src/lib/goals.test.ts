import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_WEEKDAYS } from "./schedule.ts";
import {
  addGoal,
  goalProgress,
  goalState,
  isValidGoalDraft,
  linkableGoals,
  moveGoal,
  featuredGoal,
  progressLabel,
  removeGoal,
  statusLabel,
  successMessage,
  timeLabel,
  toggleGoalDone,
  updateGoal,
} from "./goals.ts";
import type { AppState, Completion, Goal, GoalDraft, Task } from "./types.ts";

const TODAY = "2026-11-27";
const MON = "2026-11-30";

const draft = (over: Partial<GoalDraft> = {}): GoalDraft => ({
  title: "Renda",
  start: "2026-11-01",
  end: "2026-12-31",
  featured: false,
  ...over,
});

const goal = (id: string, over: Partial<Goal> = {}): Goal => ({ id, ...draft(), completedOn: null, ...over });

const task = (id: string, over: Partial<Task> = {}): Task =>
  ({ id, text: id, priority: false, type: "normal", doneOn: null, goalId: null, linkedOn: null, ...over }) as Task;

const done = (taskId: string, day: string, goalId: string | null = "g", once = false): Completion => ({
  taskId,
  goalId,
  day,
  once,
});

const state = (over: Partial<AppState> = {}): AppState => ({
  tasks: [],
  goals: [],
  completions: [],
  streak: { length: 0, best: 0, totalCycles: 0, completedDays: 0, lastDay: TODAY },
  showDone: true,
  ...over,
});

test("goalProgress: periódica conta cada dia em que vale, do vínculo até o fim", () => {
  const g = goal("g", { start: MON, end: "2026-12-13" });
  const mwf = task("t", { type: "periodic", weekdays: [1, 3, 5], goalId: "g", linkedOn: TODAY } as Partial<Task>);
  const completions = [done("t", MON), done("t", "2026-12-02"), done("t", "2026-12-01")];
  assert.deepEqual(goalProgress(g, [mwf], completions), { done: 2, total: 6 });
});

test("goalProgress: vínculo feito depois do início conta só a partir do vínculo", () => {
  const g = goal("g", { start: "2026-11-01", end: "2026-11-30" });
  const daily = task("t", { type: "periodic", weekdays: ALL_WEEKDAYS, goalId: "g", linkedOn: TODAY } as Partial<Task>);
  assert.deepEqual(goalProgress(g, [daily], [done("t", TODAY)]), { done: 1, total: 4 });
});

test("goalProgress: a cada X dias segue o calendário da tarefa dentro do período", () => {
  const g = goal("g", { start: MON, end: "2026-12-09" });
  const every3 = task("t", { type: "interval", every: 3, start: "2026-11-29", goalId: "g", linkedOn: MON } as Partial<Task>);
  assert.deepEqual(goalProgress(g, [every3], [done("t", "2026-12-02")]), { done: 1, total: 3 });
});

test("goalProgress: normal e agendada valem uma ocorrência, mesmo depois de removidas da lista", () => {
  const g = goal("g");
  const pending = task("n", { goalId: "g", linkedOn: TODAY });
  const scheduled = task("s", { type: "scheduled", date: "2026-12-10", goalId: "g", linkedOn: TODAY } as Partial<Task>);
  const gone = done("sumiu", "2026-11-20", "g", true);
  assert.deepEqual(goalProgress(g, [pending, scheduled], [gone]), { done: 1, total: 3 });
});

test("goalProgress: ignora tarefas de outros objetivos e conclusões fora do período", () => {
  const g = goal("g", { start: MON, end: "2026-12-06" });
  const mine = task("a", { type: "periodic", weekdays: [1], goalId: "g", linkedOn: MON } as Partial<Task>);
  const other = task("b", { type: "periodic", weekdays: [1], goalId: "x", linkedOn: MON } as Partial<Task>);
  const completions = [done("a", "2026-12-07"), done("b", MON, "x"), done("x1", MON, "x", true), done("late", "2027-01-01", "g", true)];
  assert.deepEqual(goalProgress(g, [mine, other], completions), { done: 0, total: 1 });
});

test("goalState: concluído quando tudo foi feito ou marcado; não alcançado depois do fim", () => {
  const g = goal("g", { start: MON, end: "2026-12-06" });
  const t = task("t", { type: "periodic", weekdays: [1], goalId: "g", linkedOn: MON } as Partial<Task>);
  assert.equal(goalState(g, [t], [], TODAY), "active");
  assert.equal(goalState(g, [t], [done("t", MON)], TODAY), "done");
  assert.equal(goalState(g, [t], [], "2026-12-07"), "missed");
  assert.equal(goalState(g, [t], [], "2026-12-06"), "active");
  assert.equal(goalState({ ...g, completedOn: TODAY }, [t], [], "2027-01-01"), "done");
  assert.equal(goalState(g, [], [], "2027-01-01"), "missed");
});

test("progressLabel e timeLabel", () => {
  assert.equal(progressLabel({ done: 5, total: 13 }), "5 de 13 (38%)");
  assert.equal(progressLabel({ done: 0, total: 0 }), "Nenhuma tarefa vinculada");
  assert.equal(timeLabel(goal("g", { start: "2026-12-01" }), TODAY), "Começa em 4 dias");
  assert.equal(timeLabel(goal("g", { start: "2026-11-28" }), TODAY), "Começa amanhã");
  assert.equal(timeLabel(goal("g", { end: "2026-12-31" }), TODAY), "Faltam 34 dias");
  assert.equal(timeLabel(goal("g", { end: "2026-11-28" }), TODAY), "Falta 1 dia");
  assert.equal(timeLabel(goal("g", { end: TODAY }), TODAY), "Termina hoje");
  assert.equal(timeLabel(goal("g", { end: "2026-11-20" }), TODAY), "Encerrado");
});

test("toggleGoalDone marca com a data de hoje e desmarca", () => {
  let goals = [goal("a"), goal("b")];
  goals = toggleGoalDone(goals, "a", TODAY);
  assert.equal(goals[0].completedOn, TODAY);
  assert.equal(goals[1].completedOn, null);
  goals = toggleGoalDone(goals, "a", TODAY);
  assert.equal(goals[0].completedOn, null);
});

test("só um objetivo pode estar em destaque", () => {
  let goals = addGoal([], "a", draft({ featured: true }));
  goals = addGoal(goals, "b", draft({ featured: true }));
  assert.deepEqual(
    goals.map((g) => g.featured),
    [false, true],
  );
  goals = updateGoal(goals, "a", draft({ title: "Novo", featured: true }));
  assert.deepEqual(
    goals.map((g) => [g.title, g.featured]),
    [
      ["Novo", true],
      ["Renda", false],
    ],
  );
  assert.equal(featuredGoal(goals)?.id, "a");
  goals = updateGoal(goals, "a", draft({ featured: false }));
  assert.equal(featuredGoal(goals), null);
});

test("addGoal limpa espaços; updateGoal estende o fim e mantém a conclusão", () => {
  let goals = addGoal([], "a", draft({ title: "  Renda  " }));
  assert.deepEqual(goals[0], {
    id: "a",
    title: "Renda",
    start: "2026-11-01",
    end: "2026-12-31",
    featured: false,
    completedOn: null,
  });
  goals = toggleGoalDone(goals, "a", TODAY);
  goals = updateGoal(goals, "a", draft({ end: "2027-03-31" }));
  assert.equal(goals[0].end, "2027-03-31");
  assert.equal(goals[0].completedOn, TODAY);
});

test("validação: título, início e fim obrigatórios, fim não antes do início", () => {
  assert.ok(isValidGoalDraft(draft()));
  assert.ok(isValidGoalDraft(draft({ start: TODAY, end: TODAY })));
  assert.ok(!isValidGoalDraft(draft({ title: "  " })));
  assert.ok(!isValidGoalDraft(draft({ start: "" })));
  assert.ok(!isValidGoalDraft(draft({ end: "2026-02-30" })));
  assert.ok(!isValidGoalDraft(draft({ start: "2026-12-02", end: "2026-12-01" })));
});

test("remover objetivo: tarefas vinculadas continuam, sem vínculo", () => {
  const s = state({
    goals: [goal("g1"), goal("g2")],
    tasks: [task("t1", { goalId: "g1", linkedOn: TODAY }), task("t2", { goalId: "g2", linkedOn: TODAY })],
  });
  const next = removeGoal(s, "g1");
  assert.deepEqual(
    next.goals.map((g) => g.id),
    ["g2"],
  );
  assert.deepEqual(
    next.tasks.map((t) => [t.id, t.goalId, t.linkedOn]),
    [
      ["t1", null, null],
      ["t2", "g2", TODAY],
    ],
  );
});

test("linkableGoals: objetivos em andamento, mantendo o já vinculado", () => {
  const goals = [goal("ativo"), goal("feito", { completedOn: TODAY }), goal("vencido", { end: "2026-01-01" })];
  assert.deepEqual(
    linkableGoals(goals, [], [], TODAY, null).map((g) => g.id),
    ["ativo"],
  );
  assert.deepEqual(
    linkableGoals(goals, [], [], TODAY, "feito").map((g) => g.id),
    ["ativo", "feito"],
  );
});

test("successMessage: objetivo em destaque com progresso e tempo, ou a frase padrão", () => {
  const g = goal("g", { title: "Casa", start: MON, end: "2026-12-07", featured: true });
  const t = task("t", { type: "periodic", weekdays: [1], goalId: "g", linkedOn: MON } as Partial<Task>);
  assert.deepEqual(successMessage([goal("a"), g], [t], [], TODAY), {
    type: "goal",
    title: "Casa",
    progress: "0 de 2 (0%)",
    time: "Começa em 3 dias",
  });
  assert.deepEqual(successMessage([goal("a")], [], [], TODAY), {
    type: "quote",
    text: "Fazer o mínimo todos os dias é melhor que fazer muito e não acabar nada.",
  });
});

test("statusLabel: concluído, não alcançado ou o tempo restante", () => {
  const g = goal("g", { end: "2026-12-31" });
  assert.equal(statusLabel("done", g, TODAY), "Concluído");
  assert.equal(statusLabel("missed", g, TODAY), "Não alcançado");
  assert.equal(statusLabel("active", g, TODAY), "Faltam 34 dias");
});

test("moveGoal reordena os objetivos", () => {
  const goals = [goal("a"), goal("b", { featured: true }), goal("c")];
  assert.deepEqual(
    moveGoal(goals, "c", "a").map((g) => g.id),
    ["c", "a", "b"],
  );
});
