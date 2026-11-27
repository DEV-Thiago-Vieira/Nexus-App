"use client";

import { useState } from "react";
import { addDays, fromDayKey, type DayKey } from "@/lib/dates.ts";
import { goalProgress, goalState, isValidGoalDraft, progressLabel, statusLabel } from "@/lib/goals.ts";
import type { Completion, Goal, GoalDraft, Task } from "@/lib/types.ts";
import { TargetIcon } from "./icons";
import { CARD, ConfirmRemove, FormActions, ItemActions, RoundCheckbox, SMALL_INPUT } from "./ui";

type Props = {
  goals: Goal[];
  tasks: Task[];
  completions: Completion[];
  today: DayKey;
  onAdd: (draft: GoalDraft) => void;
  onUpdate: (id: string, draft: GoalDraft) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
};

const FORM_ROW = "px-3.5 py-3";
const INPUT =
  "h-11 w-full rounded-xl bg-stone-50 px-3.5 text-base text-stone-900 ring-1 ring-stone-200 outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-stone-300";

const shortDate = (day: DayKey, withYear: boolean) =>
  fromDayKey(day).toLocaleDateString("pt-BR", { day: "numeric", month: "short", ...(withYear && { year: "numeric" }) });

const period = (start: DayKey, end: DayKey) =>
  `${shortDate(start, start.slice(0, 4) !== end.slice(0, 4))} → ${shortDate(end, true)}`;

export function GoalsPanel({ goals, tasks, completions, today, onAdd, onUpdate, onToggle, onRemove }: Props) {
  const [adding, setAdding] = useState(false);
  const sorted = [...goals].sort((a, b) => Number(b.featured) - Number(a.featured));

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex min-h-9 items-center justify-between gap-3 px-1.5">
        <h2 className="text-[15px] font-bold tracking-tight text-stone-800">Objetivos</h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="h-9 rounded-xl px-3 text-[13px] font-semibold text-stone-600 transition hover:bg-stone-200/50 hover:text-stone-900"
          >
            + Novo
          </button>
        )}
      </div>
      {goals.length === 0 && !adding ? (
        <p className="px-1.5 text-sm leading-relaxed text-stone-400">
          Um objetivo tem início e fim. Vincule tarefas a ele: o progresso avança quando elas são feitas nos dias
          previstos.
        </p>
      ) : (
        <ul className={CARD}>
          {adding && (
            <li className={FORM_ROW}>
              <GoalForm
                initial={{ title: "", start: today, end: addDays(today, 30), featured: false }}
                onCancel={() => setAdding(false)}
                onSave={(draft) => {
                  onAdd(draft);
                  setAdding(false);
                }}
              />
            </li>
          )}
          {sorted.map((goal) => (
            <GoalItem
              key={goal.id}
              goal={goal}
              tasks={tasks}
              completions={completions}
              today={today}
              onToggle={() => onToggle(goal.id)}
              onUpdate={(draft) => onUpdate(goal.id, draft)}
              onRemove={() => onRemove(goal.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function GoalItem({
  goal,
  tasks,
  completions,
  today,
  onToggle,
  onUpdate,
  onRemove,
}: {
  goal: Goal;
  tasks: Task[];
  completions: Completion[];
  today: DayKey;
  onToggle: () => void;
  onUpdate: (draft: GoalDraft) => void;
  onRemove: () => void;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm">("view");
  const progress = goalProgress(goal, tasks, completions);
  const state = goalState(goal, tasks, completions, today);
  const done = state === "done";
  const percent = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;

  if (mode === "edit") {
    return (
      <li className={FORM_ROW}>
        <GoalForm
          initial={goal}
          onCancel={() => setMode("view")}
          onSave={(draft) => {
            onUpdate(draft);
            setMode("view");
          }}
        />
      </li>
    );
  }

  if (mode === "confirm") {
    return (
      <ConfirmRemove
        name={goal.title}
        detail="As tarefas vinculadas continuam, sem vínculo."
        onCancel={() => setMode("view")}
        onConfirm={onRemove}
      />
    );
  }

  return (
    <li className="group flex items-start py-1.5 pr-1 pl-1.5">
      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-1.5">
        <RoundCheckbox checked={done} onChange={onToggle} label={`Marcar "${goal.title}" como concluído`} />
        <span className="min-w-0 flex-1 py-2.5 pr-2">
          <span
            className={`block text-base leading-6 break-words ${
              done ? "text-stone-400 line-through decoration-stone-300 decoration-2" : "text-stone-800"
            }`}
          >
            {goal.title}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px]">
            {goal.featured && (
              <span className="flex items-center gap-1 font-medium text-red-600">
                <TargetIcon className="size-3.5" /> Destaque
              </span>
            )}
            <span className={state === "missed" ? "font-semibold text-red-600" : done ? "text-emerald-600" : "text-stone-500"}>
              {statusLabel(state, goal, today)}
            </span>
            <span className="text-stone-400">
              {period(goal.start, goal.end)}
            </span>
          </span>
          <span className="mt-2 flex items-center gap-2.5">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-200" aria-hidden>
              <span
                className={`block h-full rounded-full transition-[width] duration-500 ${done ? "bg-emerald-500" : "bg-red-500"}`}
                style={{ width: `${percent}%` }}
              />
            </span>
            <span className="shrink-0 text-[13px] text-stone-500 tabular-nums">{progressLabel(progress)}</span>
          </span>
        </span>
      </label>
      <ItemActions name={goal.title} onEdit={() => setMode("edit")} onRemove={() => setMode("confirm")} />
    </li>
  );
}

function GoalForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: GoalDraft;
  onCancel: () => void;
  onSave: (draft: GoalDraft) => void;
}) {
  const [draft, setDraft] = useState<GoalDraft>({
    title: initial.title,
    start: initial.start,
    end: initial.end,
    featured: initial.featured,
  });
  const set = (patch: Partial<GoalDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const valid = isValidGoalDraft(draft);

  return (
    <form
      className="flex flex-col gap-2.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave(draft);
      }}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
    >
      <input
        autoFocus
        value={draft.title}
        onChange={(e) => set({ title: e.target.value })}
        placeholder="Objetivo"
        aria-label="Título do objetivo"
        className={INPUT}
      />
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-stone-500">
        <label className="flex items-center gap-2">
          Início
          <input
            type="date"
            required
            value={draft.start}
            onChange={(e) => set({ start: e.target.value })}
            className={SMALL_INPUT}
          />
        </label>
        <label className="flex items-center gap-2">
          Fim
          <input
            type="date"
            required
            min={draft.start}
            value={draft.end}
            onChange={(e) => set({ end: e.target.value })}
            className={SMALL_INPUT}
          />
        </label>
      </div>
      <button
        type="button"
        aria-pressed={draft.featured}
        onClick={() => set({ featured: !draft.featured })}
        className={`flex h-9 items-center gap-1.5 self-start rounded-xl px-3 text-[13px] font-semibold transition ${
          draft.featured ? "bg-red-50 text-red-600" : "text-stone-400 hover:bg-stone-100 hover:text-stone-700"
        }`}
      >
        <TargetIcon className="size-4" /> Destaque
      </button>
      <FormActions valid={valid} onCancel={onCancel} />
    </form>
  );
}
