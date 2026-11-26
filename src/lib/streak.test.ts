import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays } from "./dates.ts";
import { dayStatus, progressView, rollover } from "./streak.ts";
import type { AppState, Task } from "./types.ts";

const D0 = "2026-01-01";

const rec = (id: string, doneOn: string | null = null): Task => ({
  id,
  text: id,
  type: "recurring",
  doneOn,
});
const normal = (id: string): Task => ({ id, text: id, type: "normal", doneOn: null });

const start = (tasks: Task[] = [rec("a")]): AppState => ({
  tasks,
  streak: { length: 0, best: 0, totalCycles: 0, completedDays: 0, lastDay: D0 },
  showDone: true,
});

/** Conclui todas as recorrentes no dia atual (lastDay). */
const completeToday = (s: AppState): AppState => ({
  ...s,
  tasks: s.tasks.map((t) => (t.type === "recurring" ? { ...t, doneOn: s.streak.lastDay } : t)),
});

const nextDay = (s: AppState) => rollover(s, addDays(s.streak.lastDay, 1));

const view = (s: AppState) => {
  const v = progressView(s.streak, s.tasks, s.streak.lastDay);
  return `${v.current}/${v.goal} c${v.totalCycles}`;
};

const stats = (s: AppState) => {
  const v = progressView(s.streak, s.tasks, s.streak.lastDay);
  return {
    atual: [v.streakDays, v.streakCycles],
    melhor: [v.bestDays, v.bestCycles],
    total: v.totalCycles,
    dias: v.completedDays,
  };
};

const days = (s: AppState, n: number) => {
  for (let i = 0; i < n; i++) s = nextDay(completeToday(s));
  return s;
};

test("estatísticas: atual zera ao falhar, melhor e totais ficam", () => {
  let s = days(start(), 12); // 12 dias: 3 de aquecimento + 9 (1 ciclo)
  assert.deepEqual(stats(s), { atual: [12, 1], melhor: [12, 1], total: 1, dias: 12 });

  s = nextDay(s); // falhou
  assert.deepEqual(stats(s), { atual: [0, 0], melhor: [12, 1], total: 1, dias: 12 });

  s = days(s, 10); // nova sequência de 10 dias: completa mais um ciclo
  assert.deepEqual(stats(s), { atual: [10, 1], melhor: [12, 1], total: 2, dias: 22 });

  s = completeToday(s); // hoje feito entra na prévia
  assert.deepEqual(stats(s), { atual: [11, 1], melhor: [12, 1], total: 2, dias: 23 });
  s = days(s, 7); // 17 dias passa a ser o recorde (2 ciclos)
  assert.deepEqual(stats(s), { atual: [17, 2], melhor: [17, 2], total: 3, dias: 29 });
});

test("rollover remove normais concluídas em dias anteriores", () => {
  let s = start([rec("a"), normal("n1"), { ...normal("n2"), doneOn: D0 }]);
  assert.equal(rollover(s, D0), s); // mesmo dia: continua riscada
  s = nextDay(s);
  assert.deepEqual(
    s.tasks.map((t) => t.id),
    ["a", "n1"],
  );
});

test("dayStatus: só recorrentes contam", () => {
  assert.equal(dayStatus([], D0), "neutral");
  assert.equal(dayStatus([normal("n")], D0), "neutral");
  assert.equal(dayStatus([rec("a", D0), normal("n")], D0), "done");
  assert.equal(dayStatus([rec("a", D0), rec("b")], D0), "failed");
  assert.equal(dayStatus([rec("a", "2025-12-31")], D0), "failed");
});

test("sequência: 3 dias de aquecimento e depois ciclos de 7", () => {
  let s = start();
  const seen: string[] = [view(s)];
  for (let day = 0; day < 12; day++) {
    s = completeToday(s);
    seen.push(view(s));
    s = nextDay(s);
    seen.push(view(s));
  }
  assert.deepEqual(seen, [
    "0/3 c0",
    "1/3 c0", "1/3 c0",
    "2/3 c0", "2/3 c0",
    "3/3 c0", "0/7 c0",
    "1/7 c0", "1/7 c0",
    "2/7 c0", "2/7 c0",
    "3/7 c0", "3/7 c0",
    "4/7 c0", "4/7 c0",
    "5/7 c0", "5/7 c0",
    "6/7 c0", "6/7 c0",
    "7/7 c1", "0/7 c1",
    "1/7 c1", "1/7 c1",
    "2/7 c1", "2/7 c1",
  ]);
});

test("ciclos se repetem indefinidamente", () => {
  let s = start();
  for (let day = 0; day < 3 + 7 * 3; day++) s = nextDay(completeToday(s));
  assert.equal(view(s), "0/7 c3");
});

test("dia não concluído zera a sequência mas mantém o total de ciclos", () => {
  let s = start();
  for (let day = 0; day < 12; day++) s = nextDay(completeToday(s));
  assert.equal(view(s), "2/7 c1");
  s = nextDay(s); // dia sem concluir
  assert.equal(view(s), "0/3 c1");
});

test("conclusão parcial conta como falha", () => {
  let s = start([rec("a"), rec("b")]);
  s = nextDay(completeToday(s));
  s = { ...s, tasks: [rec("a", s.streak.lastDay), rec("b")] };
  s = nextDay(s);
  assert.equal(view(s), "0/3 c0");
});

test("dias sem recorrentes não contam nem quebram", () => {
  let s = nextDay(completeToday(start()));
  assert.equal(view(s), "1/3 c0");
  s = { ...s, tasks: [normal("n")] };
  s = nextDay(s);
  s = rollover(s, addDays(s.streak.lastDay, 5)); // dias pulados sem recorrentes
  assert.equal(view(s), "1/3 c0");
  s = { ...s, tasks: [rec("a")] };
  s = nextDay(completeToday(s));
  assert.equal(view(s), "2/3 c0");
});

test("dias pulados com recorrentes quebram a sequência", () => {
  let s = start();
  s = completeToday(s);
  s = rollover(s, addDays(D0, 2)); // D0 feito, D0+1 sem o app aberto
  assert.equal(s.streak.length, 0);
  assert.equal(view(s), "0/3 c0");
});

test("marcar e desmarcar hoje altera a prévia", () => {
  let s = start();
  s = completeToday(s);
  assert.equal(view(s), "1/3 c0");
  s = { ...s, tasks: [rec("a")] };
  assert.equal(view(s), "0/3 c0");
});

test("rollover no mesmo dia (ou anterior) não muda nada", () => {
  const s = completeToday(start());
  assert.equal(rollover(s, D0), s);
  assert.equal(rollover(s, "2025-12-31"), s);
});
