import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Ban,
  Bell,
  CircleHelp,
  Download,
  Gauge,
  House,
  KeyRound,
  Languages,
  Radio,
  Server,
  Shield,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect } from "react";
import { SectionShell, type SectionShellItem } from "../components/section-shell";
import { useAuth } from "../hooks/use-auth";
import { useInstance } from "../hooks/use-instance";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import {
  getStoredSettingsSection,
  isSettingsSection,
  rememberSettingsSection,
  type SettingsSection,
} from "../lib/settings-section";
import { m } from "../paraglide/messages.js";
import { SettingsAbout } from "../settings/settings-about";
import { SettingsApi } from "../settings/settings-api";
import { SettingsBackup } from "../settings/settings-backup";
import { SettingsBlocked } from "../settings/settings-blocked";
import { SettingsLandingPage } from "../settings/settings-landing-page";
import { SettingsLanguage } from "../settings/settings-language";
import { SettingsNotifications } from "../settings/settings-notifications";
import { SettingsPlayback } from "../settings/settings-playback";
import { SettingsPrivacy } from "../settings/settings-privacy";
import { SettingsRss } from "../settings/settings-rss";
import { SettingsService } from "../settings/settings-service";
import { SettingsVideoPreferences } from "../settings/settings-video-preferences";

type Item = SectionShellItem<SettingsSection>;

type SettingsSearch = {
  section: SettingsSection;
  rssChannel?: string;
  compose?: boolean;
};

function baseItems(): Item[] {
  return [
    {
      key: "playback",
      label: m.settings_playback_label(),
      description: m.settings_playback_description(),
      icon: Gauge,
    },
    {
      key: "video",
      label: m.settings_video_label(),
      description: m.settings_video_description(),
      icon: SlidersHorizontal,
    },
    {
      key: "home",
      label: m.settings_interface_label(),
      description: m.settings_interface_description(),
      icon: House,
    },
    {
      key: "service",
      label: m.settings_services_label(),
      description: m.settings_services_description(),
      icon: Server,
    },
    {
      key: "notifications",
      label: m.ui_notifications(),
      description: m.settings_notifications_description(),
      icon: Bell,
    },
    {
      key: "import",
      label: m.settings_data_label(),
      description: m.settings_data_description(),
      icon: Download,
    },
    {
      key: "api",
      label: m.settings_api_label(),
      description: m.settings_api_description(),
      icon: KeyRound,
    },
    {
      key: "privacy",
      label: m.settings_privacy_label(),
      description: m.settings_privacy_description(),
      icon: Shield,
    },
    {
      key: "blocked",
      label: m.settings_blocked_label(),
      description: m.settings_blocked_description(),
      icon: Ban,
    },
    {
      key: "about",
      label: m.settings_about_label(),
      description: m.settings_about_description(),
      icon: CircleHelp,
    },
  ];
}

function settingsItems(showRss: boolean): Item[] {
  const base = baseItems();
  const items = [
    base[0],
    base[1],
    base[2],
    {
      key: "language",
      label: m.settings_language_label(),
      description: m.settings_language_description(),
      icon: Languages,
    } as Item,
    ...base.slice(3),
  ];
  if (showRss)
    items.splice(items.length - 1, 0, {
      key: "rss",
      label: "RSS",
      description: m.settings_rss_description(),
      icon: Radio,
    });
  return items;
}

function SettingsPage() {
  useInterfaceLocale();
  const { authReady, isAuthed, isGuest } = useAuth();
  const instance = useInstance();
  const { section, rssChannel, compose } = Route.useSearch();
  const navigate = useNavigate({ from: "/settings" });
  const showRss = instance.data?.rss.enabled === true && isAuthed && !isGuest;
  const items = settingsItems(showRss);
  const pendingRssDecision = section === "rss" && (!authReady || instance.isPending);
  const activeSection = pendingRssDecision
    ? "rss"
    : items.some((item) => item.key === section)
      ? section
      : items[0].key;

  useEffect(() => {
    if (section === activeSection) return;
    navigate({ search: { section: activeSection }, replace: true });
  }, [activeSection, navigate, section]);

  useEffect(() => {
    rememberSettingsSection(activeSection);
  }, [activeSection]);

  return (
    <SectionShell
      title={m.settings_title()}
      subtitle={m.settings_subtitle()}
      items={items}
      active={activeSection}
      onSelect={(next) => navigate({ search: { section: next } })}
    >
      {activeSection === "playback" && <SettingsPlayback />}
      {activeSection === "video" && <SettingsVideoPreferences />}
      {activeSection === "home" && <SettingsLandingPage />}
      {activeSection === "language" && <SettingsLanguage />}
      {activeSection === "service" && <SettingsService />}
      {activeSection === "notifications" && <SettingsNotifications />}
      {activeSection === "import" && <SettingsBackup />}
      {activeSection === "api" && <SettingsApi />}
      {activeSection === "privacy" && <SettingsPrivacy />}
      {activeSection === "blocked" && <SettingsBlocked />}
      {activeSection === "rss" && showRss && (
        <SettingsRss initialChannel={rssChannel ?? null} openComposer={compose === true} />
      )}
      {activeSection === "rss" && pendingRssDecision && (
        <div className="border-y border-border py-5 text-sm text-fg-muted">
          {m.ui_loading_rss_settings()}
        </div>
      )}
      {activeSection === "about" && <SettingsAbout />}
    </SectionShell>
  );
}

export const Route = createFileRoute("/settings")({
  validateSearch: (search: Record<string, unknown>): SettingsSearch => {
    const result: SettingsSearch = {
      section: isSettingsSection(search.section) ? search.section : getStoredSettingsSection(),
    };
    if (typeof search.rssChannel === "string") result.rssChannel = search.rssChannel;
    if (search.compose === true || search.compose === "true") result.compose = true;
    return result;
  },
  component: SettingsPage,
});
