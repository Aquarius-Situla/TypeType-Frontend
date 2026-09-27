import { siBilibili, siNiconico, siYoutube } from "simple-icons";
import type { ServiceId } from "../types/user";

export type ServiceOption = {
  id: ServiceId;
  label: string;
  path: string;
  color: string;
};

export const SERVICE_OPTIONS: ServiceOption[] = [
  { id: 0, label: "YouTube", path: siYoutube.path, color: "#FF0000" },
  { id: 6, label: "NicoNico", path: siNiconico.path, color: "#aaaaaa" },
  { id: 5, label: "BiliBili", path: siBilibili.path, color: "#00A1D6" },
];

export function serviceAlternatives(activeService: ServiceId): ServiceOption[] {
  return SERVICE_OPTIONS.filter((service) => service.id !== activeService);
}

export type ServiceNavigation =
  | { to: "/search"; search: { q: string; service: ServiceId } }
  | { to: "/bilibili-session" }
  | { to: "/youtube-session"; search: { returnTo: undefined } };

export function nextServiceRoute(
  pathname: string,
  searchStr: string,
  service: ServiceId,
): ServiceNavigation | null {
  if (pathname === "/youtube-session" && service === 5) return { to: "/bilibili-session" };
  if (pathname === "/bilibili-session" && service === 0) {
    return { to: "/youtube-session", search: { returnTo: undefined } };
  }
  if (pathname !== "/search") return null;
  const q = new URLSearchParams(searchStr).get("q") ?? "";
  return { to: "/search", search: { q, service } };
}
