import type { SeekbarIcon } from "../types/user";
import { toApiUrl } from "./env";

export const SEEKBAR_ICON_MAX_BYTES = 2 * 1024 * 1024;
export const SEEKBAR_ICON_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

const TYPETYPE_ICON = "/seekbar-typetype.svg";

export function seekbarIconSource(icon: SeekbarIcon, url: string): string | null {
  if (icon === "none") return null;
  if (icon === "custom" && url) return toApiUrl(url);
  return TYPETYPE_ICON;
}

export function applySeekbarIcon(source: string | null): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (source === null) {
    delete root.dataset.seekbarIcon;
    root.style.removeProperty("--typetype-seekbar-icon");
    return;
  }
  root.dataset.seekbarIcon = "true";
  root.style.setProperty("--typetype-seekbar-icon", `url("${encodeURI(source)}")`);
}
