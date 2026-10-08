export const allowedText = new Set([
  "TYPETYPE",
  "TypeType",
  "Lemmy",
  "OpenMoji",
  "takeout.google.com",
  "2x",
  "x",
  "T",
  "GitHub",
  "Google",
  "YouTube",
  "NicoNico",
  "BiliBili",
  "RSS",
  "HDR",
  "3D",
  "4K",
  "backward",
  "forward",
  "previous",
  "next",
  "dark",
  "light",
  "members_only",
  "delete",
  "B2Y",
]);

export const allowedFiles = new Set([
  "apps/web/src/lib/languages.ts",
  "apps/web/src/lib/openmoji-catalog.ts",
  "apps/web/src/settings/settings-focus-mode.tsx",
  "apps/web/src/components/b2y-modal.tsx",
  "apps/web/src/settings/settings-ai-subtitles.tsx",
  "apps/web/src/components/ai-subtitles-modal.tsx",
]);

export const allowedTechnicalText = new Map([
  ["apps/web/src/components/portability-import-panel.tsx", new Set(["queryClient.setQueryData"])],
  ["apps/web/src/components/video-player-layout.tsx", new Set(["height"])],
  [
    "apps/web/src/components/watch-actions.tsx",
    new Set(["B2Y", "B2Y 弹幕 (已联动)", "B2Y 弹幕", "AI 字幕"]),
  ],
  ["apps/web/src/hooks/use-interface-locale.tsx", new Set(["Promise"])],
  ["apps/web/src/routes/youtube-session.tsx", new Set(["unknown"])],
  [
    "apps/web/src/settings/settings-about.tsx",
    new Set(["Frontend", "Server", "Token", "Downloader"]),
  ],
  [
    "apps/web/src/routes/settings.tsx",
    new Set([
      "Self-Discipline",
      "Digital detox, study & entertainment decay",
      "AI Subtitles",
      "LLM endpoint, model & bilingual subtitles",
    ]),
  ],
]);

export const propertySourceFiles = new Set([
  "apps/web/src/lib/bug-report-utils.ts",
  "apps/web/src/lib/channel-sort.ts",
  "apps/web/src/lib/playlist-sort.ts",
  "apps/web/src/lib/search-filter-selection.ts",
  "apps/web/src/lib/sponsorblock-settings.ts",
  "apps/web/src/lib/video-availability.ts",
  "apps/web/src/routes/settings.tsx",
]);

export const helperSourceFiles = new Set([
  "apps/web/src/lib/format.ts",
  "apps/web/src/lib/profile-errors.ts",
  "apps/web/src/lib/profile-validation.ts",
  "apps/web/src/lib/restore-time.ts",
]);
