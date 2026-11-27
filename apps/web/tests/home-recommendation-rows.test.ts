import { expect, test } from "bun:test";
import { visibleHomeRows } from "../src/lib/home-recommendation-rows";

const row = (id: string, reason: string) => ({
  id,
  title: id,
  reason,
  reasonRef: null,
  videoUrls: [id],
});

test("hides the Signals continue row when Continue watching is off", () => {
  const rows = [row("a", "continue"), row("b", "topic"), row("c", "watch_again")];
  expect(visibleHomeRows(rows, true).map((r) => r.id)).toEqual(["b", "c"]);
  expect(visibleHomeRows(rows, false).map((r) => r.id)).toEqual(["a", "b", "c"]);
});
