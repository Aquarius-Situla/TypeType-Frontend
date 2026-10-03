import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { useSettings } from "../hooks/use-settings";
import { shouldHideHomeNavigation } from "../lib/default-landing";
import { m } from "../paraglide/messages.js";
import { useUiStore } from "../stores/ui-store";
import { NAV_ITEMS } from "./nav-items";

const BOTTOM_NAV_PATHS = ["/", "/subscriptions", "/history", "/playlists"];
const ITEM =
  "flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium leading-3 transition-colors";
const ACTIVE = "text-fg";
const INACTIVE = "text-fg-muted";

function TabIcon({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
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

export function MobileTabBar() {
  useInterfaceLocale();
  const { settings } = useSettings();
  const openMobileSidebar = useUiStore((s) => s.openMobileSidebar);
  const mobileOpen = useUiStore((s) => s.mobileSidebarOpen);
  const hideHome = shouldHideHomeNavigation(
    settings.defaultLandingPage,
    settings.hideHomeRecommendations,
  );
  const items = NAV_ITEMS.filter((item) => {
    if (item.to === "/" && hideHome) return false;
    return BOTTOM_NAV_PATHS.includes(item.to);
  });

  return (
    <nav
      aria-label={m.nav_primary()}
      className="fixed bottom-0 left-0 right-0 z-30 flex items-stretch border-t border-border bg-app pb-[env(safe-area-inset-bottom)]"
    >
      {items.map((item) => {
        const label = item.label();
        return (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={item.to === "/" ? { exact: true } : undefined}
            className={ITEM}
            activeProps={{ className: ACTIVE }}
            inactiveProps={{ className: INACTIVE }}
          >
            <TabIcon label={label}>{item.icon}</TabIcon>
            <span className="typetype-adaptive-label line-clamp-2 w-full px-0.5 text-center">
              {label}
            </span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={openMobileSidebar}
        aria-label={m.nav_open_menu()}
        aria-expanded={mobileOpen}
        className={`${ITEM} ${mobileOpen ? ACTIVE : INACTIVE}`}
      >
        <Menu size={22} className="flex-shrink-0" aria-hidden />
        <span className="typetype-adaptive-label line-clamp-2 w-full px-0.5 text-center">
          {m.nav_more()}
        </span>
      </button>
    </nav>
  );
}
