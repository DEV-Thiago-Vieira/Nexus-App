import type { DayKey } from "./dates.ts";
import { daysBetween, isDayKey } from "./dates.ts";
import type { AppState, Goal, GoalDraft, GoalState, Habit, HabitDraft, TaskLink } from "./types.ts";

export function goalState(goal: Goal, today: DayKey): GoalState {
  if (goal.completedOn !== null) return "done";
  return goal.deadline < today ? "missed" : "active";
}

export function daysLeft(goal: Goal, today: DayKey): number {
  return daysBetween(today, goal.deadline);
}

export function isValidGoalDraft(draft: GoalDraft): boolean {
  return draft.title.trim() !== "" && draft.criterion.trim() !== "" && isDayKey(draft.deadline);
}

const cleanGoal = (draft: GoalDraft): GoalDraft => ({
  title: draft.title.trim(),
  criterion: draft.criterion.trim(),
  deadline: draft.deadline,
  longTerm: draft.longTerm,
});

const keepSingleLongTerm = (goals: Goal[], id: string): Goal[] =>
  goals.find((g) => g.id === id)?.longTerm
    ? goals.map((g) => (g.id !== id && g.longTerm ? { ...g, longTerm: false } : g))
    : goals;

export function addGoal(goals: Goal[], id: string, draft: GoalDraft): Goal[] {
  return keepSingleLongTerm([...goals, { id, completedOn: null, ...cleanGoal(draft) }], id);
}

export function updateGoal(goals: Goal[], id: string, draft: GoalDraft): Goal[] {
  return keepSingleLongTerm(
    goals.map((g) => (g.id === id ? { ...g, ...cleanGoal(draft) } : g)),
    id,
  );
}

export function toggleGoalDone(goals: Goal[], id: string, today: DayKey): Goal[] {
  return goals.map((g) => (g.id === id ? { ...g, completedOn: g.completedOn === null ? today : null } : g));
}

export function longTermGoal(goals: Goal[]): Goal | null {
  return goals.find((g) => g.longTerm) ?? null;
}

export function isValidHabitDraft(draft: HabitDraft): boolean {
  return draft.name.trim() !== "";
}

export function addHabit(habits: Habit[], id: string, draft: HabitDraft): Habit[] {
  return [...habits, { id, name: draft.name.trim(), goalId: draft.goalId }];
}

export function updateHabit(habits: Habit[], id: string, draft: HabitDraft): Habit[] {
  return habits.map((h) => (h.id === id ? { id, name: draft.name.trim(), goalId: draft.goalId } : h));
}

const unlink = (state: AppState, type: TaskLink["type"], id: string): AppState["tasks"] =>
  state.tasks.map((t) => (t.link?.type === type && t.link.id === id ? { ...t, link: null } : t));

export function removeGoal(state: AppState, id: string): AppState {
  return {
    ...state,
    goals: state.goals.filter((g) => g.id !== id),
    habits: state.habits.map((h) => (h.goalId === id ? { ...h, goalId: null } : h)),
    tasks: unlink(state, "goal", id),
  };
}

export function removeHabit(state: AppState, id: string): AppState {
  return {
    ...state,
    habits: state.habits.filter((h) => h.id !== id),
    tasks: unlink(state, "habit", id),
  };
}

type LinkOption = { id: string; label: string };

export function linkOptions(
  goals: Goal[],
  habits: Habit[],
  today: DayKey,
  current: TaskLink | null,
): { goals: LinkOption[]; habits: LinkOption[] } {
  const isCurrent = (g: Goal) => current?.type === "goal" && current.id === g.id;
  return {
    goals: goals
      .filter((g) => goalState(g, today) === "active" || isCurrent(g))
      .map((g) => ({ id: g.id, label: g.title })),
    habits: habits.map((h) => ({ id: h.id, label: h.name })),
  };
}

export function linkLabel(link: TaskLink | null, goals: Goal[], habits: Habit[]): string | null {
  if (!link) return null;
  if (link.type === "goal") return goals.find((g) => g.id === link.id)?.title ?? null;
  return habits.find((h) => h.id === link.id)?.name ?? null;
}

export function encodeLink(link: TaskLink | null): string {
  return link ? `${link.type}:${link.id}` : "";
}

export function decodeLink(value: string): TaskLink | null {
  const at = value.indexOf(":");
  const type = value.slice(0, at);
  const id = value.slice(at + 1);
  if (at === -1 || id === "" || (type !== "goal" && type !== "habit")) return null;
  return { type, id };
}

export function deadlineLabel(goal: Goal, today: DayKey): string {
  const state = goalState(goal, today);
  if (state === "done") return "Concluído";
  if (state === "missed") return "Não alcançado";
  const days = daysLeft(goal, today);
  if (days === 0) return "Prazo hoje";
  return days === 1 ? "Falta 1 dia" : `Faltam ${days} dias`;
}

const DEFAULT_QUOTE = "Fazer o mínimo todos os dias é melhor que fazer muito e não acabar nada.";

export type SuccessMessage = { type: "goal"; title: string; detail: string } | { type: "quote"; text: string };

export function successMessage(goals: Goal[], today: DayKey): SuccessMessage {
  const goal = longTermGoal(goals);
  if (!goal) return { type: "quote", text: DEFAULT_QUOTE };
  return { type: "goal", title: goal.title, detail: deadlineLabel(goal, today) };
}
