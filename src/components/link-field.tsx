"use client";

import { createContext, useContext } from "react";
import type { DayKey } from "@/lib/dates.ts";
import { linkableGoals } from "@/lib/goals.ts";
import type { Completion, Goal, Task } from "@/lib/types.ts";
import { TargetIcon } from "./icons";

type Links = { goals: Goal[]; tasks: Task[]; completions: Completion[]; today: DayKey };

const LinksContext = createContext<Links>({ goals: [], tasks: [], completions: [], today: "" });

export const LinksProvider = LinksContext.Provider;

export function useCanLink() {
  return useContext(LinksContext).goals.length > 0;
}

export function GoalSelect({
  value,
  onChange,
  className = "",
}: {
  value: string | null;
  onChange: (goalId: string | null) => void;
  className?: string;
}) {
  const { goals, tasks, completions, today } = useContext(LinksContext);
  const options = linkableGoals(goals, tasks, completions, today, value);

  return (
    <select
      aria-label="Vincular a um objetivo"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className={`h-9 min-w-0 rounded-xl bg-white px-2.5 text-sm text-stone-900 ring-1 ring-stone-200 outline-none focus:ring-2 focus:ring-stone-300 ${className}`}
    >
      <option value="">Sem objetivo</option>
      {options.map((g) => (
        <option key={g.id} value={g.id}>
          {g.title}
        </option>
      ))}
    </select>
  );
}

export function GoalBadge({ goalId }: { goalId: string | null }) {
  const { goals } = useContext(LinksContext);
  const goal = goals.find((g) => g.id === goalId);
  if (!goal) return null;
  return (
    <span className="flex min-w-0 items-center gap-1 text-stone-400">
      <TargetIcon className="size-3.5 shrink-0" />
      <span className="truncate">{goal.title}</span>
    </span>
  );
}
