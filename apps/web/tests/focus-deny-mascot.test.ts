import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmbedError } from "../src/components/embed-error";
import { FocusBlockedCard } from "../src/components/focus-blocked-card";
import { FocusDenyMascot } from "../src/components/focus-deny-mascot";
import { StreamError } from "../src/components/stream-error";
import {
  allFocusDenyMascotPaths,
  FOCUS_DENY_DIMENSIONS,
  focusDenyMascotSrc,
} from "../src/lib/focus-deny-mascot";

const PUBLIC = join(import.meta.dir, "..", "public");

async function renderInApp(element: React.ReactElement): Promise<string> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ["/"] }),
    routeTree: createRootRoute({ component: () => element }),
  });
  await router.load();
  return renderToStaticMarkup(
    createElement(QueryClientProvider, { client }, createElement(RouterProvider, { router })),
  );
}

test("Focus deny WebP exists in public assets", () => {
  const paths = allFocusDenyMascotPaths();
  expect(paths).toEqual(["/focus/focus-deny.webp"]);
  for (const src of paths) {
    expect(existsSync(join(PUBLIC, src))).toBe(true);
  }
  expect(FOCUS_DENY_DIMENSIONS).toEqual({ width: 1024, height: 1024 });
});

test("FocusDenyMascot renders unified transparent WebP without theme wrapper card", () => {
  const html = renderToStaticMarkup(createElement(FocusDenyMascot));
  expect(html).toContain(`src="${focusDenyMascotSrc()}"`);
  expect(html).not.toContain("bg-[#16181f]");
  expect(html).not.toContain("bg-[#ffffff]");
});

test("uses FocusDenyMascot on Watch, Embed, and Channel focus block screens", async () => {
  const expectedSrc = `src="${focusDenyMascotSrc()}"`;
  const streamBlockedHtml = await renderInApp(
    createElement(StreamError, {
      message: "Blocked by focus",
      focusBlock: {
        code: "focus_channel_blocked",
        channelUrl: "https://www.youtube.com/@example",
        channelName: "Example",
        channelAvatarUrl: "",
        videoTitle: "",
        unlockAt: null,
      },
    }),
  );
  expect(streamBlockedHtml).toContain(expectedSrc);

  const embedBlockedHtml = renderToStaticMarkup(
    createElement(EmbedError, { message: "Blocked by focus", focusBlocked: true }),
  );
  expect(embedBlockedHtml).toContain(expectedSrc);

  const embedNormalHtml = renderToStaticMarkup(
    createElement(EmbedError, { message: "Could not load stream" }),
  );
  expect(embedNormalHtml).not.toContain("/focus/");

  const channelCardHtml = await renderInApp(
    createElement(FocusBlockedCard, {
      code: "focus_channel_blocked",
      channelUrl: "https://www.youtube.com/@example",
      channelName: "Example",
    }),
  );
  expect(channelCardHtml).toContain(expectedSrc);

  const darkCardHtml = await renderInApp(
    createElement(FocusBlockedCard, {
      code: "focus_channel_blocked",
      channelUrl: "https://www.youtube.com/@example",
      channelName: "Example",
      darkSurface: true,
    }),
  );
  expect(darkCardHtml).not.toContain("/focus/");
});
