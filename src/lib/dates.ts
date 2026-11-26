/** Chave de dia no horário local, no formato "YYYY-MM-DD". Ordenável como string. */
export type DayKey = string;

const pad = (n: number) => String(n).padStart(2, "0");

export function toDayKey(date: Date): DayKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDayKey(key: DayKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: DayKey, n: number): DayKey {
  const date = fromDayKey(key);
  return toDayKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + n));
}

/** Milissegundos até a próxima meia-noite local. */
export function msUntilNextMidnight(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}
