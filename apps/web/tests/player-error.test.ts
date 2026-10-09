import { expect, test } from "bun:test";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PlayerError } from "../src/components/player-error";

test("keeps playback errors inside the player instead of covering the page", async () => {
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ["/"] }),
    routeTree: createRootRoute({
      component: () => createElement(PlayerError, { onRetry: () => undefined }),
    }),
  });
  await router.load();
  const html = renderToStaticMarkup(createElement(RouterProvider, { router }));
  expect(html).toContain('role="alert"');
  expect(html).toContain("aspect-video");
  expect(html).toContain("overflow-y-auto");
  expect(html).not.toContain("fixed inset-0");
});
