import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, msUntilNextMidnight, toDayKey } from "./dates.ts";

test("toDayKey usa a data local com zeros à esquerda", () => {
  assert.equal(toDayKey(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
  assert.equal(toDayKey(new Date(2026, 11, 31, 0, 0)), "2026-12-31");
});

test("addDays atravessa mês, ano e ano bissexto", () => {
  assert.equal(addDays("2026-01-31", 1), "2026-02-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(addDays("2027-02-28", 1), "2027-03-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("chaves de dia são comparáveis como string", () => {
  assert.ok("2026-09-30" < "2026-10-01");
  assert.ok("2026-12-31" < "2027-01-01");
});

test("msUntilNextMidnight", () => {
  assert.equal(msUntilNextMidnight(new Date(2026, 4, 10, 23, 59, 0)), 60_000);
});
