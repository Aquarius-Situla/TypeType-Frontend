import { describe, expect, test } from "bun:test";
import { filterPlaylistSummaries } from "../src/lib/playlist-summary";
import type { PlaylistItem } from "../src/types/user";

describe("playlist summaries", () => {
  test("keeps the server count when the list response omits videos", () => {
    const playlist: PlaylistItem = {
      id: "playlist-1",
      name: "one piece",
      description: "",
      videoCount: 82,
      createdAt: 1,
    };

    const result = filterPlaylistSummaries([playlist], (videos) => videos);

    expect(result[0]?.videoCount).toBe(82);
    expect(result[0]?.videos).toBeUndefined();
  });

  test("falls back to the visible count when the server count is absent", () => {
    const playlist: PlaylistItem = {
      id: "playlist-1",
      name: "one piece",
      description: "",
      videos: [
        {
          id: "video-1",
          url: "https://www.youtube.com/watch?v=video1",
          title: "Video",
          thumbnail: "thumbnail",
          duration: 1,
          position: 0,
          watchPosition: 0,
          watched: false,
          progressUpdatedAt: 0,
        },
      ],
      createdAt: 1,
    };

    const result = filterPlaylistSummaries([playlist], (videos) => videos);

    expect(result[0]?.videoCount).toBe(1);
  });
});
