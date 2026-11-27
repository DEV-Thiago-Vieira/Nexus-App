"use client";

import { useState, type KeyboardEvent } from "react";
import { fromDayKey, type DayKey } from "@/lib/dates.ts";
import { isValidSchedule, scheduledState } from "@/lib/schedule.ts";
import { scheduleOf } from "@/lib/tasks.ts";
import type { Task, TaskDraft } from "@/lib/types.ts";
import { ClockIcon, FlagIcon } from "./icons";
import { GoalBadge, GoalSelect, useCanLink } from "./link-field";
import { askReminderPermission } from "./reminders";
import { PriorityToggle, ScheduleFields, useScheduleDraft } from "./schedule-fields";
import { DragHandle, useSortableRow } from "./sortable-list";
import { TypeToggle } from "./type-toggle";
import { ConfirmRemove, FormActions, ItemActions, ROW, RoundCheckbox } from "./ui";

type Props = {
  task: Task;
  today: DayKey;
  done: boolean;
  onToggle: () => void;
  onUpdate: (draft: TaskDraft) => void;
  onRemove: () => void;
};

type Mode = "view" | "edit" | "confirm";


export function TaskItem({ task, today, done, onToggle, onUpdate, onRemove }: Props) {
  const [mode, setMode] = useState<Mode>("view");
  const [text, setText] = useState(task.text);
  const [priority, setPriority] = useState(task.priority);
  const [goalId, setGoalId] = useState(task.goalId);
  const canLink = useCanLink();
  const draft = useScheduleDraft(today, scheduleOf(task));
  const canSave = text.trim() !== "" && isValidSchedule(draft.schedule);

  const { setNodeRef, setActivatorNodeRef, attributes, listeners, isDragging, style, dragClass } = useSortableRow(task.id, mode !== "view");
  const cancelOnEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") setMode("view");
  };

  if (mode === "edit") {
    return (
      <li ref={setNodeRef} style={style} className={`${ROW} px-3.5 py-3.5`}>
        <form
          className="flex flex-col gap-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            const value = text.trim();
            if (!value || !isValidSchedule(draft.schedule)) return;
            if (draft.time) askReminderPermission();
            onUpdate({ text: value, priority, goalId, ...draft.schedule });
            setMode("view");
          }}
          onKeyDown={cancelOnEscape}
        >
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            enterKeyHint="done"
            aria-label="Texto da tarefa"
            className="h-12 rounded-xl bg-stone-50 px-3.5 text-base text-stone-900 ring-1 ring-stone-200 outline-none focus:ring-2 focus:ring-stone-300"
          />
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-64 flex-1 sm:max-w-80">
              <TypeToggle value={draft.kind} onChange={draft.setKind} />
            </div>
            <PriorityToggle value={priority} onChange={setPriority} withLabel className="h-11 px-3" />
          </div>
          <ScheduleFields draft={draft} />
          {(canLink || goalId) && <GoalSelect value={goalId} onChange={setGoalId} className="self-start" />}
          <FormActions valid={canSave} onCancel={() => setMode("view")} />
        </form>
      </li>
    );
  }

  if (mode === "confirm") {
    return (
      <ConfirmRemove
        ref={setNodeRef}
        style={style}
        name={task.text}
        detail="Ela deixa de contar para a sequência."
        onCancel={() => setMode("view")}
        onConfirm={onRemove}
      />
    );
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`${ROW} group relative flex min-h-15 items-center py-1.5 pr-1 pl-1.5 ${dragClass}`}
    >
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 self-stretch">
        <RoundCheckbox checked={done} onChange={onToggle} label={`Concluir "${task.text}"`} />
        <span className="min-w-0 flex-1 py-2">
          <span
            className={`block text-base leading-6 break-words transition-colors duration-300 ${
              done ? "text-stone-400 line-through decoration-stone-300 decoration-2" : "text-stone-800"
            }`}
          >
            {task.text}
          </span>
          {(task.priority || task.type !== "normal" || task.goalId) && (
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px]">
              {task.priority && (
                <span className="flex items-center gap-1 font-medium text-red-600">
                  <FlagIcon className="size-3.5" /> Prioritária
                </span>
              )}
              {task.type !== "normal" && task.time && (
                <span className="flex items-center gap-1 text-stone-500 tabular-nums">
                  <ClockIcon className="size-3.5" /> {task.time}
                </span>
              )}
              {task.type === "scheduled" && <ScheduledDate date={task.date} today={today} done={done} />}
              <GoalBadge goalId={task.goalId} />
            </span>
          )}
        </span>
      </label>

      <ItemActions
        name={task.text}
        onEdit={() => {
          setText(task.text);
          setPriority(task.priority);
          setGoalId(task.goalId);
          draft.reset(scheduleOf(task));
          setMode("edit");
        }}
        onRemove={() => (task.priority ? setMode("confirm") : onRemove())}
      />

      <DragHandle
        name={task.text}
        setActivatorNodeRef={setActivatorNodeRef}
        attributes={attributes}
        listeners={listeners}
        isDragging={isDragging}
      />
    </li>
  );
}

/** Dia da agendada; destaca em vermelho se a data já passou e ela não foi concluída. */
function ScheduledDate({ date, today, done }: { date: DayKey; today: DayKey; done: boolean }) {
  const state = scheduledState(date, today);
  const label =
    state === "today"
      ? "Hoje"
      : fromDayKey(date).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
  const overdue = state === "overdue" && !done;
  return (
    <span className={overdue ? "font-semibold text-red-600" : "text-stone-400"}>
      {overdue ? `Atrasada · ${label}` : label}
    </span>
  );
}
