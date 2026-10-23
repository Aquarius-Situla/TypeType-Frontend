import { expect, test } from "bun:test";
import type * as dashjs from "dashjs";
import { buildDashStreamingSettings } from "../src/components/video-player-core";
import { installDashQualityCompat } from "../src/lib/dash-quality-compat";

test("buildDashStreamingSettings raises forward buffer targets and enables stall recovery", () => {
  const settings = buildDashStreamingSettings();
  expect(settings.buffer).toEqual({
    bufferTimeDefault: 24,
    bufferTimeAtTopQuality: 36,
    bufferTimeAtTopQualityLongForm: 60,
    bufferToKeep: 20,
  });
  expect(settings.gaps).toEqual({ enableStallFix: true });
  expect(settings.cmcd).toEqual({ enabled: false });
});

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
