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

const DAY_KEY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function isDayKey(value: unknown): value is DayKey {
  return typeof value === "string" && DAY_KEY.test(value) && toDayKey(fromDayKey(value)) === value;
}

/** Dias de `from` até `to` (negativo se `to` vier antes). Independe de horário de verão. */
export function daysBetween(from: DayKey, to: DayKey): number {
  const utc = (k: DayKey) => {
    const [y, m, d] = k.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

/** Dia da semana local (0 = domingo … 6 = sábado). */
export function weekdayOf(key: DayKey): number {
  return fromDayKey(key).getDay();
}

/** Milissegundos até a próxima meia-noite local. */
export function msUntilNextMidnight(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

export type TimeKey = string;

const TIME_KEY = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isTimeKey(value: unknown): value is TimeKey {
  return typeof value === "string" && TIME_KEY.test(value);
}

export function toTimeKey(date: Date): TimeKey {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function msUntilTime(time: TimeKey, now: Date): number {
  const [h, m] = time.split(":").map(Number);
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime() - now.getTime();
}
