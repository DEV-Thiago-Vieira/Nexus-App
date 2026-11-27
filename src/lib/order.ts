export function moveById<T extends { id: string }>(items: T[], id: string, overId: string): T[] {
  const from = items.findIndex((x) => x.id === id);
  const to = items.findIndex((x) => x.id === overId);
  if (from === -1 || to === -1 || from === to) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
