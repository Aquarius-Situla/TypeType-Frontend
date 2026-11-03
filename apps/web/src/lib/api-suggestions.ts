import { API_BASE as BASE } from "./env";
import { requestWithSession } from "./session-request";

export function fetchSuggestions(
  query: string,
  service: number,
  signal?: AbortSignal,
): Promise<string[]> {
  const params = new URLSearchParams({ query, service: String(service) });
  return requestWithSession(`${BASE}/suggestions?${params}`, { signal });
}
