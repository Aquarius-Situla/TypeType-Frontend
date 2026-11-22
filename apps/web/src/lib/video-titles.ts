import { API_BASE as BASE } from "./env";
import { requestWithSession } from "./session-request";

type Listener = () => void;

// Matches the server's per-request cap on /videos/titles.
const BATCH_SIZE = 30;
const BATCH_DELAY_MS = 40;
const MAX_ENTRIES = 2000;

// Titles named in comments and danmaku are gathered for a short moment and read in one request, then kept for the
// session; an id without a title is remembered as null so it is never asked again.
export function createVideoTitleStore(
  fetchTitles: (ids: string[]) => Promise<Record<string, string>>,
  delayMs = BATCH_DELAY_MS,
) {
  const titles = new Map<string, string | null>();
  const queued = new Set<string>();
  const inFlight = new Set<string>();
  const listeners = new Set<Listener>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  function remember(id: string, title: string | null) {
    if (titles.size >= MAX_ENTRIES) {
      const oldest = titles.keys().next().value;
      if (oldest !== undefined) titles.delete(oldest);
    }
    titles.set(id, title);
  }

  async function flush() {
    timer = null;
    const ids = [...queued].slice(0, BATCH_SIZE);
    for (const id of ids) {
      queued.delete(id);
      inFlight.add(id);
    }
    if (queued.size > 0) timer = setTimeout(flush, delayMs);
    const found = await fetchTitles(ids).catch(() => ({}) as Record<string, string>);
    for (const id of ids) {
      inFlight.delete(id);
      remember(id, found[id] ?? null);
    }
    for (const listener of listeners) listener();
  }

  return {
    request(id: string) {
      if (titles.has(id) || queued.has(id) || inFlight.has(id)) return;
      queued.add(id);
      timer ??= setTimeout(flush, delayMs);
    },
    title(id: string): string | null {
      return titles.get(id) ?? null;
    },
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const videoTitles = createVideoTitleStore(async (ids) => {
  const query = new URLSearchParams({ ids: ids.join(",") });
  const { titles } = await requestWithSession<{ titles: Record<string, string> }>(
    `${BASE}/videos/titles?${query.toString()}`,
  );
  return titles;
});
