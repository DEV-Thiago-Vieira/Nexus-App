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
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripIcon } from "./icons";
import { CARD } from "./ui";

const MODIFIERS = [restrictToVerticalAxis, restrictToParentElement];

export function SortableList({
  items,
  noun,
  onMove,
  children,
}: {
  items: { id: string }[];
  noun: string;
  onMove: (id: string, overId: string) => void;
  children: ReactNode;
}) {
  const id = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const position = (itemId: string | number) => items.findIndex((x) => x.id === itemId) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `${noun} pega na posição ${position(active.id)} de ${items.length}.`,
    onDragOver: ({ over }) => (over ? `Sobre a posição ${position(over.id)}.` : undefined),
    onDragEnd: ({ over }) => (over ? `${noun} solta na posição ${position(over.id)}.` : `${noun} solta.`),
    onDragCancel: () => "Movimento cancelado.",
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) onMove(String(active.id), String(over.id));
  };

  return (
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
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <ul className={CARD}>{children}</ul>
      </SortableContext>
    </DndContext>
  );
}

export function useSortableRow(id: string, disabled: boolean) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });
  return {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    isDragging,
    style: { transform: CSS.Translate.toString(transform), transition },
    dragClass: isDragging ? "z-10 rounded-[1.25rem] shadow-xl ring-1 ring-stone-200" : "",
  };
}

type Row = ReturnType<typeof useSortableRow>;

export function DragHandle({
  name,
  setActivatorNodeRef,
  attributes,
  listeners,
  isDragging,
}: { name: string } & Pick<Row, "setActivatorNodeRef" | "attributes" | "listeners" | "isDragging">) {
  return (
    <button
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Arrastar "${name}"`}
      className={`flex size-11 shrink-0 touch-none items-center justify-center rounded-xl transition hover:bg-stone-100 hover:text-stone-600 ${
        isDragging ? "cursor-grabbing text-stone-600" : "cursor-grab text-stone-300"
      }`}
    >
      <GripIcon />
    </button>
  );
}
