"use client";

import { useState } from "react";
import type { TaskType } from "@/lib/types.ts";
import { RepeatIcon } from "./icons";

/** Barra fixa no rodapé para adicionar tarefas, ao alcance do polegar. */
export function TaskForm({ onAdd }: { onAdd: (text: string, type: TaskType) => void }) {
  const [text, setText] = useState("");
  const [type, setType] = useState<TaskType>("normal");
  const recurring = type === "recurring";

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200/60 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg">
      <form
        className="mx-auto flex w-full max-w-xl items-center gap-2 px-3 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          const value = text.trim();
          if (!value) return;
          onAdd(value, type);
          setText("");
        }}
      >
        <div className="flex h-12 min-w-0 flex-1 items-center rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/80 transition focus-within:ring-2 focus-within:ring-stone-300">
          <button
            type="button"
            aria-label={`Tipo: ${recurring ? "recorrente" : "normal"}. Alternar tipo.`}
            onClick={() => setType(recurring ? "normal" : "recurring")}
            className={`ml-1.5 flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold transition ${
              recurring ? "bg-red-50 text-red-600" : "bg-stone-100 text-stone-600 hover:bg-stone-200/70"
            }`}
          >
            {recurring && <RepeatIcon className="size-3.5" />}
            {recurring ? "Recorrente" : "Normal"}
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nova tarefa…"
            aria-label="Nova tarefa"
            enterKeyHint="done"
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-base text-stone-900 outline-none placeholder:text-stone-400"
          />
        </div>
        <button
          type="submit"
          disabled={!text.trim()}
          aria-label="Adicionar tarefa"
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-white shadow-sm transition hover:bg-stone-700 active:scale-95 disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none"
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M8 3v10M3 8h10" />
          </svg>
        </button>
      </form>
    </div>
  );
}
