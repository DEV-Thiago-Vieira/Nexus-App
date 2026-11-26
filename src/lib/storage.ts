import type { DayKey } from "./dates.ts";
import type { AppState, Task } from "./types.ts";

const KEY = "nexus:v1";

export function initialState(today: DayKey): AppState {
  return {
    tasks: [],
    streak: { length: 0, best: 0, totalCycles: 0, completedDays: 0, lastDay: today },
    showDone: true,
  };
}

function isTask(value: unknown): value is Task {
  const t = value as Task;
  return (
    typeof t === "object" &&
    t !== null &&
    typeof t.id === "string" &&
    typeof t.text === "string" &&
    (t.type === "normal" || t.type === "recurring") &&
    (t.doneOn === null || typeof t.doneOn === "string")
  );
}

export function parseState(raw: string | null, today: DayKey): AppState {
  if (!raw) return initialState(today);
  try {
    const data = JSON.parse(raw) as AppState;
    const s = data.streak;
    if (
      !Array.isArray(data.tasks) ||
      !data.tasks.every(isTask) ||
      typeof s?.length !== "number" ||
      typeof s.totalCycles !== "number" ||
      typeof s.lastDay !== "string"
    ) {
      return initialState(today);
    }
    // Campos adicionados depois da primeira versão: preenche com valores seguros.
    const num = (v: unknown, fallback: number) => (typeof v === "number" && v >= 0 ? v : fallback);
    return {
      tasks: data.tasks,
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
