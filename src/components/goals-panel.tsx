"use client";

import { useState, type ReactNode } from "react";
import { addDays, fromDayKey, type DayKey } from "@/lib/dates.ts";
import { deadlineLabel, goalState, isValidGoalDraft, isValidHabitDraft } from "@/lib/goals.ts";
import type { Goal, GoalDraft, Habit, HabitDraft } from "@/lib/types.ts";
import { CheckIcon, PencilIcon, TargetIcon, TrashIcon } from "./icons";

type Props = {
  goals: Goal[];
  habits: Habit[];
  today: DayKey;
  onAddGoal: (draft: GoalDraft) => void;
  onUpdateGoal: (id: string, draft: GoalDraft) => void;
  onToggleGoal: (id: string) => void;
  onRemoveGoal: (id: string) => void;
  onAddHabit: (draft: HabitDraft) => void;
  onUpdateHabit: (id: string, draft: HabitDraft) => void;
  onRemoveHabit: (id: string) => void;
};

const CARD =
  "divide-y divide-stone-100 rounded-[1.25rem] bg-white shadow-[0_1px_2px_rgb(28_25_23/0.04),0_6px_20px_-6px_rgb(28_25_23/0.08)] ring-1 ring-stone-200/60";
const INPUT =
  "h-11 w-full rounded-xl bg-stone-50 px-3.5 text-base text-stone-900 ring-1 ring-stone-200 outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-stone-300";
const ICON_BUTTON = "flex size-11 shrink-0 items-center justify-center rounded-xl text-stone-400 transition";
const ROW = "px-3.5 py-3";

export function GoalsPanel(props: Props) {
  const { goals, habits, today } = props;
  const [adding, setAdding] = useState<"goal" | "habit" | null>(null);
  const sorted = [...goals].sort((a, b) => Number(b.longTerm) - Number(a.longTerm));

  return (
    <>
      <Section
        title="Objetivos"
        onAdd={adding === "goal" ? undefined : () => setAdding("goal")}
        empty={goals.length === 0 && adding !== "goal" ? "Objetivos têm um critério de conclusão e um prazo." : null}
      >
        {adding === "goal" && (
          <li className={ROW}>
            <GoalForm
              initial={{ title: "", criterion: "", deadline: addDays(today, 30), longTerm: false }}
              onCancel={() => setAdding(null)}
              onSave={(draft) => {
                props.onAddGoal(draft);
                setAdding(null);
              }}
            />
          </li>
        )}
        {sorted.map((goal) => (
          <GoalItem
            key={goal.id}
            goal={goal}
            today={today}
            onToggle={() => props.onToggleGoal(goal.id)}
            onUpdate={(draft) => props.onUpdateGoal(goal.id, draft)}
            onRemove={() => props.onRemoveGoal(goal.id)}
          />
        ))}
      </Section>

      <Section
        title="Hábitos"
        onAdd={adding === "habit" ? undefined : () => setAdding("habit")}
        empty={habits.length === 0 && adding !== "habit" ? "Hábitos são contínuos, como programar, desenhar ou ler." : null}
      >
        {adding === "habit" && (
          <li className={ROW}>
            <HabitForm
              initial={{ name: "", goalId: null }}
              goals={goals}
              onCancel={() => setAdding(null)}
              onSave={(draft) => {
                props.onAddHabit(draft);
                setAdding(null);
              }}
            />
          </li>
        )}
        {habits.map((habit) => (
          <HabitItem
            key={habit.id}
            habit={habit}
            goals={goals}
            onUpdate={(draft) => props.onUpdateHabit(habit.id, draft)}
            onRemove={() => props.onRemoveHabit(habit.id)}
          />
        ))}
      </Section>
    </>
  );
}

function Section({
  title,
  onAdd,
  empty,
  children,
}: {
  title: string;
  onAdd?: () => void;
  empty: string | null;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex min-h-9 items-center justify-between gap-3 px-1.5">
        <h2 className="text-[15px] font-bold tracking-tight text-stone-800">{title}</h2>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="h-9 rounded-xl px-3 text-[13px] font-semibold text-stone-600 transition hover:bg-stone-200/50 hover:text-stone-900"
          >
            + Novo
          </button>
        )}
      </div>
      {empty ? (
        <p className="px-1.5 text-sm text-stone-400">{empty}</p>
      ) : (
        <ul className={CARD}>{children}</ul>
      )}
    </section>
  );
}

