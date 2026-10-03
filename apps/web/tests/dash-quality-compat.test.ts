import { expect, test } from "bun:test";
import type * as dashjs from "dashjs";
import { installDashQualityCompat } from "../src/lib/dash-quality-compat";

test("maps the removed dashjs quality method to the current API", () => {
  const calls: unknown[][] = [];
  const player = {
    setRepresentationForTypeByIndex: (...args: unknown[]) => {
      calls.push(args);
    },
  } as unknown as dashjs.MediaPlayerClass;

  installDashQualityCompat(player);
  (
    player as unknown as {
      setQualityFor: (type: dashjs.MediaType, index: number, forceReplace?: boolean) => void;
    }
  ).setQualityFor("video", 3, true);

  expect(calls).toEqual([["video", 3, true]]);
});

test("keeps an existing dashjs quality method", () => {
  const calls: unknown[][] = [];
  const player = {
    setQualityFor: (...args: unknown[]) => {
      calls.push(args);
    },
    setRepresentationForTypeByIndex: () => {
      throw new Error("must not replace an existing method");
    },
  } as unknown as dashjs.MediaPlayerClass;

  installDashQualityCompat(player);
  (
    player as unknown as {
      setQualityFor: (type: dashjs.MediaType, index: number, forceReplace?: boolean) => void;
    }
  ).setQualityFor("video", 4);

  expect(calls).toEqual([["video", 4]]);
});
