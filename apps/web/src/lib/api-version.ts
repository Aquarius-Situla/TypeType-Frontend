import { request } from "./api";
import { API_BASE as BASE } from "./env";

const VERSION_COMPONENTS = ["frontend", "server", "token", "downloader", "recommender"] as const;

export type VersionComponent = (typeof VERSION_COMPONENTS)[number];

export type ComponentVersion = {
  service: string;
  version: string;
  revision: string;
  shortRevision: string;
  buildTime: string;
};

export type VersionInfo = Record<VersionComponent, ComponentVersion | null>;

const VERSION_PATHS: Record<VersionComponent, string> = {
  frontend: "web",
  server: "server",
  token: "token",
  downloader: "downloader",
  recommender: "recommender",
};

export function parseComponentVersion(value: unknown): ComponentVersion | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.service !== "string" ||
    typeof candidate.version !== "string" ||
    typeof candidate.revision !== "string" ||
    typeof candidate.shortRevision !== "string" ||
    typeof candidate.buildTime !== "string"
  ) {
    return null;
  }
  return {
    service: candidate.service,
    version: candidate.version,
    revision: candidate.revision,
    shortRevision: candidate.shortRevision,
    buildTime: candidate.buildTime,
  };
}

async function fetchComponentVersion(component: VersionComponent): Promise<ComponentVersion> {
  const payload = await request<unknown>(`${BASE}/version/${VERSION_PATHS[component]}`);
  const version = parseComponentVersion(payload);
  if (!version) throw new Error(`Invalid ${component} version payload`);
  return version;
}

export async function fetchVersionInfo(): Promise<VersionInfo> {
  const results = await Promise.allSettled(VERSION_COMPONENTS.map(fetchComponentVersion));
  return Object.fromEntries(
    VERSION_COMPONENTS.map((component, index) => [
      component,
      results[index].status === "fulfilled" ? results[index].value : null,
    ]),
  ) as VersionInfo;
}