function GoalItem({
  goal,
  today,
  onToggle,
  onUpdate,
  onRemove,
}: {
  goal: Goal;
  today: DayKey;
  onToggle: () => void;
  onUpdate: (draft: GoalDraft) => void;
  onRemove: () => void;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm">("view");
  const state = goalState(goal, today);
  const done = state === "done";

  if (mode === "edit") {
    return (
      <li className={ROW}>
        <GoalForm initial={goal} onCancel={() => setMode("view")} onSave={(draft) => { onUpdate(draft); setMode("view"); }} />
      </li>
    );
  }

  if (mode === "confirm") {
    return (
      <ConfirmRemove name={goal.title} detail="As tarefas e hábitos vinculados continuam, sem vínculo." onCancel={() => setMode("view")} onConfirm={onRemove} />
    );
  }

  return (
    <li className="group flex items-start py-1.5 pr-1 pl-1.5">
      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-1.5">
        <span className="relative flex size-11 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            checked={done}
            onChange={onToggle}
            aria-label={`Marcar "${goal.title}" como concluído`}
            className="peer size-6 cursor-pointer appearance-none rounded-full border-2 border-stone-300 transition-colors checked:border-emerald-500 checked:bg-emerald-500 hover:border-emerald-400 motion-safe:checked:animate-pop"
          />
          <CheckIcon className="pointer-events-none absolute size-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
        </span>
        <span className="min-w-0 flex-1 py-2.5">
          <span className={`block text-base leading-6 break-words ${done ? "text-stone-400 line-through decoration-stone-300 decoration-2" : "text-stone-800"}`}>
            {goal.title}
          </span>
          <span className="mt-0.5 block text-[13px] leading-snug break-words text-stone-500">{goal.criterion}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px]">
            {goal.longTerm && (
              <span className="flex items-center gap-1 font-medium text-red-600">
                <TargetIcon className="size-3.5" /> Longo prazo
              </span>
            )}
            <span className={state === "missed" ? "font-semibold text-red-600" : done ? "text-emerald-600" : "text-stone-500"}>
              {deadlineLabel(goal, today)}
            </span>
            <span className="text-stone-400">
              {fromDayKey(goal.deadline).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}
            </span>
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
    criterion: initial.criterion,
    deadline: initial.deadline,
    longTerm: initial.longTerm,
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
      <input autoFocus value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder="Objetivo" aria-label="Título do objetivo" className={INPUT} />
      <input
        value={draft.criterion}
        onChange={(e) => set({ criterion: e.target.value })}
        placeholder="Critério de conclusão (ex.: R$ 11 mil líquidos por mês)"
        aria-label="Critério de conclusão"
        className={INPUT}
      />
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-[13px] text-stone-500">
          Prazo
          <input
            type="date"
            required
            value={draft.deadline}
            onChange={(e) => set({ deadline: e.target.value })}
            className="h-9 rounded-xl bg-white px-3 text-sm text-stone-900 ring-1 ring-stone-200 outline-none focus:ring-2 focus:ring-stone-300"
          />
        </label>
        <button
          type="button"
          aria-pressed={draft.longTerm}
          onClick={() => set({ longTerm: !draft.longTerm })}
          className={`flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold transition ${
            draft.longTerm ? "bg-red-50 text-red-600" : "text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          }`}
        >
          <TargetIcon className="size-4" /> Longo prazo
        </button>
      </div>
      <FormButtons valid={valid} onCancel={onCancel} />
    </form>
  );
}

