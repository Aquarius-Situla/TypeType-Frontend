import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Bug,
  ListChecks,
  MonitorDot,
  Radio,
  ServerCog,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AdminAllowListSection } from "../components/admin-allow-list-section";
import { AdminBugReportsSection } from "../components/admin-bug-reports-section";
import { AdminRecommenderSection } from "../components/admin-recommender-section";
import { AdminRssSection } from "../components/admin-rss-section";
import { AdminSessionsSection } from "../components/admin-sessions-section";
import { AdminSettingsSection } from "../components/admin-settings-section";
import { AdminUsersSection } from "../components/admin-users-section";
import { SectionShell, type SectionShellItem } from "../components/section-shell";
import { Toast } from "../components/toast";
import { useAuth } from "../hooks/use-auth";
import { useInstance } from "../hooks/use-instance";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import {
  type AdminSection,
  getStoredAdminSection,
  isAdminSection,
  rememberAdminSection,
} from "../lib/admin-console-section";
import { goto } from "../lib/route-redirect";
import { m } from "../paraglide/messages.js";

function availableSections(
  isAdmin: boolean,
  isModerator: boolean,
  recommenderInstalled: boolean,
): AdminSection[] {
  if (isAdmin && recommenderInstalled) {
    return ["settings", "allow-list", "users", "sessions", "rss", "recommender", "issues"];
  }
  if (isAdmin) return ["settings", "allow-list", "users", "sessions", "rss", "issues"];
  if (isModerator) return ["issues"];
  return [];
}

function adminItems(): Record<AdminSection, SectionShellItem<AdminSection>> {
  return {
    settings: {
      key: "settings",
      label: m.admin_instance_label(),
      description: m.admin_instance_description(),
      icon: ServerCog,
    },
    "allow-list": {
      key: "allow-list",
      label: m.admin_parental_label(),
      description: m.admin_parental_description(),
      icon: ListChecks,
    },
    users: {
      key: "users",
      label: m.admin_users_label(),
      description: m.admin_users_description(),
      icon: Users,
    },
    sessions: {
      key: "sessions",
      label: m.admin_sessions_label(),
      description: m.admin_sessions_description(),
      icon: MonitorDot,
    },
    rss: {
      key: "rss",
      label: "RSS",
      description: m.admin_rss_description(),
      icon: Radio,
    },
    recommender: {
      key: "recommender",
      label: m.admin_recommender_label(),
      description: m.admin_recommender_description(),
      icon: SlidersHorizontal,
    },
    issues: {
      key: "issues",
      label: m.admin_reports_label(),
      description: m.admin_reports_description(),
      icon: Bug,
    },
  };
}

function AdminConsolePage() {
  useInterfaceLocale();
  const { isAdmin, isModerator } = useAuth();
  const { section } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin-console" });
  const [toast, setToast] = useState<string | null>(null);
  const canAccessAdmin = isAdmin || isModerator;
  const instance = useInstance();
  const sections = availableSections(
    isAdmin,
    isModerator,
    instance.data?.recommender.installed === true,
  );
  const localizedItems = adminItems();
  const items = sections.map((item) => localizedItems[item]);
  const activeSection = sections.includes(section) ? section : (sections[0] ?? "issues");

  useEffect(() => {
    if (!canAccessAdmin || section === activeSection) return;
    navigate({ search: { section: activeSection }, replace: true });
  }, [activeSection, canAccessAdmin, navigate, section]);

  useEffect(() => {
    if (!canAccessAdmin) return;
    rememberAdminSection(activeSection);
  }, [activeSection, canAccessAdmin]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!canAccessAdmin) {
    goto("/");
    return null;
  }

  return (
    <SectionShell
      title={m.admin_console_title()}
      subtitle={m.admin_console_subtitle()}
      items={items}
      active={activeSection}
      onSelect={(next) => navigate({ search: { section: next } })}
    >
      {activeSection === "settings" && isAdmin && (
        <AdminSettingsSection enabled={isAdmin} onToast={setToast} />
      )}
      {activeSection === "allow-list" && isAdmin && (
        <AdminAllowListSection enabled={isAdmin} onToast={setToast} />
      )}
      {activeSection === "users" && isAdmin && (
        <AdminUsersSection enabled={isAdmin} onToast={setToast} />
      )}
      {activeSection === "sessions" && isAdmin && <AdminSessionsSection enabled={isAdmin} />}
      {activeSection === "rss" && isAdmin && (
        <AdminRssSection enabled={isAdmin} onToast={setToast} />
      )}
      {activeSection === "recommender" && isAdmin && (
        <AdminRecommenderSection enabled={isAdmin} onToast={setToast} />
      )}
      {activeSection === "issues" && (
        <AdminBugReportsSection enabled={canAccessAdmin} isAdmin={isAdmin} onToast={setToast} />
      )}
      <Toast message={toast} />
    </SectionShell>
  );
}

export const Route = createFileRoute("/admin-console")({
  validateSearch: (search: Record<string, unknown>) => ({
    section: isAdminSection(search.section) ? search.section : getStoredAdminSection(),
  }),
  component: AdminConsolePage,
});
