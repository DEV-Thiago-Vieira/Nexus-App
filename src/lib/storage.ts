import type { DayKey } from "./dates.ts";
import { isDayKey } from "./dates.ts";
import { ALL_WEEKDAYS, isValidInterval } from "./schedule.ts";
import type { AppState, Task, Weekday } from "./types.ts";

const KEY = "nexus:v1";

export function initialState(today: DayKey): AppState {
  return {
    tasks: [],
    streak: { length: 0, best: 0, totalCycles: 0, completedDays: 0, lastDay: today },
    showDone: true,
  };
}

const isWeekday = (v: unknown): v is Weekday => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 6;

/**
 * Valida uma tarefa salva e a converte para o formato atual.
 * - v1.0: `recurring` (todo dia) vira `periodic` com todos os dias marcados.
 * - Sem `priority` (antes da prioridade existir): periódicas eram as que valiam para a
 *   sequência, então viram prioritárias; normais e agendadas não.
 * Retorna null se o valor for inválido.
 */
export function migrateTask(value: unknown): Task | null {
  if (typeof value !== "object" || value === null) return null;
  const t = value as Record<string, unknown>;
  if (typeof t.id !== "string" || typeof t.text !== "string") return null;
  if (t.doneOn !== null && !isDayKey(t.doneOn)) return null;
  if (t.priority !== undefined && typeof t.priority !== "boolean") return null;
  const priority = (wasRepeating: boolean) => (typeof t.priority === "boolean" ? t.priority : wasRepeating);
  const base = { id: t.id, text: t.text, doneOn: t.doneOn as DayKey | null };

  switch (t.type) {
    case "normal":
      return { ...base, priority: priority(false), type: "normal" };
    case "recurring":
      return { ...base, priority: true, type: "periodic", weekdays: [...ALL_WEEKDAYS] };
    case "periodic": {
      const days = t.weekdays;
      if (!Array.isArray(days) || days.length === 0 || !days.every(isWeekday)) return null;
      return { ...base, priority: priority(true), type: "periodic", weekdays: [...new Set(days)].sort((a, b) => a - b) };
    }
    case "interval":
      return isValidInterval(t.every) && isDayKey(t.start)
        ? { ...base, priority: priority(true), type: "interval", every: t.every, start: t.start }
        : null;
    case "scheduled":
      return isDayKey(t.date) ? { ...base, priority: priority(false), type: "scheduled", date: t.date } : null;
    default:
      return null;
  }
}

export function parseState(raw: string | null, today: DayKey): AppState {
  if (!raw) return initialState(today);
  try {
    const data = JSON.parse(raw) as Partial<AppState>;
    const s = data.streak;
    const tasks = Array.isArray(data.tasks) ? data.tasks.map(migrateTask) : null;
    if (
      !tasks ||
      !tasks.every((t) => t !== null) ||
      typeof s?.length !== "number" ||
      typeof s.totalCycles !== "number" ||
      !isDayKey(s.lastDay)
    ) {
      return initialState(today);
    }
    // Campos adicionados depois da primeira versão: preenche com valores seguros.
    const num = (v: unknown, fallback: number) => (typeof v === "number" && v >= 0 ? v : fallback);
    return {
      tasks: tasks as Task[],
      streak: {
        length: s.length,
        best: Math.max(num(s.best, 0), s.length),
        totalCycles: s.totalCycles,
        completedDays: num(s.completedDays, s.length),
        lastDay: s.lastDay,
      },
      showDone: typeof data.showDone === "boolean" ? data.showDone : true,
    };
  } catch {
    return initialState(today);
  }
}

export function loadState(today: DayKey): AppState {
  try {
    return parseState(localStorage.getItem(KEY), today);
  } catch {
    return initialState(today);
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // armazenamento indisponível ou cheio: ignora
  }
}