function HabitItem({
  habit,
  goals,
  onUpdate,
  onRemove,
}: {
  habit: Habit;
  goals: Goal[];
  onUpdate: (draft: HabitDraft) => void;
  onRemove: () => void;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm">("view");
  const goal = goals.find((g) => g.id === habit.goalId);

  if (mode === "edit") {
    return (
      <li className={ROW}>
        <HabitForm initial={habit} goals={goals} onCancel={() => setMode("view")} onSave={(draft) => { onUpdate(draft); setMode("view"); }} />
      </li>
    );
  }

  if (mode === "confirm") {
    return (
      <ConfirmRemove name={habit.name} detail="As tarefas vinculadas continuam, sem vínculo." onCancel={() => setMode("view")} onConfirm={onRemove} />
    );
  }

  return (
    <li className="group flex min-h-15 items-center py-1.5 pr-1 pl-4">
      <span className="min-w-0 flex-1 py-2">
        <span className="block text-base leading-6 break-words text-stone-800">{habit.name}</span>
        {goal && (
          <span className="mt-0.5 flex items-center gap-1 text-[13px] text-stone-400">
            <TargetIcon className="size-3.5 shrink-0" />
            <span className="truncate">{goal.title}</span>
          </span>
        )}
      </span>
      <ItemActions name={habit.name} onEdit={() => setMode("edit")} onRemove={() => setMode("confirm")} />
    </li>
  );
}

function HabitForm({
  initial,
  goals,
  onCancel,
  onSave,
}: {
  initial: HabitDraft;
  goals: Goal[];
  onCancel: () => void;
  onSave: (draft: HabitDraft) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [goalId, setGoalId] = useState(initial.goalId);
  const draft = { name, goalId };
  const valid = isValidHabitDraft(draft);

  return (
    <form
      className="flex flex-col gap-2.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave(draft);
      }}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
    >
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Hábito (ex.: Programar)" aria-label="Nome do hábito" className={INPUT} />
      {goals.length > 0 && (
        <select
          aria-label="Objetivo do hábito"
          value={goalId ?? ""}
          onChange={(e) => setGoalId(e.target.value || null)}
          className="h-9 self-start rounded-xl bg-white px-2.5 text-sm text-stone-900 ring-1 ring-stone-200 outline-none focus:ring-2 focus:ring-stone-300"
        >
          <option value="">Sem objetivo</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
      )}
      <FormButtons valid={valid} onCancel={onCancel} />
    </form>
  );
}

function FormButtons({ valid, onCancel }: { valid: boolean; onCancel: () => void }) {
  return (
    <div className="ml-auto flex gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="h-11 rounded-xl px-4 text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-800"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={!valid}
        className="h-11 rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white hover:bg-stone-700 disabled:bg-stone-200 disabled:text-stone-400"
      >
        Salvar
      </button>
    </div>
  );
}

function ItemActions({ name, onEdit, onRemove }: { name: string; onEdit: () => void; onRemove: () => void }) {
  return (
    <div className="flex shrink-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:opacity-0">
      <button type="button" onClick={onEdit} aria-label={`Editar "${name}"`} className={`${ICON_BUTTON} hover:bg-stone-100 hover:text-stone-700`}>
        <PencilIcon />
      </button>
      <button type="button" onClick={onRemove} aria-label={`Remover "${name}"`} className={`${ICON_BUTTON} hover:bg-red-50 hover:text-red-600`}>
        <TrashIcon />
      </button>
    </div>
  );
}

function ConfirmRemove({
  name,
  detail,
  onCancel,
  onConfirm,
}: {
  name: string;
  detail: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <li
      role="alertdialog"
      aria-label={`Remover "${name}"?`}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
      className="flex min-h-15 flex-wrap items-center gap-x-3 gap-y-2 bg-red-50/60 py-2.5 pr-2.5 pl-4 first:rounded-t-[1.25rem] last:rounded-b-[1.25rem] motion-safe:animate-rise"
    >
      <p className="min-w-0 flex-1 text-[15px] leading-snug text-stone-700">
        Remover <span className="font-semibold break-words text-stone-900">“{name}”</span>?
        <span className="block text-[13px] text-stone-500">{detail}</span>
      </p>
      <div className="ml-auto flex gap-2">
        <button type="button" autoFocus onClick={onCancel} className="h-11 rounded-xl px-4 text-sm font-medium text-stone-600 hover:bg-white">
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} className="h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700">
          Remover
        </button>
      </div>
    </li>
  );
}
