"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { fromDayKey, msUntilNextMidnight, toDayKey } from "@/lib/dates.ts";
import { loadState, saveState } from "@/lib/storage.ts";
import { dayStatus, progressView, rollover } from "@/lib/streak.ts";
import { addTask, moveTask, removeTask, toggleTask, updateTask } from "@/lib/tasks.ts";
import type { AppState, Task } from "@/lib/types.ts";
import { CheckIcon, EyeIcon, EyeOffIcon } from "./icons";
import { AllDoneIllustration, EmptyIllustration } from "./illustrations";
import { InstallPrompt } from "./install-prompt";
import { Progress } from "./progress";
import { TaskForm } from "./task-form";
import { TaskList } from "./task-list";

const noopSubscribe = () => () => {};

/** false no servidor e na hidratação; true depois, no cliente. */
function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/** Dia local atual; atualiza à meia-noite e quando a aba volta a ficar visível. */
function useToday() {
  const [today, setToday] = useState(() => toDayKey(new Date()));

  useEffect(() => {
    let timer: number | undefined;
    const update = () => {
      setToday(toDayKey(new Date()));
      window.clearTimeout(timer);
      timer = window.setTimeout(update, msUntilNextMidnight(new Date()) + 500);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") update();
    };
    timer = window.setTimeout(update, msUntilNextMidnight(new Date()) + 500);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", update);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", update);
    };
  }, []);

  return today;
}

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const MAIN =
  "mx-auto flex w-full max-w-xl flex-1 flex-col gap-7 px-4 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))]";

export function Nexus() {
  const isClient = useIsClient();
  if (isClient) return <App />;
  return (
    <>
      <Progress view={null} />
      <main className={MAIN}>
        <div className="h-44 animate-pulse rounded-[1.25rem] bg-white ring-1 ring-stone-200/60" />
      </main>
    </>
  );
}

function App() {
  const today = useToday();
  const [state, setState] = useState<AppState>(() => rollover(loadState(today), today));

  // Virada de dia com o app aberto: fecha o dia anterior.
  if (state.streak.lastDay < today) setState(rollover(state, today));

  useEffect(() => saveState(state), [state]);

  const setTasks = (fn: (tasks: Task[]) => Task[]) => setState((s) => ({ ...s, tasks: fn(s.tasks) }));

  const view = progressView(state.streak, state.tasks, today);
  const dateLabel = fromDayKey(today).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const listProps = {
    today,
    onMove: (id: string, overId: string) => setTasks((ts) => moveTask(ts, id, overId)),
    onToggle: (id: string) => setTasks((ts) => toggleTask(ts, id, today)),
    onUpdate: (id: string, text: string, type: Task["type"]) => setTasks((ts) => updateTask(ts, id, text, type)),
    onRemove: (id: string) => setTasks((ts) => removeTask(ts, id)),
  };

  const total = state.tasks.length;
  const doneCount = state.tasks.filter((t) => t.doneOn === today).length;
  const allDone = total > 0 && doneCount === total;
  const visible = state.showDone ? state.tasks : state.tasks.filter((t) => t.doneOn !== today);

  const recurring = state.tasks.filter((t) => t.type === "recurring");
  const recurringDone = recurring.filter((t) => t.doneOn === today).length;
  const recurringAside =
    dayStatus(state.tasks, today) === "done" ? (
      <span className="flex items-center gap-1 font-semibold text-emerald-600">
        <CheckIcon className="size-3.5" /> Sequência garantida hoje
      </span>
    ) : (
      `${recurringDone} de ${recurring.length} hoje`
    );

  return (
    <>
      <Progress view={view} dateLabel={dateLabel} />
      <main className={MAIN}>
        <InstallPrompt />
        {total === 0 ? (
          <EmptyState />
        ) : (
          <>
            {doneCount > 0 && (
              <EyeToggle showDone={state.showDone} doneCount={doneCount} onToggle={() => setState((s) => ({ ...s, showDone: !s.showDone }))} />
            )}

            {allDone && <AllDone streakDays={view.streakDays} compact={visible.length > 0} />}

            <TaskList
              title="Recorrentes"
              aside={recurringAside}
              tasks={visible.filter((t) => t.type === "recurring")}
              {...listProps}
            />
            <TaskList title="Normais" tasks={visible.filter((t) => t.type === "normal")} {...listProps} />
          </>
        )}
      </main>
      <TaskForm onAdd={(text, type) => setTasks((ts) => addTask(ts, newId(), text, type))} />
    </>
  );
}

function EyeToggle({
  showDone,
  doneCount,
  onToggle,
}: {
  showDone: boolean;
  doneCount: number;
  onToggle: () => void;
}) {
  return (
    <div className="-mb-4 -mt-2 flex justify-end">
      <button
        type="button"
        aria-pressed={!showDone}
        onClick={onToggle}
        className="flex h-10 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium text-stone-500 transition hover:bg-stone-200/50 hover:text-stone-800"
      >
        {showDone ? <EyeIcon /> : <EyeOffIcon />}
        {showDone
          ? `Ocultar concluídas (${doneCount})`
          : `Mostrar ${doneCount} ${doneCount === 1 ? "concluída" : "concluídas"}`}
      </button>
    </div>
  );
}

function AllDone({ streakDays, compact }: { streakDays: number; compact: boolean }) {
  return (
    <section
      aria-live="polite"
      className={`flex items-center rounded-[1.25rem] bg-white text-center ring-1 ring-emerald-100 motion-safe:animate-rise ${
        compact ? "gap-4 p-4 text-left" : "my-auto flex-col gap-3 px-6 py-10"
      }`}
    >
      <AllDoneIllustration className={compact ? "w-20 shrink-0" : "w-44"} />
      <div>
        <p className={`font-bold tracking-tight text-stone-900 ${compact ? "text-base" : "text-xl"}`}>
          Tudo concluído por hoje!
        </p>
        <p className="mt-1 text-sm leading-relaxed text-stone-500">
          {streakDays > 0 ? (
            <>
              Sequência de <span className="font-semibold text-red-600">{streakDays} {streakDays === 1 ? "dia" : "dias"}</span>.
              Volte amanhã para mantê-la.
            </>
          ) : (
            "Bom trabalho. Aproveite o resto do dia."
          )}
        </p>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="my-auto flex flex-col items-center gap-3 px-6 py-10 text-center motion-safe:animate-rise">
      <EmptyIllustration className="w-44" />
      <p className="text-xl font-bold tracking-tight text-stone-900">Comece seu dia</p>
      <p className="max-w-72 text-sm leading-relaxed text-stone-500">
        Adicione uma tarefa aqui embaixo. Marque como <span className="font-semibold text-red-600">recorrente</span> o
        que você quer fazer todo dia: elas formam a sua sequência.
      </p>
    </section>
  );
}
