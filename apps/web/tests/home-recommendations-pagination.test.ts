import { expect, test } from "bun:test";
import { shouldAutoLoadEmptyHomePage } from "../src/lib/home-recommendations-pagination";

const emptyPage = {
  itemCount: 0,
  pageCount: 1,
  hasNextPage: true,
  isLoading: false,
  isPreparing: false,
  isError: false,
  isFetchingNextPage: false,
};

test("automatically advances through a bounded number of filtered empty pages", () => {
  expect(shouldAutoLoadEmptyHomePage(emptyPage)).toBe(true);
  expect(shouldAutoLoadEmptyHomePage({ ...emptyPage, pageCount: 2 })).toBe(true);
  expect(shouldAutoLoadEmptyHomePage({ ...emptyPage, pageCount: 3 })).toBe(false);
});

test("does not auto-advance when there are items or pagination cannot continue", () => {
  expect(shouldAutoLoadEmptyHomePage({ ...emptyPage, itemCount: 1 })).toBe(false);
  expect(shouldAutoLoadEmptyHomePage({ ...emptyPage, hasNextPage: false })).toBe(false);
  expect(shouldAutoLoadEmptyHomePage({ ...emptyPage, isFetchingNextPage: true })).toBe(false);
  expect(shouldAutoLoadEmptyHomePage({ ...emptyPage, isLoading: true })).toBe(false);
  expect(shouldAutoLoadEmptyHomePage({ ...emptyPage, isPreparing: true })).toBe(false);
  expect(shouldAutoLoadEmptyHomePage({ ...emptyPage, isError: true })).toBe(false);
});
