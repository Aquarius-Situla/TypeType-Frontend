import { describe, expect, test } from "bun:test";
import {
  filterMembersOnlyContent,
  filterShortFormContent,
  isMembersOnlyContentHidden,
  isShortFormContentHidden,
} from "../src/lib/video-visibility";

const publicVideo = { id: "public", requiresMembership: false };
const membersOnlyVideo = { id: "members", requiresMembership: true };

describe("members-only content visibility", () => {
  test("keeps every video when the setting is disabled", () => {
    expect(filterMembersOnlyContent([publicVideo, membersOnlyVideo], false)).toEqual([
      publicVideo,
      membersOnlyVideo,
    ]);
  });

  test("removes members-only videos when the setting is enabled", () => {
    expect(filterMembersOnlyContent([publicVideo, membersOnlyVideo], true)).toEqual([publicVideo]);
    expect(isMembersOnlyContentHidden(membersOnlyVideo, true)).toBe(true);
    expect(isMembersOnlyContentHidden(publicVideo, true)).toBe(false);
  });
});

describe("short-form content visibility", () => {
  test("hides explicitly identified short-form videos and Shorts URLs", () => {
    const short = { id: "short", isShortFormContent: true };
    const shortsUrl = { id: "https://www.youtube.com/shorts/abc123" };
    const regular = { id: "regular", isShortFormContent: false };
    expect(filterShortFormContent([short, shortsUrl, regular], true)).toEqual([regular]);
    expect(isShortFormContentHidden(short, true)).toBe(true);
    expect(isShortFormContentHidden(regular, true)).toBe(false);
  });

  test("hides direct watch URLs when stream metadata identifies a Short", () => {
    const directWatch = {
      id: "https://www.youtube.com/watch?v=abc123",
      isShortFormContent: true,
    };

    expect(isShortFormContentHidden(directWatch, true)).toBe(true);
    expect(isShortFormContentHidden(directWatch, false)).toBe(false);
  });

  test("leaves short-form videos visible when the setting is disabled", () => {
    const short = { id: "short", streamType: "short" };
    expect(filterShortFormContent([short], false)).toEqual([short]);
  });
});
