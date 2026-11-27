import type { DayKey } from "./dates.ts";

/** Dia da semana como em Date#getDay: 0 = domingo … 6 = sábado. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Schedule =
  /** Fica até ser concluída; removida na virada do dia em que foi concluída. */
  | { type: "normal" }
  /** Aparece só nos dias da semana escolhidos; volta pendente no próximo dia em que se aplica. */
  | { type: "periodic"; weekdays: Weekday[] }
  /** Aparece a cada `every` dias a partir de `start` (calendário fixo); se comporta como periódica. */
  | { type: "interval"; every: number; start: DayKey }
  /** Aparece a partir de `date` e depois se comporta como normal. */
  | { type: "scheduled"; date: DayKey };

export type TaskType = Schedule["type"];

/** O que o usuário preenche ao criar ou editar uma tarefa. */
export type TaskDraft = {
  text: string;
  /** Prioritárias do dia decidem se o dia conta para a sequência. */
  priority: boolean;
} & Schedule;

export type Task = {
  id: string;
  /** Data (local) em que foi concluída; feita hoje se doneOn === hoje. */
  doneOn: DayKey | null;
} & TaskDraft;

export type Streak = {
  /** Dias seguidos concluídos, confirmados até o fim do dia anterior a lastDay. */
  length: number;
  /** Maior sequência já alcançada, em dias (confirmada). */
  best: number;
  /** Total acumulado de ciclos de 7 dias completos (não zera ao quebrar a sequência). */
  totalCycles: number;
  /** Total de dias feitos (confirmados). */
  completedDays: number;
  /** Primeiro dia ainda não avaliado (o dia em que o app foi aberto por último). */
  lastDay: DayKey;
};

export type AppState = {
  tasks: Task[];
  streak: Streak;
  /** Olhinho: mostra as concluídas riscadas (true) ou as esconde (false). */
  showDone: boolean;
};
