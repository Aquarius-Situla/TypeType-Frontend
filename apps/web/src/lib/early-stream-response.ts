type EarlyStream = { endpoint: string; response: Promise<Response> };

declare global {
  interface Window {
    __typetypeEarlyStream?: EarlyStream;
  }
}

/**
 * index.html asks for the stream of a Bilibili or NicoNico watch link before the app code loads,
 * for visitors without a session. The first request for that endpoint takes the answer.
 */
export function takeEarlyStreamResponse(endpoint: string): Promise<Response> | null {
  if (typeof window === "undefined") return null;
  const early = window.__typetypeEarlyStream;
  if (!early || early.endpoint !== endpoint) return null;
  window.__typetypeEarlyStream = undefined;
  return early.response;
}
