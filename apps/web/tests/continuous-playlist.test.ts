import { expect, test } from "bun:test";
import { continuousPlaylist, onceShuffledPlaylist } from "../src/lib/continuous-playlist";

const identify = (id: string) => id;

test("shuffle once starts at the current video and stays stable", () => {
  const items = ["a", "b", "c", "d", "b"];
  const order = onceShuffledPlaylist(items, identify, "once:seed:c");
  expect(order[0]).toBe("c");
  expect(order).toHaveLength(4);
  expect(new Set(order).size).toBe(4);
  expect(onceShuffledPlaylist(items, identify, "once:seed:c")).toEqual(order);
});

test("continuous shuffle plays every song once before starting a new round", () => {
  const items = ["a", "b", "c", "d", "e"];
  let session = { key: "list:seed", visited: [] as string[] };
  let current = "c";
  const played = [current];
  for (let step = 0; step < items.length - 1; step += 1) {
    const plan = continuousPlaylist(items, identify, session, "list:seed", current);
    if (!plan.next) throw new Error(`round ended early after ${played.join(", ")}`);
    current = plan.next;
    session = plan.session;
    played.push(current);
  }
  expect(played).toHaveLength(items.length);
  expect(new Set(played).size).toBe(items.length);
  const nextRound = continuousPlaylist(items, identify, session, "list:seed", current);
  expect(nextRound.session.visited).toEqual([current]);
});

test("continuous shuffle drops songs already played in this round", () => {
  const session = { key: "list:seed", visited: ["a", "c"] };
  const plan = continuousPlaylist(["a", "b", "c", "d"], identify, session, "list:seed", "c");
  expect(plan.previous).toBe("a");
  expect(plan.next === "b" || plan.next === "d").toBe(true);
  const ids = plan.videos.map(identify);
  expect(ids.slice(0, 2)).toEqual(["a", "c"]);
  expect(new Set(ids)).toEqual(new Set(["a", "b", "c", "d"]));
  expect(ids.slice(2)).toHaveLength(2);
  expect(plan.session.visited).toEqual(["a", "c"]);
});

test("continuous shuffle restarts the round instead of dead ending", () => {
  const session = { key: "list:seed", visited: ["a", "b", "c"] };
  const plan = continuousPlaylist(["a", "b", "c"], identify, session, "list:seed", "c");
  expect(plan.next).toBeDefined();
  expect(plan.next === "a" || plan.next === "b").toBe(true);
  expect(plan.session.visited).toEqual(["c"]);
});

test("a different session key resets the played history", () => {
  const session = { key: "other", visited: ["b", "c"] };
  const plan = continuousPlaylist(["a", "b", "c"], identify, session, "list:seed", "a");
  expect(plan.session).toEqual({ key: "list:seed", visited: ["a"] });
  expect(new Set(plan.videos)).toEqual(new Set(["a", "b", "c"]));
});

test("songs removed from the playlist leave the history", () => {
  const session = { key: "list:seed", visited: ["removed", "a"] };
  const plan = continuousPlaylist(["a", "new"], identify, session, "list:seed", "a");
  expect(plan.previous).toBeUndefined();
  expect(plan.next).toBe("new");
});
