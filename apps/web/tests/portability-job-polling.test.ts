import { expect, test } from "bun:test";
import { ApiError } from "../src/lib/api";
import { shouldPollPortabilityJob } from "../src/lib/portability-job-polling";

test("polls a portability job while it is pending", () => {
  expect(shouldPollPortabilityJob(undefined, undefined)).toBe(true);
  expect(shouldPollPortabilityJob(undefined, "queued")).toBe(true);
  expect(shouldPollPortabilityJob(undefined, "analyzing")).toBe(true);
  expect(shouldPollPortabilityJob(undefined, "applying")).toBe(true);
});

test("stops polling terminal portability jobs", () => {
  expect(shouldPollPortabilityJob(undefined, "ready")).toBe(false);
  expect(shouldPollPortabilityJob(undefined, "completed")).toBe(false);
  expect(shouldPollPortabilityJob(undefined, "failed")).toBe(false);
  expect(shouldPollPortabilityJob(undefined, "cancelled")).toBe(false);
});

test("stops polling a missing portability job", () => {
  expect(shouldPollPortabilityJob(new ApiError("Not found", 404), undefined)).toBe(false);
  expect(shouldPollPortabilityJob(new ApiError("Unavailable", 503), "queued")).toBe(true);
});
