export type WatchSearch = {
  v: string;
  list?: string;
  shuffle?: string;
  t?: string | number;
};

export function validateWatchSearch(search: Record<string, unknown>): WatchSearch {
  return {
    v: typeof search.v === "string" ? search.v.trim() : "",
    ...(typeof search.list === "string" && search.list ? { list: search.list } : {}),
    ...(typeof search.shuffle === "string" && search.shuffle ? { shuffle: search.shuffle } : {}),
    ...(typeof search.t === "string" || typeof search.t === "number" ? { t: search.t } : {}),
  };
}
