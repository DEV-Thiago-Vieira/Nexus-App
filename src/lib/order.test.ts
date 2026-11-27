import { test } from "node:test";
import assert from "node:assert/strict";
import { moveById } from "./order.ts";

const items = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
const ids = (list: { id: string }[]) => list.map((x) => x.id).join("");

test("moveById move para baixo e para cima", () => {
  assert.equal(ids(moveById(items, "a", "c")), "bcad");
  assert.equal(ids(moveById(items, "d", "b")), "adbc");
});

test("moveById não muda nada para o mesmo item ou id inexistente", () => {
  assert.equal(moveById(items, "a", "a"), items);
  assert.equal(moveById(items, "a", "x"), items);
  assert.equal(moveById(items, "x", "a"), items);
});
