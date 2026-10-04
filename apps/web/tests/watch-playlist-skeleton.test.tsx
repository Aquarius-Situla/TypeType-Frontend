import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { WatchPlaylistSkeleton } from "../src/components/watch-playlist-skeleton";

test("renders title and count when provided", () => {
  const html = renderToStaticMarkup(<WatchPlaylistSkeleton title="Test Playlist" count={42} />);

  expect(html).toContain("Test Playlist");
  expect(html).toContain("- / 42");
});

test("renders placeholder skeleton elements when title and count are omitted", () => {
  const html = renderToStaticMarkup(<WatchPlaylistSkeleton />);

  expect(html).toContain("animate-pulse");
  expect(html).toContain("rounded-xl border border-border bg-surface");
});
