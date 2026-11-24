import { expect, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FocusRestMascot } from "../src/components/focus-rest-mascot";
import { FocusWatchScreen } from "../src/components/focus-watch-screen";
import { StreamError } from "../src/components/stream-error";
import { type FocusAiLocalOutcome, resolveFocusAiPhase } from "../src/hooks/use-focus-ai-review";
import { m } from "../src/paraglide/messages.js";

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

test("FocusWatchScreen renders questioning, rejected, cooling-off, and rest views properly", async () => {
  const videoUrl = "https://www.youtube.com/watch?v=testAi01";

  const questionHtml = await renderInApp(
    createElement(StreamError, {
      message: "Restricted",
      focusVideoUrl: videoUrl,
      focusBlock: {
        code: "focus_channel_blocked",
        channelUrl: "https://youtube.com/@other",
        channelName: "Other",
        channelAvatarUrl: "",
        videoTitle: "Physics 101",
        unlockAt: null,
        allowOnceKind: "outside_group",
        aiReviewEligible: true,
        aiRejected: false,
      },
    }),
  );
  expect(questionHtml).toContain("/focus/focus-question.webp");
  expect(questionHtml).toContain(m.focus_ai_question_outside());
  expect(questionHtml).toContain(m.focus_ai_submit());

  const rewatchQuestionHtml = await renderInApp(
    createElement(FocusWatchScreen, {
      message: "Rewatch blocked",
      videoUrl,
      focusBlock: {
        code: "focus_entertainment_rewatch_blocked",
        channelUrl: "https://youtube.com/@fun",
        channelName: "Fun",
        channelAvatarUrl: "",
        videoTitle: "Comedy Special",
        unlockAt: null,
        allowOnceKind: "entertainment_rewatch",
        aiReviewEligible: true,
        aiRejected: false,
      },
    }),
  );
  expect(rewatchQuestionHtml).toContain(m.focus_ai_question_rewatch());

  const rejectedCoolingHtml = await renderInApp(
    createElement(FocusWatchScreen, {
      message: "Comedy Special",
      videoUrl,
      focusBlock: {
        code: "focus_entertainment_rewatch_blocked",
        channelUrl: "https://youtube.com/@fun",
        channelName: "Fun",
        channelAvatarUrl: "",
        videoTitle: "Comedy Special",
        unlockAt: null,
        allowOnceKind: "entertainment_rewatch",
        aiReviewEligible: true,
        aiRejected: true,
        allowOnceCooldownMs: 3_600_000,
        allowOncePendingUnlockAt: Date.now() + 1_800_000,
      },
    }),
  );
  expect(rejectedCoolingHtml).toContain("/focus/focus-deny.webp");
  expect(rejectedCoolingHtml).toContain(m.focus_ai_rejected());
  expect(rejectedCoolingHtml).toContain(m.focus_allow_once_cancel_wait());
  expect(rejectedCoolingHtml).not.toContain("/100");

  const restHtml = renderToStaticMarkup(createElement(FocusRestMascot));
  expect(restHtml).toContain("/focus/focus-rest-");
});

test("resolveFocusAiPhase keeps rejected or unavailable outcomes across focusBlock object re-renders", () => {
  const makeFreshBlock = () => ({
    aiReviewEligible: true,
    aiRejected: false,
  });

  expect(resolveFocusAiPhase(makeFreshBlock(), null, null)).toBe("question");

  const rejectedOutcome: FocusAiLocalOutcome = "rejected";
  expect(resolveFocusAiPhase(makeFreshBlock(), null, rejectedOutcome)).toBe("rejected");
  expect(resolveFocusAiPhase(makeFreshBlock(), Date.now() + 60_000, rejectedOutcome)).toBe(
    "rejected",
  );
  expect(resolveFocusAiPhase(makeFreshBlock(), null, rejectedOutcome)).toBe("rejected");

  const unavailableOutcome: FocusAiLocalOutcome = "unavailable";
  expect(resolveFocusAiPhase(makeFreshBlock(), null, unavailableOutcome)).toBe("unavailable");
});
