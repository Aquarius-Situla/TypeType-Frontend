import { expect, test } from "bun:test";
import { clockLabel, pollRemainingSeconds, pollRows, pollRunning } from "../src/lib/twitch-poll";
import type { TwitchPoll } from "../src/types/twitch";

const poll: TwitchPoll = {
  id: "p1",
  title: "Best map?",
  status: "ACTIVE",
  startedAt: "2026-11-16T20:00:00Z",
  durationSeconds: 120,
  remainingMs: 45_000,
  voters: 3,
  votes: 3,
  choices: [
    { id: "a", title: "Dust", votes: 2 },
    { id: "b", title: "Mirage", votes: 1 },
  ],
};

test("rows carry the share of votes and the leading choice", () => {
  expect(pollRows(poll)).toEqual([
    { id: "a", title: "Dust", votes: 2, percent: 67, leading: true },
    { id: "b", title: "Mirage", votes: 1, percent: 33, leading: false },
  ]);
});

test("a poll without votes has no leader", () => {
  const empty = { ...poll, choices: poll.choices.map((choice) => ({ ...choice, votes: 0 })) };
  expect(pollRows(empty).every((row) => row.percent === 0 && !row.leading)).toBe(true);
});

test("the countdown runs from the moment the poll was read", () => {
  expect(pollRunning(poll)).toBe(true);
  expect(pollRunning({ ...poll, status: "COMPLETED" })).toBe(false);
  expect(pollRemainingSeconds(poll, 1_000, 11_000)).toBe(35);
  expect(pollRemainingSeconds(poll, 1_000, 99_000)).toBe(0);
  expect(clockLabel(65)).toBe("1:05");
});
