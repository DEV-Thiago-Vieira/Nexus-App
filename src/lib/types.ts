import type { DayKey } from "./dates.ts";

export type TaskType = "normal" | "recurring";

export type Task = {
  id: string;
  text: string;
  type: TaskType;
  /**
   * Dia em que foi concluída (feita hoje se doneOn === hoje).
   * Recorrente: volta a ficar pendente no dia seguinte.
   * Normal: fica riscada até o fim do dia e é removida na virada.
   */
  doneOn: DayKey | null;
};

export type Streak = {
  /** Dias seguidos concluídos, confirmados até o fim do dia anterior a lastDay. */
  length: number;
  /** Maior sequência já alcançada, em dias (confirmada). */
  best: number;
  /** Total acumulado de ciclos de 7 dias completos (não zera ao quebrar a sequência). */
  totalCycles: number;
  /** Total de dias com todas as recorrentes concluídas (confirmados). */
  completedDays: number;
  /** Último dia em que o app esteve aberto; ainda não avaliado. */
  lastDay: DayKey;
};

export type AppState = {
  tasks: Task[];
  streak: Streak;
  /** Olhinho: mostra as concluídas riscadas (true) ou as esconde (false). */
  showDone: boolean;
};
