import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays } from "./dates.ts";
import { ALL_WEEKDAYS } from "./schedule.ts";
import { dayStatus, progressView, rollover } from "./streak.ts";
import type { AppState, Task, Weekday } from "./types.ts";

const D0 = "2026-01-01"; // quinta-feira
const THU: Weekday = 4;

/** Periódica (prioritária por padrão, como as que formam a sequência). */
const per = (
  id: string,
  doneOn: string | null = null,
  weekdays: Weekday[] = ALL_WEEKDAYS,
  priority = true,
): Task => ({ id, text: id, priority, type: "periodic", weekdays, doneOn });
const normal = (id: string, doneOn: string | null = null, priority = false): Task => ({
  id,
  text: id,
  priority,
  type: "normal",
  doneOn,
});
const sched = (id: string, date: string, doneOn: string | null = null, priority = false): Task => ({
  id,
  text: id,
  priority,
  type: "scheduled",
  date,
  doneOn,
});
const every = (id: string, n: number, start: string, doneOn: string | null = null, priority = true): Task => ({
  id,
  text: id,
  priority,
  type: "interval",
  every: n,
  start,
  doneOn,
});

const start = (tasks: Task[] = [per("a")]): AppState => ({
  tasks,
  streak: { length: 0, best: 0, totalCycles: 0, completedDays: 0, lastDay: D0 },
  showDone: true,
});

