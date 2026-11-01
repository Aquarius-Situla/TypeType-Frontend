import { expect, test } from "bun:test";
import { bilibiliBvidFromAvid, withBilibiliBvid } from "../src/lib/bilibili-av";

test("maps legacy Bilibili AV numbers to their BV IDs", () => {
  expect(bilibiliBvidFromAvid("2")).toBe("BV1xx411c7mD");
  expect(bilibiliBvidFromAvid("170001")).toBe("BV17x411w7KC");
  expect(bilibiliBvidFromAvid("1700001")).toBe("BV1ix411P7qd");
});

test("rejects AV numbers outside the supported range", () => {
  expect(bilibiliBvidFromAvid("0")).toBeNull();
  expect(bilibiliBvidFromAvid("2251799813685248")).toBeNull();
  expect(bilibiliBvidFromAvid("12a")).toBeNull();
});

test("rewrites only AV watch values and keeps the part", () => {
  expect(withBilibiliBvid("av170001")).toBe("BV17x411w7KC");
  expect(withBilibiliBvid("AV170001?p=3")).toBe("BV17x411w7KC?p=3");
  expect(withBilibiliBvid("BV17x411w7KC")).toBe("BV17x411w7KC");
  expect(withBilibiliBvid("available")).toBe("available");
});
