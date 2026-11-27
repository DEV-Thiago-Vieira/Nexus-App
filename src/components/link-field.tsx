"use client";

import { createContext, useContext } from "react";
import type { DayKey } from "@/lib/dates.ts";
import { decodeLink, encodeLink, linkLabel, linkOptions } from "@/lib/goals.ts";
import type { Goal, Habit, TaskLink } from "@/lib/types.ts";
import { RepeatIcon, TargetIcon } from "./icons";

type Links = { goals: Goal[]; habits: Habit[]; today: DayKey };

const LinksContext = createContext<Links>({ goals: [], habits: [], today: "" });

export const LinksProvider = LinksContext.Provider;

export function useLinks() {
  return useContext(LinksContext);
}

export function LinkSelect({
  value,
  onChange,
  className = "",
}: {
  value: TaskLink | null;
  onChange: (link: TaskLink | null) => void;
  className?: string;
}) {
  const { goals, habits, today } = useLinks();
  const options = linkOptions(goals, habits, today, value);

  return (
    <select
      aria-label="Vincular a um objetivo ou hábito"
      value={encodeLink(value)}
      onChange={(e) => onChange(decodeLink(e.target.value))}
      className={`h-9 min-w-0 rounded-xl bg-white px-2.5 text-sm text-stone-900 ring-1 ring-stone-200 outline-none focus:ring-2 focus:ring-stone-300 ${className}`}
    >
      <option value="">Sem vínculo</option>
      {options.goals.length > 0 && (
        <optgroup label="Objetivos">
          {options.goals.map((o) => (
            <option key={o.id} value={encodeLink({ type: "goal", id: o.id })}>
              {o.label}
            </option>
          ))}
        </optgroup>
      )}
      {options.habits.length > 0 && (
        <optgroup label="Hábitos">
          {options.habits.map((o) => (
            <option key={o.id} value={encodeLink({ type: "habit", id: o.id })}>
              {o.label}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

export function hasLinkTargets({ goals, habits }: Links) {
  return goals.length > 0 || habits.length > 0;
}

export function LinkBadge({ link }: { link: TaskLink | null }) {
  const { goals, habits } = useLinks();
  const label = linkLabel(link, goals, habits);
  if (!link || !label) return null;
  const Icon = link.type === "goal" ? TargetIcon : RepeatIcon;
  return (
    <span className="flex min-w-0 items-center gap-1 text-stone-400">
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}
