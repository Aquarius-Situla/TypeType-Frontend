import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "../hooks/use-auth";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { useMobile } from "../hooks/use-mobile";
import { useSettings } from "../hooks/use-settings";
import { getStoredAdminSection } from "../lib/admin-console-section";
import { logoutSession } from "../lib/auth-session";
import { shouldHideHomeNavigation } from "../lib/default-landing";
import { m } from "../paraglide/messages.js";
import { useUiStore } from "../stores/ui-store";
import { NAV_ITEMS } from "./nav-items";

const BTN_BASE = "flex h-10 w-full items-center border-l-2 transition-colors";
const BTN_ACTIVE = "border-accent text-fg";
const BTN_INACTIVE = "border-transparent text-fg-muted hover:border-border-strong hover:text-fg";

type Props = {
  overlay?: boolean;
};

function NavIcon({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0"
      role="img"
      aria-label={label}
    >
      {children}
    </svg>
  );
}

export function Sidebar({ overlay = false }: Props) {
  useInterfaceLocale();
  const isMobile = useMobile();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const mobileOpen = useUiStore((s) => s.mobileSidebarOpen);
  const closeMobileSidebar = useUiStore((s) => s.closeMobileSidebar);
  const visualCollapsed = overlay ? false : collapsed;
  const { isAdmin, isAuthed, signOut } = useAuth();
  const { settings } = useSettings();
  const loc = useRouterState({ select: (s) => s.location });

  const adminSearch = { section: getStoredAdminSection() };
  const hideHome = shouldHideHomeNavigation(
    settings.defaultLandingPage,
    settings.hideHomeRecommendations,
  );
  const navItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.to === "/shorts" && settings.hideShorts) return false;
    if (item.to === "/" && hideHome) return false;
    return true;
  });

  const desktopShell = overlay
    ? "z-50 border-border border-r bg-app/95 shadow-2xl backdrop-blur"
    : "z-40 border-r border-border bg-app";
  const desktopMotion = overlay
    ? collapsed
      ? "pointer-events-none -translate-x-full"
      : "translate-x-0"
    : "";
  const baseClasses = isMobile
    ? `fixed top-14 left-0 bottom-0 z-50 w-72 max-w-[85vw] border-r border-border bg-app flex flex-col py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] transition-transform duration-200 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`
    : `fixed top-14 left-0 bottom-0 ${desktopShell} ${desktopMotion} flex flex-col py-4 transition-all duration-200 ${
        visualCollapsed ? "w-14" : "typetype-sidebar-expanded"
      }`;
  const sectionPadding = isMobile ? "px-3" : "px-2";
  const itemLayout = isMobile
    ? "justify-start gap-3 px-2"
    : visualCollapsed
      ? "justify-center px-0"
      : "gap-3 px-2";

  if (isMobile && !mobileOpen) return null;

  return (
    <>
      {isMobile && (
        <button
          type="button"
          aria-label={m.nav_close_sidebar()}
          className="fixed inset-0 top-14 z-40 bg-black/50"
          onClick={closeMobileSidebar}
        />
      )}
      <aside className={baseClasses}>
        <div className={`flex flex-col gap-1 ${sectionPadding}`}>
          {navItems.map((item) => {
            const aliasActive = item.activePaths?.includes(loc.pathname) ?? false;
            const label = item.label();
            return (
              <Link
                key={item.to}
                to={item.to}
                search={item.to === "/admin-console" ? adminSearch : undefined}
                activeOptions={item.to === "/" ? { exact: true } : undefined}
                className={`${BTN_BASE} ${itemLayout} ${aliasActive ? BTN_ACTIVE : ""}`}
                onClick={isMobile ? closeMobileSidebar : undefined}
                activeProps={{ className: BTN_ACTIVE }}
                inactiveProps={{ className: aliasActive ? "" : BTN_INACTIVE }}
              >
                <NavIcon label={label}>{item.icon}</NavIcon>
                {(!visualCollapsed || isMobile) && (
                  <span className="typetype-adaptive-label flex-1 text-sm font-medium leading-tight">
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {isMobile && isAuthed && (
          <div className="mt-auto px-3 pt-4">
            <button
              type="button"
              onClick={() => {
                void logoutSession();
                signOut();
                closeMobileSidebar();
              }}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border-strong bg-surface text-sm font-medium text-fg hover:bg-surface-strong"
            >
              {m.nav_sign_out()}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
