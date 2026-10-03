import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef } from "react";
import { AppFooter } from "../components/app-footer";
import { AuthBackdrop } from "../components/auth-backdrop";
import { GuestDisabledScreen } from "../components/guest-disabled-screen";
import { MobileTabBar } from "../components/mobile-tab-bar";
import { Navbar } from "../components/navbar";
import { NotFoundPage } from "../components/not-found-page";
import { PersistentWatchPlayer } from "../components/persistent-watch-player";
import { Sidebar } from "../components/sidebar";
import { useAuth } from "../hooks/use-auth";
import { useInstance } from "../hooks/use-instance";
import { useMobile } from "../hooks/use-mobile";
import { useRegisterStatus } from "../hooks/use-register-status";
import { useSessionActivityReporting } from "../hooks/use-session-activity-reporting";
import {
  isAdminRoute,
  isAuthPage,
  requiresAuth,
  shouldEnforceBootstrapRegistration,
} from "../lib/auth-routes";
import { bootstrapSession } from "../lib/auth-session";
import { isEmbeddedFrame } from "../lib/embed-access";
import { applyTheme } from "../lib/theme";
import { m } from "../paraglide/messages.js";
import { subscribeAuthStorage, useAuthStore } from "../stores/auth-store";
import { useThemeStore } from "../stores/theme-store";
import { useUiStore } from "../stores/ui-store";
import { useWatchLayoutStore } from "../stores/watch-layout-store";

function AuthShell() {
  return (
    <AuthBackdrop contentClassName="flex min-h-screen items-center justify-center px-4 py-8">
      <Outlet />
    </AuthBackdrop>
  );
}

