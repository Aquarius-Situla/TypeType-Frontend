import { describe, expect, test } from "bun:test";
import { type PlaylistSortMode, sortPlaylistVideos } from "../src/lib/playlist-sort";
import type { PlaylistVideoItem } from "../src/types/user";

function playlistVideo(id: string, position: number, addedAt: number): PlaylistVideoItem {
  return {
    id,
    url: `https://www.youtube.com/watch?v=${id}`,
    title: id,
    thumbnail: "",
    duration: 0,
    position,
    addedAt,
    watchPosition: 0,
    watched: false,
    progressUpdatedAt: 0,
  };
}

function sortedIds(videos: PlaylistVideoItem[], mode: PlaylistSortMode): string[] {
  return sortPlaylistVideos(videos, mode).map((video) => video.id);
}

describe("playlist sorting", () => {
  const videos = [
    playlistVideo("imported-oldest", 2, 100),
    playlistVideo("newly-added", 0, 300),
    playlistVideo("imported-middle", 1, 200),
  ];

  test("sorts the complete collection before a visible batch is selected", () => {
    const newestBatch = sortPlaylistVideos(videos, "added-new").slice(0, 2);
    const oldestBatch = sortPlaylistVideos(videos, "added-old").slice(0, 2);

    expect(newestBatch.map((video) => video.id)).toEqual(["newly-added", "imported-middle"]);
    expect(oldestBatch.map((video) => video.id)).toEqual(["imported-oldest", "imported-middle"]);
  });

  test("preserves imported manual order", () => {
    expect(sortedIds(videos, "manual")).toEqual([
      "newly-added",
      "imported-middle",
      "imported-oldest",
    ]);
  });

  test("does not mutate the API result", () => {
    const originalOrder = videos.map((video) => video.id);

    sortPlaylistVideos(videos, "added-old");

    expect(videos.map((video) => video.id)).toEqual(originalOrder);
  });

  test("sorts collections by natural episode numbers in manual mode", () => {
    const epVideos = [
      { ...playlistVideo("ep-106", 0, 10), title: "106.【高中物理必修二】恒定加速度启动" },
      { ...playlistVideo("ep-100", 1, 20), title: "100.【高中物理必修二】功的概念" },
      { ...playlistVideo("ep-105", 2, 30), title: "105.【高中物理必修二】恒定功率启动" },
      { ...playlistVideo("ep-101", 3, 40), title: "101.【高中物理必修二】功的计算" },
    ];
    const sorted = sortPlaylistVideos(epVideos, "manual", true);
    expect(sorted.map((v) => v.id)).toEqual(["ep-100", "ep-101", "ep-105", "ep-106"]);
  });
});
