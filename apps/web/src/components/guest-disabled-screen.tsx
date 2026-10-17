import { Link } from "@tanstack/react-router";
import { m } from "../paraglide/messages.js";
import { AuthBackdrop } from "./auth-backdrop";

export function GuestDisabledScreen() {
  return (
    <AuthBackdrop
      fixed
      contentClassName="flex min-h-[100dvh] flex-col items-center justify-center gap-5 px-5 py-8 sm:gap-6"
    >
      <img
        src="/guest-disabled-bird.gif"
        width="498"
        height="311"
        alt=""
        className="relative z-10 w-full max-w-[min(30rem,calc(100vw-2.5rem))] rounded-2xl shadow-2xl"
      />
      <div className="relative z-10 flex max-w-md flex-col items-center gap-2 text-center drop-shadow-[0_1px_18px_rgba(0,0,0,0.26)] dark:drop-shadow-[0_1px_18px_rgba(0,0,0,0.75)]">
        <p className="text-xl font-semibold tracking-tight text-fg sm:text-2xl dark:text-white">
          {m.ui_guest_mode_disabled()}
        </p>
        <p className="text-fg-muted text-xs leading-5 sm:text-sm">
          {m.ui_the_admin_has_disabled_guest_access()}
        </p>
        <p className="text-fg-muted text-xs leading-5 sm:text-sm">
          {m.ui_to_use_this_typetype_instance_create_an_account_or_sign_in_with_an_ex()}
        </p>
      </div>
      <div className="relative z-10 flex w-full max-w-xs flex-col justify-center gap-2.5 sm:max-w-none sm:flex-row">
        <Link
          to="/register"
          search={{ redirect: undefined }}
          className="cursor-pointer rounded-md border border-white/50 bg-white/70 px-5 py-2.5 text-center text-sm font-medium text-fg shadow-lg backdrop-blur transition-colors hover:bg-white/85 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15"
        >
          {m.login_create_account()}
        </Link>
        <Link
          to="/login"
          search={{ redirect: undefined }}
          className="cursor-pointer rounded-md border border-border-strong bg-surface/70 px-5 py-2.5 text-center text-sm font-medium text-fg-muted shadow-lg backdrop-blur transition-colors hover:bg-surface-strong hover:text-fg"
        >
          {m.nav_sign_in()}
        </Link>
      </div>
    </AuthBackdrop>
  );
}
