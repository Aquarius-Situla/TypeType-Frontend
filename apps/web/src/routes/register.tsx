import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthCard } from "../components/auth-card";
import { AuthErrorBanner } from "../components/auth-error-banner";
import { OidcSignInButton } from "../components/oidc-sign-in-button";
import { Toast } from "../components/toast";
import { useAuth } from "../hooks/use-auth";
import { useOidcStatus } from "../hooks/use-oidc-status";
import { REGISTER_STATUS_KEY, useRegisterStatus } from "../hooks/use-register-status";
import { ApiError } from "../lib/api";
import { sanitizeRedirect } from "../lib/auth-routes";
import { registerSession } from "../lib/auth-session";
import { goto } from "../lib/route-redirect";
import { m } from "../paraglide/messages.js";

function RegisterPage() {
  const { isAuthed, isGuest } = useAuth();
  const queryClient = useQueryClient();
  const { redirect } = Route.useSearch();
  const target = sanitizeRedirect(redirect);
  const registerStatus = useRegisterStatus();
  const status = registerStatus.data;
  const { data: oidc } = useOidcStatus();
  const oidcEnabled = oidc?.enabled ?? false;
  const localEnabled = oidc?.localLoginEnabled ?? true;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const postAuthTarget = redirect ? target : "/import";
  const bootstrapAvailable = status?.bootstrapAvailable ?? false;

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(id);
  }, [toast]);

  const closedByPolicy = status ? !status.allowRegistration && !status.bootstrapAvailable : false;
  const subtitle = !localEnabled
    ? m.ui_local_registration_is_disabled()
    : bootstrapAvailable
      ? m.ui_first_installation_detected_set_up_the_administrator_account()
      : closedByPolicy
        ? m.ui_registrations_are_currently_closed()
        : m.ui_use_your_email_to_create_an_account_you_can_sign_in_with_email_or_use();
  const bannerMessage =
    error ?? (closedByPolicy ? m.ui_registrations_are_currently_closed() : null);

  if (isAuthed && !isGuest && status && !bootstrapAvailable) {
    goto(postAuthTarget);
    return null;
  }

  async function submitRegister(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    if (bootstrapAvailable && status) {
      queryClient.setQueryData(REGISTER_STATUS_KEY, { ...status, bootstrapAvailable: false });
    }
    try {
      await registerSession({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setToast(m.ui_account_created());
      goto(postAuthTarget);
    } catch (error) {
      await queryClient.invalidateQueries({ queryKey: REGISTER_STATUS_KEY });
      if (error instanceof ApiError && error.status === 403) {
        setError(m.ui_registration_rejected_server({ origin: window.location.origin }));
      } else {
        setError(m.ui_unable_to_create_account());
      }
    }
    setPending(false);
  }

  return (
    <div className="flex w-full items-center justify-center px-4">
      <Toast message={toast} />
      <AuthCard
        title={bootstrapAvailable ? m.ui_create_admin_account() : m.login_create_account()}
        subtitle={subtitle}
      >
        <AuthErrorBanner message={bannerMessage} />
        {oidcEnabled && (
          <div className="mb-4">
            <OidcSignInButton providerName={oidc?.providerName ?? null} returnTo={redirect} />
          </div>
        )}
        {oidcEnabled && localEnabled && (
          <div className="mb-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-fg-soft">
            <span className="h-px flex-1 bg-border" />
            {m.login_or()}
            <span className="h-px flex-1 bg-border" />
          </div>
        )}
        {!localEnabled && !oidcEnabled && (
          <p className="text-sm text-fg-muted">{m.ui_local_registration_is_disabled()}</p>
        )}
        {localEnabled && (
          <form className="flex flex-col gap-3" onSubmit={submitRegister}>
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={bootstrapAvailable ? m.ui_administrator_name() : m.ui_name()}
              className="h-10 rounded-lg border border-border-strong bg-app px-3 text-sm text-fg"
              required
            />
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={m.admin_users_email()}
              className="h-10 rounded-lg border border-border-strong bg-app px-3 text-sm text-fg"
              required
            />
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={m.login_password_placeholder()}
              className="h-10 rounded-lg border border-border-strong bg-app px-3 text-sm text-fg"
              required
            />
            <button
              type="submit"
              disabled={pending || closedByPolicy}
              className="h-10 rounded-lg bg-fg text-app text-sm font-medium disabled:opacity-60"
            >
              {closedByPolicy
                ? m.ui_registrations_closed()
                : pending
                  ? m.ui_creating_account()
                  : bootstrapAvailable
                    ? m.ui_create_admin_account()
                    : m.nav_register()}
            </button>
          </form>
        )}
        {!bootstrapAvailable && (
          <div className="mt-4 text-xs text-fg-soft">
            <Link to="/login" search={{ redirect }} className="hover:text-fg-muted">
              {m.ui_already_have_an_account_sign_in()}
            </Link>
          </div>
        )}
      </AuthCard>
    </div>
  );
}

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: RegisterPage,
});
