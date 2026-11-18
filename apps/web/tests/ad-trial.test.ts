import { expect, test } from "bun:test";
import { AD_ROTATION } from "../src/lib/ad-catalog";
import {
  lastChoiceBefore,
  TRIAL_CHAPTERS,
  TRIAL_ENDINGS,
  TRIAL_SCENES,
  TRIAL_START,
} from "../src/lib/ad-trial";

function targetsOf(name: string): string[] {
  const scene = TRIAL_SCENES[name];
  if (!scene) return [];
  if ("next" in scene) return [scene.next];
  if ("ask" in scene) return scene.ask.answers.map((answer) => answer.to);
  return [];
}

function reachable(): Set<string> {
  const seen = new Set<string>();
  const queue = [TRIAL_START];
  while (queue.length > 0) {
    const name = queue.pop();
    if (name === undefined || seen.has(name)) continue;
    seen.add(name);
    queue.push(...targetsOf(name));
  }
  return seen;
}

test("every trial choice leads to a known scene", () => {
  for (const name of Object.keys(TRIAL_SCENES)) {
    for (const target of targetsOf(name)) expect(TRIAL_SCENES[target]).toBeDefined();
  }
});

test("every trial scene is reachable and the five endings exist", () => {
  expect(reachable().size).toBe(Object.keys(TRIAL_SCENES).length);
  const endings = Object.values(TRIAL_SCENES).flatMap((scene) =>
    "ending" in scene ? [scene.ending] : [],
  );
  expect(endings.sort()).toEqual([1, 2, 3, 4, 5]);
});

test("every answer that depends on a scene names a scene the viewer can have seen", () => {
  for (const scene of Object.values(TRIAL_SCENES)) {
    if (!("ask" in scene)) continue;
    for (const answer of scene.ask.answers) {
      if (answer.needs) expect(reachable().has(answer.needs)).toBe(true);
    }
  }
});

test("an ending leads back to the choice that caused it", () => {
  expect(lastChoiceBefore("o5_fin")).toBe("o4");
  expect(lastChoiceBefore("croque_fin")).toBe("temoin");
  expect(lastChoiceBefore("boom_fin")).toBe("verdict");
  expect(lastChoiceBefore("fin1_pack")).toBe("fin1_suite");
  expect(lastChoiceBefore(TRIAL_START)).toBe(TRIAL_START);
  expect(lastChoiceBefore("not-a-scene")).toBe(TRIAL_START);
});

test("the interactive trial closes the rotation", () => {
  expect(AD_ROTATION.at(-1)?.kind).toBe("trial");
  expect(AD_ROTATION.filter((ad) => ad.kind === "classic")).toHaveLength(6);
  expect(new Set(AD_ROTATION.map((ad) => ad.id)).size).toBe(AD_ROTATION.length);
});

test("every chapter is a choice and every ending leads back to a choice", () => {
  for (const scene of TRIAL_CHAPTERS) expect("ask" in (TRIAL_SCENES[scene] ?? {})).toBe(true);
  expect(Object.keys(TRIAL_ENDINGS).map(Number)).toEqual([1, 2, 3, 4, 5]);
  for (const [number, ending] of Object.entries(TRIAL_ENDINGS)) {
    const scene = TRIAL_SCENES[ending.scene];
    expect(scene && "ending" in scene ? scene.ending : null).toBe(Number(number));
    expect("ask" in (TRIAL_SCENES[lastChoiceBefore(ending.scene)] ?? {})).toBe(true);
  }
});

test("an ending reached back from the chapter list brings the witness its answer needs", () => {
  for (const ending of Object.values(TRIAL_ENDINGS)) {
    const choice = TRIAL_SCENES[lastChoiceBefore(ending.scene)];
    if (!choice || !("ask" in choice)) continue;
    const needs = choice.ask.answers.map((answer) => answer.needs).filter(Boolean);
    if (ending.witness) expect(needs).toContain(ending.witness);
  }
});
