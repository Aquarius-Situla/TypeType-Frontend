import { syncAuthStoreFromStorage, useAuthStore } from "../stores/auth-store";
import type { AuthMe } from "../types/auth";
import { ApiError } from "./api";
import { fetchMe, loginAuth, logoutAuth, refreshAuth, registerAuth } from "./api-auth";
import { completeOidc } from "./api-oidc";
import { switchAccountProfile } from "./api-profiles";
import { isTokenExpired } from "./jwt";

type Credentials = {
  identifier: string;
  password: string;
};

type RegisterPayload = {
  email: string;
  password: string;
  name: string;
};

let refreshInFlight: Promise<string> | null = null;

export function isRefreshSessionRejected(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

async function hydrateSession(token: string): Promise<AuthMe> {
  const me = await fetchMe(token);
  useAuthStore.getState().setSession(token, me);
  return me;
}

async function runRefreshSession(): Promise<string> {
  const refreshed = await refreshAuth();
  await hydrateSession(refreshed.accessToken);
  return refreshed.accessToken;
}

async function runCoordinatedRefresh(): Promise<string> {
  const initialToken = useAuthStore.getState().token;
  if (typeof navigator === "undefined" || !navigator.locks) return runRefreshSession();
  return navigator.locks.request("typetype-auth-refresh", async () => {
    const storedToken = syncAuthStoreFromStorage();
    if (storedToken && storedToken !== initialToken) return storedToken;
    return runRefreshSession();
  });
}

export async function refreshSession(): Promise<string> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = runCoordinatedRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export async function bootstrapSession(): Promise<void> {
  const { token, me, setBootstrapping, setSession, setSignedOut } = useAuthStore.getState();
  if (!token) return;
  setBootstrapping();
  if (isTokenExpired(token)) {
    try {
      await refreshSession();
      return;
    } catch (refreshError) {
      if (isRefreshSessionRejected(refreshError) || !me) {
        setSignedOut();
        return;
      }
      setSession(token, me);
      return;
    }
  }
  try {
    await hydrateSession(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      try {
        await refreshSession();
        return;
      } catch (refreshError) {
        if (isRefreshSessionRejected(refreshError) || !me) {
          setSignedOut();
          return;
        }
        setSession(token, me);
        return;
      }
    }
    if (me) {
      setSession(token, me);
      return;
    }
    setSignedOut();
  }
}

export async function loginSession(payload: Credentials): Promise<void> {
  const response = await loginAuth(payload);
  await hydrateSession(response.accessToken);
}

export async function registerSession(payload: RegisterPayload): Promise<void> {
  const response = await registerAuth(payload);
  await hydrateSession(response.accessToken);
}

export async function oidcCallbackSession(payload: {
  code: string;
  state: string;
  redirectUri: string;
}): Promise<string> {
  const result = await completeOidc(payload);
  await hydrateSession(result.accessToken);
  return result.returnTo;
}

export async function switchProfileSession(profileId: string): Promise<void> {
  const result = await switchAccountProfile(profileId);
  await hydrateSession(result.accessToken);
}

export async function logoutSession(): Promise<void> {
  try {
    await logoutAuth();
  } catch {
    useAuthStore.getState().setSignedOut();
    return;
  }
  useAuthStore.getState().setSignedOut();
}
