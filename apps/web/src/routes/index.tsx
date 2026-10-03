import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ContinueWatching } from "../components/continue-watching";
import { HomeFallbackSection } from "../components/home-fallback-section";
import { HomeRecommendationsSection } from "../components/home-recommendations-section";
import { useAuth } from "../hooks/use-auth";
import { readCachedSettings, useSettings, writeCachedSettings } from "../hooks/use-settings";
import { fetchSettings } from "../lib/api-user";
import { defaultLandingPath, readStoredDefaultLandingPath } from "../lib/default-landing";
import { m } from "../paraglide/messages.js";
import { useAuthStore } from "../stores/auth-store";

let landingApplied = false;

function HomePage() {
  const { authReady, isAuthed } = useAuth();
  const { settings, settingsReady } = useSettings();
  const navigate = useNavigate();
  const target = defaultLandingPath(settings.defaultLandingPage);

  useEffect(() => {
    if (landingApplied || !settingsReady) return;
    if (target) {
      landingApplied = true;
      navigate({ to: target, replace: true });
    }
  }, [settingsReady, target, navigate]);

  // If a non-home landing page is active, do not render homepage contents to avoid flash
  if (target) {
    return null;
  }

  if (!authReady || !settingsReady) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <p className="text-sm text-fg-muted">{m.ui_loading_session()}</p>
      </div>
    );
  }
  const title = isAuthed ? m.ui_recommended() : m.ui_trending();
  const showRecommendations = !isAuthed || !settings.hideHomeRecommendations;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {!settings.hideContinueWatching && <ContinueWatching />}
      {showRecommendations && (
        <section className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-wider text-fg-soft">{title}</p>
          {isAuthed ? <HomeRecommendationsSection /> : <HomeFallbackSection />}
        </section>
      )}
    </div>
  );
}

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    let target = readStoredDefaultLandingPath();
    if (!target) {
      const cached = readCachedSettings();
      target = defaultLandingPath(cached.defaultLandingPage);
    }
    if (!target) {
      const token = useAuthStore.getState().token;
      if (token) {
        try {
          const settings = await fetchSettings();
          writeCachedSettings(settings);
          target = defaultLandingPath(settings.defaultLandingPage);
        } catch {}
      }
    }
    if (target) {
      throw redirect({ to: target, replace: true });
    }
  },
  component: HomePage,
});
