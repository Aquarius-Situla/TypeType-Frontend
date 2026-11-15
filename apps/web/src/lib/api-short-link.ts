import { API_BASE as BASE } from "./env";
import { requestWithSession } from "./session-request";

export async function resolveBilibiliShortLink(code: string): Promise<string> {
  const { url } = await requestWithSession<{ url: string }>(
    `${BASE}/links/b23/${encodeURIComponent(code)}`,
  );
  return url;
}
