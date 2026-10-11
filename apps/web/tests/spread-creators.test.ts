import { expect, test } from "bun:test";
import { spreadCreators } from "../src/lib/spread-creators";

const by = (item: string) => item[0] ?? "";
const neighboursBySameCreator = (list: string[]) =>
  list.filter((item, index) => index > 0 && by(item) === by(list[index - 1] ?? "")).length;

test("three videos of one creator in a row are separated by the others", () => {
  const spread = spreadCreators(["w1", "w2", "w3", "f1", "s1", "m1"], by);
  expect(spread).toEqual(["w1", "f1", "s1", "w2", "m1", "w3"]);
  expect(neighboursBySameCreator(spread)).toBe(0);
});

test("creators take turns instead of two of them alternating", () => {
  const list = ["a1", "a2", "a3", "b1", "b2", "b3", "c1", "c2", "d1", "d2"];
  const spread = spreadCreators(list, by);
  expect(spread).toEqual(["a1", "b1", "c1", "d1", "a2", "b2", "c2", "d2", "a3", "b3"]);
  expect(neighboursBySameCreator(spread)).toBe(0);
});

test("the same videos come back, none added and none lost, and the first stays first", () => {
  const list = ["a1", "a2", "a3", "a4", "b1", "c1", "c2", "a5", "d1"];
  const spread = spreadCreators(list, by);
  expect([...spread].sort()).toEqual([...list].sort());
  expect(spread[0]).toBe("a1");
});

test("a creator keeps the order of their own videos", () => {
  const spread = spreadCreators(["a1", "a2", "b1", "a3", "b2", "b3", "c1"], by);
  expect(spread.filter((item) => by(item) === "a")).toEqual(["a1", "a2", "a3"]);
  expect(spread.filter((item) => by(item) === "b")).toEqual(["b1", "b2", "b3"]);
});

test("a list where every creator is already far from themselves is left as it is", () => {
  const list = ["a1", "b1", "c1", "d1", "a2", "b2", "c2", "d2"];
  expect(spreadCreators(list, by)).toEqual(list);
});

test("when one creator has most of the page, the others are used up first and the rest follows", () => {
  const spread = spreadCreators(["a1", "a2", "a3", "a4", "a5", "b1"], by);
  expect(spread).toEqual(["a1", "b1", "a2", "a3", "a4", "a5"]);
});

test("a creator with half the page never ends up side by side with themselves", () => {
  const spread = spreadCreators(["a1", "a2", "a3", "a4", "b1", "c1", "d1"], by);
  expect(neighboursBySameCreator(spread)).toBe(0);
  expect(spread[0]).toBe("a1");
});

test("videos without a known creator are never held back", () => {
  expect(spreadCreators(["x", "y", "z"], () => "")).toEqual(["x", "y", "z"]);
});

test("what is already on screen stays where it is when more videos arrive", () => {
  const first = spreadCreators(["a1", "a2", "b1", "b2"], by);
  const grown = spreadCreators(["a1", "a2", "b1", "b2", "a3", "c1", "c2", "d1"], by, first);
  expect(grown.slice(0, first.length)).toEqual(first);
  expect([...grown].sort()).toEqual(["a1", "a2", "a3", "b1", "b2", "c1", "c2", "d1"]);
});

test("a video that left the page is dropped from what was settled", () => {
  const settled = ["a1", "b1", "a2"];
  expect(spreadCreators(["a1", "a2", "c1"], by, settled)).toEqual(["a1", "a2", "c1"]);
});
