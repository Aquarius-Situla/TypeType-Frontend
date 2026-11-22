import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChannelLoadError } from "../src/components/channel-load-error";
import { EmbedError } from "../src/components/embed-error";
import { FailMascot } from "../src/components/fail-mascot";
import { PlayerError } from "../src/components/player-error";
import { ShortsError } from "../src/components/shorts-error";
import { StreamError } from "../src/components/stream-error";
import { allFailMascotPaths, FAIL_MASCOT_DIMENSIONS, failMascotSrc } from "../src/lib/fail-mascot";

const PUBLIC = join(import.meta.dir, "..", "public");

async function renderInRouter(element: React.ReactElement): Promise<string> {
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ["/"] }),
    routeTree: createRootRoute({ component: () => element }),
  });
  await router.load();
  return renderToStaticMarkup(createElement(RouterProvider, { router }));
}

test("Tyme video-error WebP exists in public assets", () => {
  const paths = allFailMascotPaths();
  expect(paths).toEqual(["/reactions/video-error.webp"]);
  for (const src of paths) {
    expect(existsSync(join(PUBLIC, src))).toBe(true);
  }
  expect(FAIL_MASCOT_DIMENSIONS).toEqual({ width: 600, height: 448 });
});

test("FailMascot renders unified transparent video-error WebP", () => {
  const html = renderToStaticMarkup(createElement(FailMascot));
  expect(html).toContain(`src="${failMascotSrc()}"`);
  expect(html).not.toContain("bg-[#fdfefe]");
});

test("uses Tyme fail mascot on error screens while preserving specialized reactions", async () => {
  const expectedSrc = `src="${failMascotSrc()}"`;
  expect(
    renderToStaticMarkup(
      createElement(ChannelLoadError, { fetching: false, onRetry: () => undefined }),
    ),
  ).toContain(expectedSrc);
  expect(
    renderToStaticMarkup(createElement(EmbedError, { message: "Could not load stream" })),
  ).toContain(expectedSrc);
  expect(
    renderToStaticMarkup(
      createElement(EmbedError, { message: "Blocked", familyListBlocked: true }),
    ),
  ).toContain("/reactions/family-list-blocked-");

  const playerHtml = await renderInRouter(createElement(PlayerError, { onRetry: () => undefined }));
  expect(playerHtml).toContain(expectedSrc);

  const streamHtml = await renderInRouter(
    createElement(StreamError, { message: "Stream unavailable" }),
  );
  expect(streamHtml).toContain(expectedSrc);

  const shortsHtml = await renderInRouter(
    createElement(ShortsError, {
      message: "Short failed",
      onRetry: () => undefined,
      onNext: () => undefined,
    }),
  );
  expect(shortsHtml).toContain(expectedSrc);

  const shortsReconnectHtml = await renderInRouter(
    createElement(ShortsError, {
      message: "Reconnect",
      onRetry: () => undefined,
      onNext: () => undefined,
      youtubeSessionAction: "reconnect",
      youtubeSessionReturnTo: "/shorts",
    }),
  );
  expect(shortsReconnectHtml).toContain("/reactions/youtube-reconnect-");
});
