import type { DayKey } from "./dates.ts";
import { isDayKey } from "./dates.ts";
import { ALL_WEEKDAYS, isValidInterval } from "./schedule.ts";
import type { AppState, Goal, Habit, Task, TaskLink, Weekday } from "./types.ts";

const KEY = "nexus:v1";

export function initialState(today: DayKey): AppState {
  return {
    tasks: [],
    goals: [],
    habits: [],
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
  if (t.link !== undefined && t.link !== null && !isTaskLink(t.link)) return null;
  const link = t.link ? { type: t.link.type, id: t.link.id } : null;
  const base = { id: t.id, text: t.text, doneOn: t.doneOn as DayKey | null, link };

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

function isTaskLink(v: unknown): v is TaskLink {
  const l = v as Record<string, unknown>;
  return typeof l === "object" && l !== null && (l.type === "goal" || l.type === "habit") && typeof l.id === "string";
}

const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

export function migrateGoal(value: unknown): Goal | null {
  if (typeof value !== "object" || value === null) return null;
  const g = value as Record<string, unknown>;
  if (
    typeof g.id !== "string" ||
    !nonEmpty(g.title) ||
    !nonEmpty(g.criterion) ||
    !isDayKey(g.deadline) ||
    typeof g.longTerm !== "boolean" ||
    (g.completedOn !== null && !isDayKey(g.completedOn))
  ) {
    return null;
  }
  return {
    id: g.id,
    title: g.title,
    criterion: g.criterion,
    deadline: g.deadline,
    longTerm: g.longTerm,
    completedOn: g.completedOn as DayKey | null,
  };
}

export function migrateHabit(value: unknown): Habit | null {
  if (typeof value !== "object" || value === null) return null;
  const h = value as Record<string, unknown>;
  if (typeof h.id !== "string" || !nonEmpty(h.name) || (h.goalId !== null && typeof h.goalId !== "string")) return null;
  return { id: h.id, name: h.name, goalId: h.goalId };
}

function parseList<T>(value: unknown, parse: (v: unknown) => T | null): T[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  const items = value.map(parse);
  return items.every((x) => x !== null) ? (items as T[]) : null;
}

function sanitize(tasks: Task[], goals: Goal[], habits: Habit[]) {
  const firstLongTerm = goals.find((g) => g.longTerm)?.id;
  const cleanGoals = goals.map((g) => (g.longTerm && g.id !== firstLongTerm ? { ...g, longTerm: false } : g));
  const goalIds = new Set(goals.map((g) => g.id));
  const habitIds = new Set(habits.map((h) => h.id));
  const exists = (l: TaskLink) => (l.type === "goal" ? goalIds : habitIds).has(l.id);
  return {
    goals: cleanGoals,
    habits: habits.map((h) => (h.goalId !== null && !goalIds.has(h.goalId) ? { ...h, goalId: null } : h)),
    tasks: tasks.map((t) => (t.link && !exists(t.link) ? { ...t, link: null } : t)),
  };
}

export function parseState(raw: string | null, today: DayKey): AppState {
  if (!raw) return initialState(today);
  try {
    const data = JSON.parse(raw) as Partial<AppState>;
    const s = data.streak;
    const tasks = Array.isArray(data.tasks) ? parseList(data.tasks, migrateTask) : null;
    const goals = parseList(data.goals, migrateGoal);
    const habits = parseList(data.habits, migrateHabit);
    if (
      !tasks ||
      !goals ||
      !habits ||
      typeof s?.length !== "number" ||
      typeof s.totalCycles !== "number" ||
      !isDayKey(s.lastDay)
    ) {
      return initialState(today);
    }
    // Campos adicionados depois da primeira versão: preenche com valores seguros.
    const num = (v: unknown, fallback: number) => (typeof v === "number" && v >= 0 ? v : fallback);
    return {
      ...sanitize(tasks, goals, habits),
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
