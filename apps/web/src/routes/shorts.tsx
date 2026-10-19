import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { ShortsHiddenScreen } from "../components/shorts-hidden-screen";
import { ShortsPlayerShell } from "../components/shorts-player-shell";
import { useSettings } from "../hooks/use-settings";
import { resolveShortsRouteTarget } from "../lib/shorts-route";

function ShortsPage() {
  const { v } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { settings } = useSettings();
  const publicParam = resolveShortsRouteTarget(v)?.publicParam;

  useEffect(() => {
    if (!publicParam || publicParam === v) return;
    void navigate({ search: { v: publicParam }, replace: true });
  }, [navigate, publicParam, v]);

  if (settings.hideShorts) return <ShortsHiddenScreen />;
  return <ShortsPlayerShell targetUrl={v} />;
}

export const Route = createFileRoute("/shorts")({
  validateSearch: (search: Record<string, unknown>) => ({
    v: typeof search.v === "string" ? search.v.trim() : undefined,
  }),
  component: ShortsPage,
});
