import type { TaskType } from "@/lib/types.ts";

const OPTIONS: { value: TaskType; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "recurring", label: "Recorrente" },
];

export function TypeToggle({
  value,
  onChange,
}: {
  value: TaskType;
  onChange: (value: TaskType) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Tipo da tarefa" className="flex rounded-xl bg-stone-100 p-1 text-sm">
      {OPTIONS.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={`h-9 flex-1 rounded-lg px-3 font-medium transition ${
              selected
                ? o.value === "recurring"
                  ? "bg-white text-red-600 shadow-sm"
                  : "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
