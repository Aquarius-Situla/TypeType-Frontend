import { Link, useRouterState } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { siDiscord, siGithubsponsors, siLemmy } from "simple-icons";
import { useAuth } from "../hooks/use-auth";
import { useAuthToasts } from "../hooks/use-auth-toasts";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { useMobile } from "../hooks/use-mobile";
import { useSearchShortcut } from "../hooks/use-search-shortcut";
import { useSettings } from "../hooks/use-settings";
import { isAuthPage } from "../lib/auth-routes";
import { defaultLandingPath } from "../lib/default-landing";
import { DISCORD_INVITE_URL } from "../lib/discord";
import { LEMMY_COMMUNITY_URL } from "../lib/lemmy";
import { m } from "../paraglide/messages.js";
import { useUiStore } from "../stores/ui-store";
import { InterfaceLanguagePicker } from "./interface-language-picker";
import { NavbarAccountControls } from "./navbar-account-controls";
import { NavbarLeadingControl } from "./navbar-leading-control";
import { NavbarNotifications } from "./navbar-notifications";
import { NavbarPlayerEngineSwitch } from "./navbar-player-engine-switch";
import { NavbarSearch } from "./navbar-search";
import { NavbarServicePicker } from "./navbar-service-picker";
import { ServiceIcon } from "./service-icon";
import { Toast } from "./toast";

const SearchOverlay = lazy(() =>
  import("./search-overlay").then((module) => ({
    default: module.SearchOverlay,
  })),
);

const SPONSOR_URL = "https://github.com/sponsors/Priveetee";

const COMMUNITY_LINK =
  "inline-flex h-8 shrink-0 items-center gap-1.5 px-1 text-xs font-medium text-fg-muted hover:text-fg";

export function Navbar() {
  useInterfaceLocale();
  const [searchOpen, setSearchOpen] = useState(false);
  const toast = useAuthToasts();
  const isMobile = useMobile();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const toggleMobileSidebar = useUiStore((s) => s.toggleMobileSidebar);
  const { status, isAuthed, isGuest, isAdmin, me, signOut } = useAuth();
  const { settings } = useSettings();
  const logoTarget = defaultLandingPath(settings.defaultLandingPage) ?? "/";
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const authPage = isAuthPage(pathname);
  const canOpenSearch = !authPage;
  const showBackButton = isMobile && canOpenSearch && pathname !== "/";
  const navClass = isMobile
    ? "typetype-navbar fixed top-0 left-0 right-0 z-50 bg-app/95 backdrop-blur border-b border-border flex items-center px-2 gap-1.5"
    : "typetype-navbar fixed top-0 left-0 right-0 z-50 h-14 bg-app/95 backdrop-blur border-b border-border flex items-center px-4 gap-4";
  const navStyle: React.CSSProperties = isMobile
    ? {
        height: "calc(3.5rem + env(safe-area-inset-top, 0px))",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingLeft: "max(0.5rem, env(safe-area-inset-left, 0px))",
        paddingRight: "max(0.5rem, env(safe-area-inset-right, 0px))",
      }
    : {};

  function handleBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.assign("/");
  }

  useSearchShortcut({ enabled: canOpenSearch && isMobile, onOpen: () => setSearchOpen(true) });

  return (
    <>
      <nav className={navClass} style={navStyle}>
        <div className="flex shrink-0 items-center gap-2">
          <NavbarLeadingControl
            authPage={authPage}
            showBackButton={showBackButton}
            onBack={handleBack}
            onToggleSidebar={isMobile ? toggleMobileSidebar : toggleSidebar}
          />
          <Link to={logoTarget} className="flex shrink-0 items-center gap-2">
            <img src="/logo.svg" alt="TypeType" width={28} height={28} />
            <span className="hidden max-w-28 truncate text-fg text-sm font-semibold tracking-widest min-[430px]:inline sm:max-w-none">
              TYPETYPE
            </span>
          </Link>
          <a
            href={SPONSOR_URL}
            target="_blank"
            rel="noreferrer"
            aria-label={m.shell_support_typetype()}
            title={m.shell_support_typetype()}
            className={COMMUNITY_LINK}
          >
            <ServiceIcon
              path={siGithubsponsors.path}
              color={`#${siGithubsponsors.hex}`}
              label={m.shell_support_typetype()}
            />
            <span className="hidden sm:inline">{m.shell_support()}</span>
          </a>
          <a
            href={LEMMY_COMMUNITY_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Lemmy"
            title="Lemmy"
            className={COMMUNITY_LINK}
          >
            <ServiceIcon
              path={siLemmy.path}
              color="currentColor"
              label="Lemmy"
              className="text-fg"
            />
            <span className="hidden sm:inline">Lemmy</span>
          </a>
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Discord"
            title="Discord"
            className={COMMUNITY_LINK}
          >
            <ServiceIcon path={siDiscord.path} color={`#${siDiscord.hex}`} label="Discord" />
            <span className="hidden sm:inline">Discord</span>
          </a>
          <NavbarPlayerEngineSwitch />
        </div>

        {canOpenSearch && isMobile && (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="ml-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface-strong text-fg hover:bg-surface-soft"
            aria-label={m.shell_search()}
          >
            <Search size={18} />
          </button>
        )}

        {canOpenSearch && !isMobile && <NavbarSearch />}

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {canOpenSearch && <NavbarServicePicker compact={isMobile} />}
          {!isAuthed && <InterfaceLanguagePicker />}
          <NavbarNotifications />
          <NavbarAccountControls
            status={status}
            isAuthed={isAuthed}
            isGuest={isGuest}
            isAdmin={isAdmin}
            me={me}
            isMobile={isMobile}
            signOut={signOut}
          />
        </div>
      </nav>
      {searchOpen && canOpenSearch && (
        <Suspense fallback={null}>
          <SearchOverlay onClose={() => setSearchOpen(false)} />
        </Suspense>
      )}
      <Toast message={toast} />
    </>
  );
}
