import { expect, test } from "bun:test";
import { defaultParseSearch, defaultStringifySearch } from "@tanstack/react-router";
import { validateWatchSearch } from "../src/lib/watch-search";

const roundTrip = (search: string) =>
  defaultStringifySearch(validateWatchSearch(defaultParseSearch(search)));

test("keeps a numeric start time without quotes in the address", () => {
  expect(roundTrip("?v=aqz-KE-bpKQ&t=120")).toBe("?v=aqz-KE-bpKQ&t=120");
});

test("keeps a start time with units as written", () => {
  expect(roundTrip("?v=aqz-KE-bpKQ&t=2m07s")).toBe("?v=aqz-KE-bpKQ&t=2m07s");
});

test("drops a start time that is not a number or text", () => {
  expect(validateWatchSearch({ v: " aqz-KE-bpKQ ", t: { seconds: 5 } })).toEqual({
    v: "aqz-KE-bpKQ",
  });
});
