"use client";

import { useState } from "react";
import type { DayKey } from "@/lib/dates.ts";
import { isValidSchedule } from "@/lib/schedule.ts";
import type { TaskDraft } from "@/lib/types.ts";
import { RepeatIcon, TargetIcon } from "./icons";
import { GoalSelect, useCanLink } from "./link-field";
import { askReminderPermission } from "./reminders";
import { KIND_LABELS, PriorityToggle, ScheduleFields, useScheduleDraft, type Kind } from "./schedule-fields";

const NEXT_KIND: Record<Kind, Kind> = { normal: "periodic", periodic: "scheduled", scheduled: "normal" };

/** Barra fixa no rodapé para adicionar tarefas, ao alcance do polegar. */
export function TaskForm({ today, onAdd }: { today: DayKey; onAdd: (draft: TaskDraft) => void }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState(false);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const canLink = useCanLink();
  const draft = useScheduleDraft(today);
  const { kind } = draft;
  const canSubmit = text.trim() !== "" && isValidSchedule(draft.schedule);

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200/60 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg">
      <form
        className="mx-auto flex w-full max-w-xl flex-col gap-2.5 px-3 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          const value = text.trim();
          if (!value || !isValidSchedule(draft.schedule)) return;
          if (draft.time) askReminderPermission();
          onAdd({ text: value, priority, goalId, ...draft.schedule });
          setText("");
        }}
      >
        {kind !== "normal" && (
          <div className="px-1 motion-safe:animate-rise">
            <ScheduleFields draft={draft} />
          </div>
        )}
        {canLink && (linkOpen || goalId) && (
          <div className="flex px-1 motion-safe:animate-rise">
            <GoalSelect value={goalId} onChange={setGoalId} className="max-w-full" />
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex h-12 min-w-0 flex-1 items-center rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/80 transition focus-within:ring-2 focus-within:ring-stone-300">
            <button
              type="button"
              aria-label={`Tipo: ${KIND_LABELS[kind].toLowerCase()}. Alternar tipo.`}
              onClick={() => draft.setKind(NEXT_KIND[kind])}
              className="ml-1.5 flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-stone-100 px-3 text-[13px] font-semibold text-stone-600 transition hover:bg-stone-200/70"
            >
              {kind === "periodic" && <RepeatIcon className="size-3.5" />}
              {KIND_LABELS[kind]}
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nova tarefa…"
              aria-label="Nova tarefa"
              // "enter" mantém o teclado aberto no Android ("done" o fecha), para adicionar várias seguidas.
              enterKeyHint="enter"
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-base text-stone-900 outline-none placeholder:text-stone-400"
            />
            {canLink && (
              <button
                type="button"
                aria-label="Vincular a um objetivo"
                aria-expanded={linkOpen || goalId !== null}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => setLinkOpen((o) => !o)}
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition ${
                  goalId ? "bg-stone-100 text-stone-700" : "text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                }`}
              >
                <TargetIcon className="size-4" />
              </button>
            )}
            <PriorityToggle value={priority} onChange={setPriority} className="mr-1.5 size-9" />
          </div>
          <button
            type="submit"
            // Não tira o foco do campo ao tocar: o teclado do celular continua aberto.
            onPointerDown={(e) => e.preventDefault()}
            disabled={!canSubmit}
            aria-label="Adicionar tarefa"
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-white shadow-sm transition hover:bg-stone-700 active:scale-95 disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M8 3v10M3 8h10" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
