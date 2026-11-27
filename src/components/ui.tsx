import type { CSSProperties, Ref } from "react";
import { CheckIcon, PencilIcon, TrashIcon } from "./icons";

export const CARD =
  "divide-y divide-stone-100 rounded-[1.25rem] bg-white shadow-[0_1px_2px_rgb(28_25_23/0.04),0_6px_20px_-6px_rgb(28_25_23/0.08)] ring-1 ring-stone-200/60";

const ROUNDED = "first:rounded-t-[1.25rem] last:rounded-b-[1.25rem]";

export const ROW = `bg-white ${ROUNDED}`;

export const SMALL_INPUT =
  "h-9 rounded-xl bg-white px-3 text-sm text-stone-900 ring-1 ring-stone-200 outline-none focus:ring-2 focus:ring-stone-300";

const ICON_BUTTON = "flex size-11 shrink-0 items-center justify-center rounded-xl text-stone-400 transition";

export function RoundCheckbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <span className="relative flex size-11 shrink-0 items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="peer size-6 cursor-pointer appearance-none rounded-full border-2 border-stone-300 transition-colors checked:border-emerald-500 checked:bg-emerald-500 hover:border-emerald-400 motion-safe:checked:animate-pop"
      />
      <CheckIcon className="pointer-events-none absolute size-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
    </span>
  );
}

export function ItemActions({ name, onEdit, onRemove }: { name: string; onEdit: () => void; onRemove: () => void }) {
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

export function FormActions({ valid, onCancel }: { valid: boolean; onCancel: () => void }) {
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

export function ConfirmRemove({
  name,
  detail,
  onCancel,
  onConfirm,
  ref,
  style,
}: {
  name: string;
  detail: string;
  onCancel: () => void;
  onConfirm: () => void;
  ref?: Ref<HTMLLIElement>;
  style?: CSSProperties;
}) {
  return (
    <li
      ref={ref}
      style={style}
      role="alertdialog"
      aria-label={`Remover "${name}"?`}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
      className={`${ROUNDED} flex min-h-15 flex-wrap items-center gap-x-3 gap-y-2 bg-red-50/60 py-2.5 pr-2.5 pl-4 motion-safe:animate-rise`}
    >
      <p className="min-w-0 flex-1 text-[15px] leading-snug text-stone-700">
        Remover <span className="font-semibold break-words text-stone-900">“{name}”</span>?
        <span className="block text-[13px] text-stone-500">{detail}</span>
      </p>
      <div className="ml-auto flex gap-2">
        <button
          type="button"
          autoFocus
          onClick={onCancel}
          className="h-11 rounded-xl px-4 text-sm font-medium text-stone-600 hover:bg-white"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
        >
          Remover
        </button>
      </div>
    </li>
  );
}
