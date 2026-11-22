import { expect, test } from "bun:test";
import { SabrMediaReadout } from "../src/lib/sabr-media-readout";

test("the element's time and duration show while the session is attached", () => {
  const readout = new SabrMediaReadout();
  expect(readout.time(42, false)).toBe(42);
  expect(readout.duration(634, false)).toBe(634);
});

test("a session swap keeps the last position and duration instead of the element's zeros", () => {
  const readout = new SabrMediaReadout();
  readout.time(61.5, false);
  readout.duration(634, false);
  expect(readout.time(0, true)).toBe(61.5);
  expect(readout.duration(0, true)).toBe(634);
});

test("a seek target shows during the swap, so the next keyboard seek counts from it", () => {
  const readout = new SabrMediaReadout();
  readout.time(61.5, false);
  readout.target(71.5);
  expect(readout.time(0, true)).toBe(71.5);
  expect(readout.time(71.6, false)).toBe(71.6);
});

test("an invalid seek target is ignored", () => {
  const readout = new SabrMediaReadout();
  readout.time(20, false);
  readout.target(Number.NaN);
  readout.target(-5);
  expect(readout.time(0, true)).toBe(0);
});
