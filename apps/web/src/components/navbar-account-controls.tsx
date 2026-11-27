import { Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { logoutSession } from "../lib/auth-session";
import { goto } from "../lib/route-redirect";
import { m } from "../paraglide/messages.js";
import type { AuthMe, AuthStatus } from "../types/auth";
import { NavbarProfileMenu } from "./navbar-profile-menu";
import { ThemeToggleButton } from "./theme-toggle-button";

type Props = {
  status: AuthStatus;
  isAuthed: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  me: AuthMe | null;
  isMobile: boolean;
  signOut: () => void;
};

function loginHref() {
  const path = window.location.pathname;
  const search = window.location.search;
  const redirect = `${path}${search}`;
  return `/login?redirect=${encodeURIComponent(redirect)}`;
}

function statusLabel(status: AuthStatus): string {
  if (status === "guest") return m.nav_guest();
  if (status === "authenticated") return m.nav_connected();
  if (status === "loading") return m.nav_loading();
  return m.nav_signed_out();
}

export function NavbarAccountControls({
  status,
  isAuthed,
  isGuest,
  isAdmin,
  me,
  isMobile,
  signOut,
}: Props) {
  async function handleSignOut() {
    await logoutSession();
    signOut();
  }

  if (isMobile) {
    if (!isAuthed || isGuest || !me) {
      return (
        <div className="inline-flex items-center gap-2">
          {!isAuthed && <ThemeToggleButton />}
          <a
            href={loginHref()}
            aria-label={m.nav_sign_in()}
            title={m.nav_sign_in()}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-fg hover:text-fg-muted"
          >
            <LogIn size={18} aria-hidden="true" />
          </a>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2">
        <NavbarProfileMenu me={me} isAdmin={isAdmin} isMobile onSignOut={handleSignOut} />
      </div>
    );
  }

  if (isAuthed && !isGuest && me) {
    return (
      <div className="hidden sm:inline-flex items-center gap-2">
        <NavbarProfileMenu me={me} isAdmin={isAdmin} isMobile={false} onSignOut={handleSignOut} />
      </div>
    );
  }

  return (
    <>
      <span className="hidden sm:inline text-[11px] uppercase tracking-wider text-fg-soft px-2">
        {statusLabel(status)}
      </span>
      <div className="flex items-center gap-2">
        {!isAuthed && <ThemeToggleButton />}
        <a
          href={loginHref()}
          className="inline-flex h-8 items-center rounded-sm border border-border px-3 text-xs text-fg hover:border-fg-soft"
        >
          {isGuest ? m.nav_login() : m.nav_sign_in()}
        </a>
        {isGuest ? (
          <Link
            to="/register"
            search={{ redirect: undefined }}
            className="inline-flex h-8 items-center rounded-md bg-fg px-3 text-xs text-app hover:bg-fg/90"
          >
            {m.nav_register()}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => goto("/")}
            className="hidden h-8 items-center justify-center rounded-sm px-3 text-xs text-fg-muted hover:text-fg sm:inline-flex"
          >
            {m.nav_browse()}
          </button>
        )}
      </div>
    </>
  );
}
