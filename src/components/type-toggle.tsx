import { KIND_LABELS, type Kind } from "./schedule-fields";

const OPTIONS: Kind[] = ["normal", "periodic", "scheduled"];

export function TypeToggle({ value, onChange }: { value: Kind; onChange: (value: Kind) => void }) {
  return (
    <div role="radiogroup" aria-label="Tipo da tarefa" className="flex rounded-xl bg-stone-100 p-1 text-sm">
      {OPTIONS.map((o) => {
        const selected = value === o;
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o)}
            className={`h-9 flex-1 rounded-lg px-3 font-medium transition ${
              selected ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
            }`}
          >
            {KIND_LABELS[o]}
          </button>
        );
      })}
    </div>
  );
}
