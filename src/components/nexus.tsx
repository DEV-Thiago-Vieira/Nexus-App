"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { fromDayKey, msUntilNextMidnight, toDayKey } from "@/lib/dates.ts";
import { loadState, saveState } from "@/lib/storage.ts";
import { isRepeating, tasksForDay } from "@/lib/schedule.ts";
import { dayStatus, progressView, rollover } from "@/lib/streak.ts";
import { addTask, moveTask, removeTask, toggleTask, updateTask } from "@/lib/tasks.ts";
import type { AppState, Task, TaskDraft } from "@/lib/types.ts";
import { CheckIcon, EyeIcon, EyeOffIcon, FlagIcon } from "./icons";
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
  "mx-auto flex w-full max-w-xl flex-1 flex-col gap-7 px-4 pt-6 pb-[calc(10rem+env(safe-area-inset-bottom))]";

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
    onUpdate: (id: string, draft: TaskDraft) => setTasks((ts) => updateTask(ts, id, draft)),
    onRemove: (id: string) => setTasks((ts) => removeTask(ts, id)),
  };

  // Só o que vale para hoje: periódicas do dia e agendadas já liberadas.
  const todays = tasksForDay(state.tasks, today);
  const total = todays.length;
  const doneCount = todays.filter((t) => t.doneOn === today).length;
  const allDone = total > 0 && doneCount === total;
  const visible = state.showDone ? todays : todays.filter((t) => t.doneOn !== today);

  const priority = todays.filter((t) => t.priority);
  const priorityDone = priority.filter((t) => t.doneOn === today).length;
  const dayDone = dayStatus(state.tasks, today) === "done";

  return (
    <>
      <Progress view={view} dateLabel={dateLabel} />
      <main className={MAIN}>
        <InstallPrompt />
        {total === 0 ? (
          <EmptyState />
        ) : (
          <>
            {(doneCount > 0 || priority.length > 0) && (
              <div className="-mb-4 -mt-2 flex min-h-10 items-center justify-between gap-3 pl-1.5">
                <DayStatusLabel done={dayDone} priorityDone={priorityDone} priorityTotal={priority.length} />
                {doneCount > 0 && (
                  <EyeToggle showDone={state.showDone} doneCount={doneCount} onToggle={() => setState((s) => ({ ...s, showDone: !s.showDone }))} />
                )}
              </div>
            )}

            {allDone && <AllDone streakDays={view.streakDays} compact={visible.length > 0} />}

            <TaskList title="Periódicas" tasks={visible.filter(isRepeating)} {...listProps} />
            <TaskList title="Agendadas" tasks={visible.filter((t) => t.type === "scheduled")} {...listProps} />
            <TaskList title="Normais" tasks={visible.filter((t) => t.type === "normal")} {...listProps} />
          </>
        )}
      </main>
      <TaskForm today={today} onAdd={(draft) => setTasks((ts) => addTask(ts, newId(), draft))} />
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
    <button
      type="button"
      aria-pressed={!showDone}
      onClick={onToggle}
      className="ml-auto flex h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium text-stone-500 transition hover:bg-stone-200/50 hover:text-stone-800"
    >
      {showDone ? <EyeIcon /> : <EyeOffIcon />}
      {showDone
        ? `Ocultar concluídas (${doneCount})`
        : `Mostrar ${doneCount} ${doneCount === 1 ? "concluída" : "concluídas"}`}
    </button>
  );
}

/** O que falta para o dia contar na sequência. */
function DayStatusLabel({ done, priorityDone, priorityTotal }: { done: boolean; priorityDone: number; priorityTotal: number }) {
  if (done) {
    return (
      <span className="flex items-center gap-1 text-[13px] font-semibold text-emerald-600">
        <CheckIcon className="size-3.5" /> Sequência garantida hoje
      </span>
    );
  }
  if (priorityTotal === 0) return null;
  return (
    <span className="flex items-center gap-1 text-[13px] text-stone-500">
      <FlagIcon className="size-3.5 text-red-600" />
      {priorityDone} de {priorityTotal} {priorityTotal === 1 ? "prioritária" : "prioritárias"} hoje
    </span>
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
        Adicione uma tarefa aqui embaixo. Marque como <span className="font-semibold text-red-600">prioritária</span> o
        que precisa ser feito para o dia contar na sua sequência.
      </p>
    </section>
  );
}