/** Conclui todas as prioritárias no dia atual (lastDay). */
const completeToday = (s: AppState): AppState => ({
  ...s,
  tasks: s.tasks.map((t) => (t.priority ? { ...t, doneOn: s.streak.lastDay } : t)),
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

// --- Regra do "dia feito" ---

test("dia com prioritárias: feito quando todas as que se aplicam estão concluídas", () => {
  assert.equal(dayStatus([per("a", D0), per("b", D0)], D0), "done");
  assert.equal(dayStatus([per("a", D0), per("b")], D0), "failed");
  assert.equal(dayStatus([per("a", "2025-12-31")], D0), "failed");
  // Prioritária que não se aplica hoje (só segunda) não conta.
  assert.equal(dayStatus([per("a", D0, [THU]), per("b", null, [1])], D0), "done");
  // Não prioritária concluída não salva um dia com prioritária pendente.
  assert.equal(dayStatus([per("a"), normal("n", D0)], D0), "failed");
  // Não prioritárias pendentes não atrapalham.
  assert.equal(dayStatus([per("a", D0), per("b", null, ALL_WEEKDAYS, false), normal("n")], D0), "done");
});

test("qualquer tipo pode ser prioritário", () => {
  assert.equal(dayStatus([normal("n", null, true)], D0), "failed");
  assert.equal(dayStatus([normal("n", D0, true)], D0), "done");
  // Agendada prioritária vale a partir da data, inclusive atrasada.
  assert.equal(dayStatus([sched("s", addDays(D0, 1), null, true), normal("n", D0)], D0), "done");
  assert.equal(dayStatus([sched("s", addDays(D0, -2), null, true), normal("n", D0)], D0), "failed");
  // A cada 2 dias a partir de D0: vale em D0, não em D0+1.
  assert.equal(dayStatus([every("e", 2, D0), normal("n", addDays(D0, 1))], addDays(D0, 1)), "done");
  assert.equal(dayStatus([every("e", 2, D0), normal("n", addDays(D0, 2))], addDays(D0, 2)), "failed");
});

test("dia sem prioritárias: feito se ao menos uma tarefa foi concluída nele", () => {
  assert.equal(dayStatus([normal("n", D0), normal("m")], D0), "done");
  assert.equal(dayStatus([sched("s", D0, D0)], D0), "done");
  assert.equal(dayStatus([per("a", D0, ALL_WEEKDAYS, false)], D0), "done");
  // Só prioritárias de outros dias: vale a regra das demais.
  assert.equal(dayStatus([per("a", null, [1]), normal("n", D0)], D0), "done");

  let s = start([normal("n")]);
  s = { ...s, tasks: [normal("n", D0)] };
  assert.equal(view(s), "1/3 c0"); // prévia de hoje
  s = nextDay(s);
  assert.equal(view(s), "1/3 c0");
  assert.equal(s.streak.length, 1);
});

test("dia sem nada feito zera a sequência", () => {
  assert.equal(dayStatus([], D0), "failed");
  assert.equal(dayStatus([normal("n")], D0), "failed");
  assert.equal(dayStatus([normal("n", "2025-12-31")], D0), "failed");

  let s = days(start(), 2);
  assert.equal(view(s), "2/3 c0");
  s = { ...s, tasks: [normal("n")] }; // sem prioritárias e nada concluído
  s = nextDay(s);
  assert.equal(view(s), "0/3 c0");

  assert.equal(nextDay({ ...days(start(), 2), tasks: [] }).streak.length, 0); // sem nenhuma tarefa também zera
});

test("vários dias sem abrir o app: avalia cada dia e zera nos dias não feitos", () => {
  let s = days(start(), 4);
  assert.equal(s.streak.length, 4);
  s = completeToday(s); // último dia aberto: feito
  s = rollover(s, addDays(s.streak.lastDay, 4)); // 3 dias sem abrir
  assert.equal(s.streak.length, 0);
  assert.equal(s.streak.best, 5); // o último dia aberto contou antes de zerar
  assert.equal(s.streak.completedDays, 5);
  assert.equal(view(s), "0/3 c0");

  // Mesmo só com prioritárias de outros dias, os dias pulados não têm nada concluído.
  s = start([per("a", null, [1]), normal("n", D0)]);
  s = rollover(s, addDays(D0, 3));
  assert.equal(s.streak.length, 0);
  assert.equal(s.streak.completedDays, 1);
  assert.equal(s.streak.lastDay, addDays(D0, 3));
});

test("periódica de dias específicos: só os dias em que se aplica pedem conclusão", () => {
  // Quinta e sexta; D0 é quinta. Sábado sem prioritária: basta concluir uma tarefa.
  let s = start([per("a", null, [4, 5])]);
  s = nextDay(completeToday(s)); // quinta feita
  s = nextDay(completeToday(s)); // sexta feita
  assert.equal(s.streak.length, 2);
  s = { ...s, tasks: [...s.tasks, normal("n", s.streak.lastDay)] }; // sábado: normal feita
  s = nextDay(s);
  assert.equal(s.streak.length, 3);
  assert.deepEqual(
    s.tasks.map((t) => t.id),
    ["a"],
  );
});

test("a cada X dias: calendário fixo; se não fizer, o dia zera e ela volta no próximo previsto", () => {
  let s = start([every("e", 3, D0), normal("n")]);
  s = nextDay(completeToday(s)); // D0: feita
  assert.equal(s.streak.length, 1);
  s = { ...s, tasks: s.tasks.map((t) => (t.id === "n" ? { ...t, doneOn: s.streak.lastDay } : t)) };
  s = nextDay(s); // D0+1: não se aplica, normal concluída basta
  assert.equal(s.streak.length, 2);
  assert.deepEqual(s.tasks.map((t) => t.id), ["e"]); // a periódica fica
  s = { ...s, tasks: [...s.tasks, normal("m", s.streak.lastDay)] };
  s = nextDay(s); // D0+2
  assert.equal(s.streak.length, 3);
  s = nextDay(s); // D0+3: aplicável e não feita
  assert.equal(s.streak.length, 0);
  s = rollover(s, addDays(D0, 6)); // sem abrir até D0+6, próxima ocorrência
  assert.equal(s.streak.lastDay, addDays(D0, 6));
  assert.equal(dayStatus(s.tasks, s.streak.lastDay), "failed"); // pendente de novo
});

// --- Comportamento já existente ---

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

test("rollover remove normais e agendadas concluídas em dias anteriores", () => {
  let s = start([
    per("a", D0),
    normal("n1"),
    normal("n2", D0),
    sched("s1", D0, D0),
    sched("s2", addDays(D0, 5)),
  ]);
  assert.equal(rollover(s, D0), s); // mesmo dia: continua riscada
  s = nextDay(s);
  assert.deepEqual(
    s.tasks.map((t) => t.id),
    ["a", "n1", "s2"],
  );
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
  const s = days(start(), 3 + 7 * 3);
  assert.equal(view(s), "0/7 c3");
});

test("dia não concluído zera a sequência mas mantém o total de ciclos", () => {
  let s = days(start(), 12);
  assert.equal(view(s), "2/7 c1");
  s = nextDay(s); // dia sem concluir
  assert.equal(view(s), "0/3 c1");
});

test("conclusão parcial conta como falha", () => {
  let s = start([per("a"), per("b")]);
  s = nextDay(completeToday(s));
  s = { ...s, tasks: [per("a", s.streak.lastDay), per("b")] };
  s = nextDay(s);
  assert.equal(view(s), "0/3 c0");
});

test("marcar e desmarcar hoje altera a prévia", () => {
  let s = start();
  s = completeToday(s);
  assert.equal(view(s), "1/3 c0");
  s = { ...s, tasks: [per("a")] };
  assert.equal(view(s), "0/3 c0");
});

test("rollover no mesmo dia (ou anterior) não muda nada", () => {
  const s = completeToday(start());
  assert.equal(rollover(s, D0), s);
  assert.equal(rollover(s, "2025-12-31"), s);
});