function RootLayoutContent() {
  const isMobile = useMobile();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useUiStore((s) => s.setSidebarCollapsed);
  const closeMobileSidebar = useUiStore((s) => s.closeMobileSidebar);
  const theme = useThemeStore((s) => s.theme);
  const cinemaMode = useWatchLayoutStore((s) => s.cinemaMode);
  const { isAuthed, isAdmin, isGuest, status } = useAuth();
  const setSignedOut = useAuthStore((s) => s.setSignedOut);
  const { data: instance } = useInstance();
  const location = useRouterState({ select: (state) => state.location });
  const notFoundPage = useRouterState({
    select: (state) => state.matches.some((match) => match.status === "notFound"),
  });
  const pathname = location.pathname;
  const pathWithSearch = `${pathname}${location.searchStr}`;
  const hideEverythingPage = pathname === "/hide-everything";
  const shortsPage = pathname === "/shorts";
  const embedPage = pathname.startsWith("/embed/");
  const framedEmbedPage = embedPage && isEmbeddedFrame();
  const registerStatus = useRegisterStatus(status !== "loading" && !framedEmbedPage);
  const watchPage = pathname === "/watch";
  const watchCinemaPage = pathname === "/watch" && cinemaMode;
  const wasWatchCinemaPage = useRef(watchCinemaPage);
  useSessionActivityReporting(!framedEmbedPage);

  useEffect(() => {
    if (framedEmbedPage) return;
    void bootstrapSession();
  }, [framedEmbedPage]);

  useEffect(() => subscribeAuthStorage(), []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const loader = document.getElementById("app-loader");
    if (!loader) return;
    loader.remove();
  }, []);

  useEffect(() => {
    if (!isMobile) closeMobileSidebar();
  }, [isMobile, closeMobileSidebar]);

  useLayoutEffect(() => {
    if (watchCinemaPage && !wasWatchCinemaPage.current && !isMobile) {
      setSidebarCollapsed(true);
    }
    wasWatchCinemaPage.current = watchCinemaPage;
  }, [watchCinemaPage, isMobile, setSidebarCollapsed]);

  useEffect(() => {
    if (status === "loading") return;
    if (registerStatus.data?.bootstrapAvailable && shouldEnforceBootstrapRegistration(pathname)) {
      setSignedOut();
      if (pathname !== "/register") {
        const redirect = isAuthPage(pathname)
          ? ""
          : `?redirect=${encodeURIComponent(pathWithSearch)}`;
        window.location.replace(`/register${redirect}`);
      }
      return;
    }
    if (!isAuthed && isAdminRoute(pathname)) {
      const redirect = encodeURIComponent(pathWithSearch);
      window.location.replace(`/login?redirect=${redirect}`);
      return;
    }
    if (!isAuthed && requiresAuth(pathname)) {
      const redirect = encodeURIComponent(pathWithSearch);
      window.location.replace(`/login?redirect=${redirect}`);
      return;
    }
    if (isAdminRoute(pathname) && !isAdmin) {
      window.location.replace("/");
      return;
    }
  }, [
    isAuthed,
    isAdmin,
    registerStatus.data?.bootstrapAvailable,
    status,
    pathname,
    pathWithSearch,
    setSignedOut,
  ]);

  if (status === "loading" && (requiresAuth(pathname) || isAdminRoute(pathname))) {
    return (
      <div className="min-h-screen bg-app text-fg flex items-center justify-center">
        <p className="text-sm text-fg-muted">{m.ui_loading_session()}</p>
      </div>
    );
  }

  const authPage = isAuthPage(pathname);

  if (notFoundPage) {
    return <NotFoundPage />;
  }

  if (instance?.guestAllowed === false && (!isAuthed || isGuest) && !authPage && !embedPage) {
    return <GuestDisabledScreen />;
  }

  if (authPage) {
    return <AuthShell />;
  }

  if (hideEverythingPage) {
    return (
      <div className="min-h-screen bg-[#050806] text-white">
        <Outlet />
      </div>
    );
  }

  if (shortsPage) {
    const shortsMainClass = `transition-[margin] duration-200 ${
      isMobile ? "ml-0" : collapsed ? "ml-14" : "typetype-sidebar-offset"
    }`;
    return (
      <div className="min-h-screen bg-app text-fg">
        <Navbar />
        <Sidebar />
        <main
          className={shortsMainClass}
          style={{ paddingTop: "calc(3.5rem + env(safe-area-inset-top, 0px))" }}
        >
          <Outlet />
        </main>
      </div>
    );
  }

  if (embedPage) {
    return (
      <div className="fixed inset-0 bg-black">
        <Outlet />
      </div>
    );
  }

  const topPadding = watchPage
    ? undefined
    : { paddingTop: "calc(3.5rem + env(safe-area-inset-top, 0px))" };
  const showTabBar = isMobile && !shortsPage && !watchCinemaPage && !embedPage;
  const mainBottomPad = showTabBar
    ? "pb-[calc(env(safe-area-inset-bottom)+4.5rem)]"
    : "pb-5 sm:pb-6";
  const mainClasses = watchCinemaPage
    ? "watch-page-main transition-all duration-200 ml-0"
    : `watch-page-main px-3 sm:px-4 ${mainBottomPad} transition-all duration-200 ${
        isMobile ? "ml-0" : collapsed ? "ml-14" : "typetype-sidebar-offset"
      }`;

  return (
    <div className={`min-h-screen bg-app text-fg ${watchPage ? "watch-page-shell" : ""}`}>
      <PersistentWatchPlayer />
      <div className="watch-page-chrome">
        <Navbar />
      </div>
      {watchCinemaPage ? !isMobile && <Sidebar overlay /> : <Sidebar />}
      <main
        className={`${mainClasses} ${pathname === "/subscriptions/groups" ? "sg-page" : ""}`}
        style={topPadding}
      >
        <Outlet />
        <AppFooter />
      </main>
      {showTabBar && (
        <div className="watch-page-chrome">
          <MobileTabBar />
        </div>
      )}
    </div>
  );
}
export const Route = createRootRoute({ component: RootLayoutContent });
