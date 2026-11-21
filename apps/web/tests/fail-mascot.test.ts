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
import { allFailMascotPaths, failMascotSrc } from "../src/lib/fail-mascot";

const PUBLIC = join(import.meta.dir, "..", "public");

async function renderInRouter(element: React.ReactElement): Promise<string> {
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ["/"] }),
    routeTree: createRootRoute({ component: () => element }),
  });
  await router.load();
  return renderToStaticMarkup(createElement(RouterProvider, { router }));
}

test("every Tyme fail GIF exists in public assets", () => {
  const paths = allFailMascotPaths();
  expect(paths).toHaveLength(2);
  for (const src of paths) {
    expect(existsSync(join(PUBLIC, src))).toBe(true);
  }
});

test("resolves theme-specific fail GIFs", () => {
  expect(failMascotSrc("dark")).toBe("/fail/fail-dark.gif");
  expect(failMascotSrc("light")).toBe("/fail/fail-light.gif");
});

test("renders FailMascot for both dark and light themes", () => {
  expect(renderToStaticMarkup(createElement(FailMascot, { theme: "dark" }))).toContain(
    'src="/fail/fail-dark.gif"',
  );
  expect(renderToStaticMarkup(createElement(FailMascot, { theme: "light" }))).toContain(
    'src="/fail/fail-light.gif"',
  );
});

test("uses Tyme fail mascot on error screens while preserving specialized reactions", async () => {
  expect(
    renderToStaticMarkup(
      createElement(ChannelLoadError, { fetching: false, onRetry: () => undefined }),
    ),
  ).toContain('src="/fail/fail-dark.gif"');
  expect(
    renderToStaticMarkup(createElement(EmbedError, { message: "Could not load stream" })),
  ).toContain('src="/fail/fail-dark.gif"');
  expect(
    renderToStaticMarkup(
      createElement(EmbedError, { message: "Blocked", familyListBlocked: true }),
    ),
  ).toContain("/reactions/family-list-blocked-");

  const playerHtml = await renderInRouter(createElement(PlayerError, { onRetry: () => undefined }));
  expect(playerHtml).toContain('src="/fail/fail-dark.gif"');

  const streamHtml = await renderInRouter(
    createElement(StreamError, { message: "Stream unavailable" }),
  );
  expect(streamHtml).toContain('src="/fail/fail-dark.gif"');

  const shortsHtml = await renderInRouter(
    createElement(ShortsError, {
      message: "Short failed",
      onRetry: () => undefined,
      onNext: () => undefined,
    }),
  );
  expect(shortsHtml).toContain('src="/fail/fail-dark.gif"');

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
