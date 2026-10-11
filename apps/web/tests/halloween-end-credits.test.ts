import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { MUSIC } from "../src/halloween/audio-assets";
import { MEME } from "../src/halloween/corridor/stick-show";
import {
  MUSIC_CREDITS,
  SOUND_CREDITS,
  VIDEO_CREDITS,
} from "../src/halloween/credits/asset-credits";
import { ROLES, SIGN_OFF } from "../src/halloween/credits/credit-roles";
import { CREDITS, creditsDue, creditsFrame } from "../src/halloween/credits/credits-timing";
import { CODE_CREDITS, IMAGE_CREDITS, MODEL_CREDITS } from "../src/halloween/credits/model-credits";

const doc = readFileSync(new URL("../../../THIRD_PARTY_ASSETS.md", import.meta.url), "utf8");
const sections = [
  MUSIC_CREDITS,
  SOUND_CREDITS,
  VIDEO_CREDITS,
  MODEL_CREDITS,
  IMAGE_CREDITS,
  CODE_CREDITS,
];

describe("end credits", () => {
  test("every asset on screen is also credited in THIRD_PARTY_ASSETS.md", () => {
    for (const section of sections) {
      for (const [title, , source] of section.credits) {
        expect(doc.includes(source), `${title} ${source}`).toBe(true);
      }
    }
  });

  test("Priveetee did everything, except the baby", () => {
    for (const [role, name] of ROLES) {
      if (role === "The Baby") expect(name).toBe("There was no baby");
      else expect(name.startsWith("Priveetee") || name.includes("by Priveetee")).toBe(true);
    }
    expect(SIGN_OFF).toBe("Happy Spooktober");
  });

  test("roll once the rickroll is over and end with the song", () => {
    const rickrollEnds = MEME.rickroll.start + MEME.rickroll.length;
    expect(creditsDue(rickrollEnds - 1)).toBe(false);
    expect(creditsDue(CREDITS.afterFinaleMs)).toBe(true);
    expect(creditsDue(null)).toBe(false);
    expect(CREDITS.endMs).toBeLessThanOrEqual(MUSIC.credits.loopEnd * 1000);
  });

  test("black first, roll, then Happy Spooktober, then done", () => {
    expect(creditsFrame(0).curtain).toBe(0);
    expect(creditsFrame(CREDITS.curtainMs).curtain).toBe(1);
    expect(creditsFrame(CREDITS.curtainMs).roll).toBe(0);
    const middle = creditsFrame(CREDITS.curtainMs + CREDITS.rollMs / 2);
    expect(middle.roll).toBeCloseTo(0.5);
    expect(middle.signOff).toBe(0);
    expect(creditsFrame(CREDITS.signOffAt + CREDITS.signOffFadeMs).signOff).toBe(1);
    expect(creditsFrame(CREDITS.endMs - 1).done).toBe(false);
    expect(creditsFrame(CREDITS.endMs).done).toBe(true);
  });
});
