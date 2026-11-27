import type { DayKey } from "./dates.ts";
import { addDays, daysBetween, isDayKey } from "./dates.ts";
import { appliesOn, isRepeating } from "./schedule.ts";
import type { AppState, Completion, Goal, GoalDraft, GoalProgress, GoalState, Task } from "./types.ts";

const later = (a: DayKey, b: DayKey) => (a > b ? a : b);

export function goalProgress(goal: Goal, tasks: Task[], completions: Completion[]): GoalProgress {
  const inPeriod = (day: DayKey) => day >= goal.start && day <= goal.end;
  let done = 0;
  let total = 0;
  const once = new Set<string>();
  const onceDone = new Set<string>();

  for (const c of completions) {
    if (c.once && c.goalId === goal.id && inPeriod(c.day)) {
      once.add(c.taskId);
      onceDone.add(c.taskId);
    }
  }

  for (const task of tasks) {
    if (task.goalId !== goal.id) continue;
    if (!isRepeating(task)) {
      if (task.type !== "scheduled" || task.date <= goal.end) once.add(task.id);
      continue;
    }
    const doneDays = new Set(completions.filter((c) => c.taskId === task.id).map((c) => c.day));
    for (let day = later(goal.start, task.linkedOn ?? goal.start); day <= goal.end; day = addDays(day, 1)) {
      if (!appliesOn(task, day)) continue;
      total += 1;
      if (doneDays.has(day)) done += 1;
    }
  }

  return { done: done + onceDone.size, total: total + once.size };
}

export function goalState(goal: Goal, tasks: Task[], completions: Completion[], today: DayKey): GoalState {
  const progress = goalProgress(goal, tasks, completions);
  if (goal.completedOn !== null || (progress.total > 0 && progress.done === progress.total)) return "done";
  return today > goal.end ? "missed" : "active";
}

export function progressLabel({ done, total }: GoalProgress): string {
  if (total === 0) return "Nenhuma tarefa vinculada";
  return `${done} de ${total} (${Math.round((done / total) * 100)}%)`;
}

export function timeLabel(goal: Goal, today: DayKey): string {
  if (today < goal.start) {
    const days = daysBetween(today, goal.start);
    return days === 1 ? "Começa amanhã" : `Começa em ${days} dias`;
  }
  if (today > goal.end) return "Encerrado";
  const days = daysBetween(today, goal.end);
  if (days === 0) return "Termina hoje";
  return days === 1 ? "Falta 1 dia" : `Faltam ${days} dias`;
}

export function statusLabel(state: GoalState, goal: Goal, today: DayKey): string {
  if (state === "done") return "Concluído";
  if (state === "missed") return "Não alcançado";
  return timeLabel(goal, today);
}

export function isValidGoalDraft(draft: GoalDraft): boolean {
  return draft.title.trim() !== "" && isDayKey(draft.start) && isDayKey(draft.end) && draft.start <= draft.end;
}

const cleanGoal = (draft: GoalDraft): GoalDraft => ({
  title: draft.title.trim(),
  start: draft.start,
  end: draft.end,
  featured: draft.featured,
});

const keepSingleFeatured = (goals: Goal[], id: string): Goal[] =>
  goals.find((g) => g.id === id)?.featured
    ? goals.map((g) => (g.id !== id && g.featured ? { ...g, featured: false } : g))
    : goals;

export function addGoal(goals: Goal[], id: string, draft: GoalDraft): Goal[] {
  return keepSingleFeatured([...goals, { id, completedOn: null, ...cleanGoal(draft) }], id);
}

export function updateGoal(goals: Goal[], id: string, draft: GoalDraft): Goal[] {
  return keepSingleFeatured(
    goals.map((g) => (g.id === id ? { ...g, ...cleanGoal(draft) } : g)),
    id,
  );
}

export function toggleGoalDone(goals: Goal[], id: string, today: DayKey): Goal[] {
  return goals.map((g) => (g.id === id ? { ...g, completedOn: g.completedOn === null ? today : null } : g));
}

export function featuredGoal(goals: Goal[]): Goal | null {
  return goals.find((g) => g.featured) ?? null;
}

export function removeGoal(state: AppState, id: string): AppState {
  return {
    ...state,
    goals: state.goals.filter((g) => g.id !== id),
    tasks: state.tasks.map((t) => (t.goalId === id ? { ...t, goalId: null, linkedOn: null } : t)),
  };
}

export function linkableGoals(
  goals: Goal[],
  tasks: Task[],
  completions: Completion[],
  today: DayKey,
  currentId: string | null,
): Goal[] {
  return goals.filter((g) => g.id === currentId || goalState(g, tasks, completions, today) === "active");
}

const DEFAULT_QUOTE = "Fazer o mínimo todos os dias é melhor que fazer muito e não acabar nada.";

export type SuccessMessage = { type: "goal"; title: string; progress: string; time: string } | { type: "quote"; text: string };

export function successMessage(goals: Goal[], tasks: Task[], completions: Completion[], today: DayKey): SuccessMessage {
  const goal = featuredGoal(goals);
  if (!goal) return { type: "quote", text: DEFAULT_QUOTE };
  return {
    type: "goal",
    title: goal.title,
    progress: progressLabel(goalProgress(goal, tasks, completions)),
    time: statusLabel(goalState(goal, tasks, completions, today), goal, today),
  };
}
