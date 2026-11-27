"use client";

import { useState } from "react";
import { type DayKey, addDays } from "@/lib/dates.ts";
import { ALL_WEEKDAYS, MAX_INTERVAL, MIN_INTERVAL, toggleWeekday } from "@/lib/schedule.ts";
import type { Schedule, TaskType, Weekday } from "@/lib/types.ts";
import { FlagIcon } from "./icons";
import { SMALL_INPUT } from "./ui";

const WEEKDAYS: { short: string; name: string }[] = [
  { short: "D", name: "domingo" },
  { short: "S", name: "segunda" },
  { short: "T", name: "terça" },
  { short: "Q", name: "quarta" },
  { short: "Q", name: "quinta" },
  { short: "S", name: "sexta" },
  { short: "S", name: "sábado" },
];

/** Tipos como o usuário os vê: "a cada X dias" é um modo da periódica. */
export type Kind = "normal" | "periodic" | "scheduled";
export type PeriodicMode = "weekdays" | "interval";

export const KIND_LABELS: Record<Kind, string> = {
  normal: "Normal",
  periodic: "Periódica",
  scheduled: "Agendada",
};

export const kindOf = (type: TaskType): Kind => (type === "interval" ? "periodic" : type);

/** Rascunho do agendamento em um formulário; guarda dias, intervalo e data mesmo ao trocar de tipo. */
export function useScheduleDraft(today: DayKey, initial: Schedule = { type: "normal" }) {
  const [kind, setKind] = useState<Kind>(kindOf(initial.type));
  const [mode, setMode] = useState<PeriodicMode>(initial.type === "interval" ? "interval" : "weekdays");
  const [weekdays, setWeekdays] = useState<Weekday[]>(
    initial.type === "periodic" ? initial.weekdays : [...ALL_WEEKDAYS],
  );
  const [every, setEvery] = useState(initial.type === "interval" ? initial.every : MIN_INTERVAL);
  const [start, setStart] = useState<DayKey>(initial.type === "interval" ? initial.start : today);
  const [date, setDate] = useState<DayKey>(initial.type === "scheduled" ? initial.date : addDays(today, 1));
  const [time, setTime] = useState(initial.type === "normal" ? "" : (initial.time ?? ""));
  const withTime = time ? { time } : {};

  const schedule: Schedule =
    kind === "scheduled"
      ? { type: "scheduled", date, ...withTime }
      : kind === "periodic"
        ? mode === "interval"
          ? { type: "interval", every, start, ...withTime }
          : { type: "periodic", weekdays, ...withTime }
        : { type: "normal" };

  /** Volta ao agendamento salvo (ao abrir a edição de novo). */
  const reset = (s: Schedule) => {
    setKind(kindOf(s.type));
    setTime(s.type === "normal" ? "" : (s.time ?? ""));
    if (s.type === "periodic") {
      setMode("weekdays");
      setWeekdays(s.weekdays);
    }
    if (s.type === "interval") {
      setMode("interval");
      setEvery(s.every);
      setStart(s.start);
    }
    if (s.type === "scheduled") setDate(s.date);
  };

  return { schedule, kind, mode, time, setKind, setMode, setWeekdays, setEvery, setStart, setDate, setTime, reset };
}

export type ScheduleDraft = ReturnType<typeof useScheduleDraft>;

/** Campos do tipo escolhido: dias da semana ou intervalo (periódica), data (agendada). */
export function ScheduleFields({ draft }: { draft: ScheduleDraft }) {
  const { schedule } = draft;

  if (draft.kind === "periodic") {
    return (
      <div className="flex flex-col gap-2">
        <div role="radiogroup" aria-label="Repetição" className="flex gap-1 text-[13px]">
          {(
            [
              ["weekdays", "Dias da semana"],
              ["interval", "A cada X dias"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={draft.mode === value}
              onClick={() => draft.setMode(value)}
              className={`h-8 rounded-lg px-2.5 font-medium transition ${
                draft.mode === value ? "bg-stone-200/70 text-stone-900" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {schedule.type === "periodic" && (
          <div role="group" aria-label="Dias da semana" className="flex gap-1.5">
            {WEEKDAYS.map((d, i) => {
              const day = i as Weekday;
              const selected = schedule.weekdays.includes(day);
              return (
                <button
                  key={d.name}
                  type="button"
                  aria-pressed={selected}
                  aria-label={d.name}
                  onClick={() => draft.setWeekdays(toggleWeekday(schedule.weekdays, day))}
                  className={`flex size-9 items-center justify-center rounded-full text-[13px] font-semibold ring-1 transition ${
                    selected
                      ? "bg-red-50 text-red-600 ring-red-200"
                      : "bg-white text-stone-400 ring-stone-200 hover:text-stone-700"
                  }`}
                >
                  {d.short}
                </button>
              );
            })}
          </div>
        )}

        {schedule.type === "interval" && (
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-stone-500">
            <label className="flex items-center gap-2">
              A cada
              <input
                type="number"
                inputMode="numeric"
                min={MIN_INTERVAL}
                max={MAX_INTERVAL}
                required
                value={Number.isNaN(schedule.every) ? "" : schedule.every}
                onChange={(e) => draft.setEvery(e.target.valueAsNumber)}
                className={`${SMALL_INPUT} w-16 text-center tabular-nums`}
              />
              dias
            </label>
            <label className="flex items-center gap-2">
              a partir de
              <input
                type="date"
                required
                value={schedule.start}
                onChange={(e) => draft.setStart(e.target.value)}
                className={SMALL_INPUT}
              />
            </label>
          </div>
        )}
        <TimeField draft={draft} />
      </div>
    );
  }

  if (schedule.type === "scheduled") {
    return (
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-[13px] text-stone-500">
          A partir de
          <input
            type="date"
            required
            value={schedule.date}
            onChange={(e) => draft.setDate(e.target.value)}
            className={SMALL_INPUT}
          />
        </label>
        <TimeField draft={draft} />
      </div>
    );
  }

  return null;
}

function TimeField({ draft }: { draft: ScheduleDraft }) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-stone-500">
      <label className="flex items-center gap-2">
        Avisar às
        <input
          type="time"
          value={draft.time}
          onChange={(e) => draft.setTime(e.target.value)}
          aria-label="Horário do aviso (opcional)"
          className={SMALL_INPUT}
        />
      </label>
      {draft.time ? (
        <button
          type="button"
          onClick={() => draft.setTime("")}
          className="h-8 rounded-lg px-2 font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-800"
        >
          Sem horário
        </button>
      ) : (
        <span className="text-stone-400">opcional</span>
      )}
    </div>
  );
}

/** Liga/desliga a prioridade: as prioritárias do dia decidem a sequência. */
export function PriorityToggle({
  value,
  onChange,
  withLabel = false,
  className = "",
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  withLabel?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={value}
      aria-label={withLabel ? undefined : "Prioritária"}
      title="Prioritária: precisa ser concluída para o dia contar na sequência"
      onClick={() => onChange(!value)}
      className={`flex shrink-0 items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold transition ${
        value ? "bg-red-50 text-red-600" : "text-stone-400 hover:bg-stone-100 hover:text-stone-700"
      } ${className}`}
    >
      <FlagIcon className="size-4" />
      {withLabel && "Prioritária"}
    </button>
  );
}
