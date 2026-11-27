"use client";

import { useId, useState } from "react";
import type { ProgressView } from "@/lib/streak.ts";
import { ChevronIcon, FlameIcon } from "./icons";

const days = (n: number) => `${n} ${n === 1 ? "dia" : "dias"}`;
const cycles = (n: number) => `${n} ${n === 1 ? "ciclo" : "ciclos"}`;

/** Cabeçalho fixo: medidor da sequência; tocar expande as estatísticas. */
export function Progress({ view, dateLabel }: { view: ProgressView | null; dateLabel?: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const label = view?.stage === "cycle" ? "Ciclo de 7 dias" : "Primeiros 3 dias";
  const goal = view?.goal ?? 3;
  const active = (view?.streakDays ?? 0) > 0;

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/60 bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
      <button
        type="button"
        disabled={!view}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="mx-auto block w-full max-w-xl px-5 pt-4 pb-3.5 text-left"
      >
        <span className="flex items-center justify-between gap-3">
          <span className="min-w-0">
            <span className="block text-lg leading-tight font-bold tracking-tight text-stone-900">Nexus</span>
            <span className="block truncate text-[13px] text-stone-500 first-letter:uppercase">{dateLabel ?? " "}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-bold tabular-nums transition-colors ${
                active ? "bg-red-50 text-red-600" : "bg-stone-100 text-stone-400"
              }`}
            >
              <FlameIcon className="size-4" />
              {view ? days(view.streakDays) : "–"}
            </span>
            <ChevronIcon
              className={`size-4 text-stone-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </span>
        </span>

        <span className="mt-3.5 flex items-center gap-3">
          <span className="flex flex-1 gap-1.5" aria-hidden>
            {Array.from({ length: goal }, (_, i) => (
              <span
                key={i}
                className={`h-2 flex-1 rounded-full transition-colors duration-500 ${
                  view && i < view.current ? "bg-red-500" : "bg-stone-200"
                }`}
              />
            ))}
          </span>
          <span className="shrink-0 text-[13px] text-stone-500">
            <span className="font-bold text-stone-900 tabular-nums">{view ? `${view.current}/${view.goal}` : "–"}</span>{" "}
            · {label}
          </span>
        </span>
      </button>

      {view && open && (
        <section
          id={panelId}
          aria-label="Estatísticas"
          className="mx-auto grid w-full max-w-xl grid-cols-2 gap-2.5 px-5 pb-5 motion-safe:animate-rise"
        >
          {view.streakDays === view.bestDays ? (
            <Stat
              label="Sequência atual"
              badge={view.streakDays > 0 ? "Seu recorde" : undefined}
              value={days(view.streakDays)}
              detail={cycles(view.streakCycles)}
              accent
              wide
            />
          ) : (
            <>
              <Stat label="Sequência atual" value={days(view.streakDays)} detail={cycles(view.streakCycles)} accent />
              <Stat label="Melhor sequência" value={days(view.bestDays)} detail={cycles(view.bestCycles)} />
            </>
          )}
          <Stat label="Ciclos no total" value={String(view.totalCycles)} detail="de 7 dias" />
          <Stat label="Dias concluídos" value={String(view.completedDays)} detail="meta do dia cumprida" />
        </section>
      )}
    </header>
  );
}

type StatProps = { label: string; value: string; detail?: string; badge?: string; accent?: boolean; wide?: boolean };

function Stat({ label, value, detail, badge, accent, wide }: StatProps) {
  return (
    <div
      className={`rounded-2xl p-3.5 ${wide ? "col-span-2" : ""} ${
        accent ? "bg-red-50 ring-1 ring-red-100" : "bg-white ring-1 ring-stone-200/70"
      }`}
    >
      <p className={`flex items-center justify-between gap-2 text-xs font-medium ${accent ? "text-red-600" : "text-stone-500"}`}>
        {label}
        {badge && (
          <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white">{badge}</span>
        )}
      </p>
      <p className={`mt-1 text-xl font-bold tracking-tight tabular-nums ${accent ? "text-red-600" : "text-stone-900"}`}>
        {value}
      </p>
      {detail && <p className={`mt-0.5 text-xs ${accent ? "text-red-500/80" : "text-stone-400"}`}>{detail}</p>}
    </div>
  );
}
