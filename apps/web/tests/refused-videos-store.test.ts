import { afterEach, expect, test } from "bun:test";
import { useRefusedVideosStore } from "../src/stores/refused-videos-store";

afterEach(() => useRefusedVideosStore.setState({ refused: {} }));

test("keeps refused videos isolated by active profile", () => {
  const { refuse } = useRefusedVideosStore.getState();
  refuse("profile-a", "video-a", { id: "feedback-a", explained: false });
  refuse("profile-b", "video-a", { id: "feedback-b", explained: true });

  const refused = useRefusedVideosStore.getState().refused;
  expect(refused["profile-a"]?.["video-a"]?.id).toBe("feedback-a");
  expect(refused["profile-b"]?.["video-a"]?.id).toBe("feedback-b");
});

test("restoring a video only clears it for the selected profile", () => {
  const { refuse, restore } = useRefusedVideosStore.getState();
  refuse("profile-a", "video-a", { id: "feedback-a", explained: false });
  refuse("profile-b", "video-a", { id: "feedback-b", explained: false });

  restore("profile-a", "video-a");

  const refused = useRefusedVideosStore.getState().refused;
  expect(refused["profile-a"]).toBeUndefined();
  expect(refused["profile-b"]?.["video-a"]?.id).toBe("feedback-b");
});
