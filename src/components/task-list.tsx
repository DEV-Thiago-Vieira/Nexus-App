"use client";

import { useId, type ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { DayKey } from "@/lib/dates.ts";
import type { Task, TaskDraft } from "@/lib/types.ts";
import { TaskItem } from "./task-item";
import { CARD } from "./ui";

type Props = {
  title: string;
  /** Texto curto à direita do título (ex.: progresso de hoje). */
  aside?: ReactNode;
  tasks: Task[];
  today: DayKey;
  onMove: (id: string, overId: string) => void;
  onToggle: (id: string) => void;
  onUpdate: (id: string, draft: TaskDraft) => void;
  onRemove: (id: string) => void;
};

const MODIFIERS = [restrictToVerticalAxis, restrictToParentElement];

export function TaskList({ title, aside, tasks, today, onMove, onToggle, onUpdate, onRemove }: Props) {
  const id = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const position = (taskId: string | number) => tasks.findIndex((t) => t.id === taskId) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Tarefa pega na posição ${position(active.id)} de ${tasks.length}.`,
    onDragOver: ({ over }) => (over ? `Sobre a posição ${position(over.id)}.` : undefined),
    onDragEnd: ({ over }) => (over ? `Tarefa solta na posição ${position(over.id)}.` : "Tarefa solta."),
    onDragCancel: () => "Movimento cancelado.",
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) onMove(String(active.id), String(over.id));
  };

  if (tasks.length === 0) return null;

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3 px-1.5">
        <h2 className="text-[15px] font-bold tracking-tight text-stone-800">{title}</h2>
        {aside && <span className="text-[13px] text-stone-500">{aside}</span>}
      </div>
      <DndContext
        id={id}
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={MODIFIERS}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              "Para mover, pressione espaço ou enter. Use as setas para mudar a posição e espaço ou enter para soltar. Esc cancela.",
          },
        }}
      >
        <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
          <ul className={CARD}>
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                today={today}
                done={task.doneOn === today}
                onToggle={() => onToggle(task.id)}
                onUpdate={(draft) => onUpdate(task.id, draft)}
                onRemove={() => onRemove(task.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}
