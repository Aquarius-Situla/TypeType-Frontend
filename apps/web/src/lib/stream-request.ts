import { API_BASE as BASE } from "./env";
import { detectProvider } from "./provider";

export function streamEndpoint(url: string, knownLive = false, preview = false): string {
  const provider = detectProvider(url);
  const path = providerStreamPath(provider, knownLive);
  return `${BASE}${path}?url=${encodeURIComponent(url)}${preview ? "&intent=preview" : ""}`;
}

export function sabrBootstrapEndpoint(url: string): string | null {
  if (detectProvider(url) !== "youtube") return null;
  return `${BASE}/streams/youtube/sabr/bootstrap?url=${encodeURIComponent(url)}`;
}

function providerStreamPath(provider: ReturnType<typeof detectProvider>, knownLive: boolean) {
  if (provider === "youtube") return knownLive ? "/streams/youtube/live" : "/streams/youtube/sabr";
  if (provider === "nicovideo") return "/streams/niconico";
  if (provider === "bilibili") return "/streams/bilibili";
  throw new Error("Unsupported video provider");
}

export function streamQueryKey(
  url: string,
  authenticated: boolean,
  ownerId?: string | null,
  knownLive = false,
): readonly ["stream", string, string] {
  const scope = authenticated && ownerId ? `auth:${ownerId}` : authenticated ? "auth" : "anon";
  return ["stream", url, knownLive ? `live:${scope}` : scope];
}

export function sabrBootstrapQueryKey(
  url: string,
  authenticated: boolean,
  ownerId?: string | null,
): readonly ["stream-bootstrap", string, string] {
  const scope = authenticated && ownerId ? `auth:${ownerId}` : authenticated ? "auth" : "anon";
  return ["stream-bootstrap", url, scope];
}
