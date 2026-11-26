"use client";

import { useState, type KeyboardEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task, TaskType } from "@/lib/types.ts";
import { CheckIcon, GripIcon, PencilIcon, TrashIcon } from "./icons";
import { TypeToggle } from "./type-toggle";

type Props = {
  task: Task;
  done: boolean;
  onToggle: () => void;
  onUpdate: (text: string, type: TaskType) => void;
  onRemove: () => void;
};

type Mode = "view" | "edit" | "confirm";

const ROW = "bg-white first:rounded-t-[1.25rem] last:rounded-b-[1.25rem]";
const ICON_BUTTON = "flex size-11 shrink-0 items-center justify-center rounded-xl text-stone-400 transition";

export function TaskItem({ task, done, onToggle, onUpdate, onRemove }: Props) {
  const [mode, setMode] = useState<Mode>("view");
  const [text, setText] = useState(task.text);
  const [type, setType] = useState<TaskType>(task.type);

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, disabled: mode !== "view" });

  const style = { transform: CSS.Translate.toString(transform), transition };
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
            if (!value) return;
            onUpdate(value, type);
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
            <div className="min-w-48 flex-1 sm:max-w-60">
              <TypeToggle value={type} onChange={setType} />
            </div>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => setMode("view")}
                className="h-11 rounded-xl px-4 text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!text.trim()}
                className="h-11 rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white hover:bg-stone-700 disabled:bg-stone-200 disabled:text-stone-400"
              >
                Salvar
              </button>
            </div>
          </div>
        </form>
      </li>
    );
  }

  if (mode === "confirm") {
    return (
      <li
        ref={setNodeRef}
        style={style}
        onKeyDown={cancelOnEscape}
        role="alertdialog"
        aria-label={`Remover "${task.text}"?`}
        className={`${ROW} flex min-h-15 flex-wrap items-center gap-x-3 gap-y-2 bg-red-50/60 py-2.5 pr-2.5 pl-4 motion-safe:animate-rise`}
      >
        <p className="min-w-0 flex-1 text-[15px] leading-snug text-stone-700">
          Remover <span className="font-semibold break-words text-stone-900">“{task.text}”</span>?
          <span className="block text-[13px] text-stone-500">Ela deixa de contar para a sequência.</span>
        </p>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            autoFocus
            onClick={() => setMode("view")}
            className="h-11 rounded-xl px-4 text-sm font-medium text-stone-600 hover:bg-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
          >
            Remover
          </button>
        </div>
      </li>
    );
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`${ROW} group relative flex min-h-15 items-center py-1.5 pr-1 pl-1.5 ${
        isDragging ? "z-10 rounded-[1.25rem] shadow-xl ring-1 ring-stone-200" : ""
      }`}
    >
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 self-stretch">
        <span className="relative flex size-11 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            checked={done}
            onChange={onToggle}
            aria-label={`Concluir "${task.text}"`}
            className="peer size-6 cursor-pointer appearance-none rounded-full border-2 border-stone-300 transition-colors checked:border-emerald-500 checked:bg-emerald-500 hover:border-emerald-400 motion-safe:checked:animate-pop"
          />
          <CheckIcon className="pointer-events-none absolute size-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
        </span>
        <span
          className={`min-w-0 flex-1 py-2 text-base leading-6 break-words transition-colors duration-300 ${
            done ? "text-stone-400 line-through decoration-stone-300 decoration-2" : "text-stone-800"
          }`}
        >
          {task.text}
        </span>
      </label>

      <div className="flex shrink-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:opacity-0">
        <button
          type="button"
          onClick={() => {
            setText(task.text);
            setType(task.type);
            setMode("edit");
          }}
          aria-label={`Editar "${task.text}"`}
          className={`${ICON_BUTTON} hover:bg-stone-100 hover:text-stone-700`}
        >
          <PencilIcon />
        </button>
        <button
          type="button"
          onClick={() => (task.type === "recurring" ? setMode("confirm") : onRemove())}
          aria-label={`Remover "${task.text}"`}
          className={`${ICON_BUTTON} hover:bg-red-50 hover:text-red-600`}
        >
          <TrashIcon />
        </button>
      </div>

      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Arrastar "${task.text}"`}
        className={`${ICON_BUTTON} touch-none text-stone-300 hover:bg-stone-100 hover:text-stone-600 ${
          isDragging ? "cursor-grabbing text-stone-600" : "cursor-grab"
        }`}
      >
        <GripIcon />
      </button>
    </li>
  );
}
