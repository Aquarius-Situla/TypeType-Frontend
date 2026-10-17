import { useAuthStore } from "../stores/auth-store";
import { isTokenExpired } from "./jwt";

export function optionalBearer(init?: RequestInit): RequestInit | undefined {
  const token = useAuthStore.getState().token;
  if (!token || isTokenExpired(token)) return init;
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return { ...init, headers };
}

