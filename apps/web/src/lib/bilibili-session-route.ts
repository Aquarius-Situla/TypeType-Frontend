export function bilibiliSessionReturnToForWatch(
  v: string,
  list?: string,
  shuffle?: string,
): string {
  const params = new URLSearchParams({ v });
  if (list) params.set("list", list);
  if (shuffle) params.set("shuffle", shuffle);
  return `/watch?${params.toString()}`;
}

export function sanitizeBilibiliSessionReturnTo(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 800) return undefined;
  let url: URL;
  try {
    url = new URL(value, "https://typetype.invalid");
  } catch {
    return undefined;
  }
  if (url.origin !== "https://typetype.invalid" || url.pathname !== "/watch") {
    return undefined;
  }
  const v = url.searchParams.get("v")?.trim();
  if (!v) return undefined;
  return `${url.pathname}?${url.searchParams.toString()}`;
}
