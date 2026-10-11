import { m } from "../paraglide/messages.js";
import type { RecommenderAdminStatus } from "../types/admin";

function share(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)} %` : "–";
}

export function AdminRecommenderStatus({ status }: { status: RecommenderAdminStatus }) {
  const pages = status.pagesBuilt + status.pagesFromCache;
  const sources = status.sourceRequests + status.sourceCacheHits;
  const cells = [
    [
      m.admin_recommender_service(),
      status.reachable
        ? m.admin_recommender_reachable({ ms: status.healthMs ?? 0 })
        : m.admin_recommender_unreachable(),
    ],
    [m.admin_recommender_build_time(), m.admin_recommender_ms({ ms: status.averageBuildMs })],
    [
      m.admin_recommender_own_time(),
      m.admin_recommender_ms({ ms: status.averageRecommenderMs ?? 0 }),
    ],
    [
      m.admin_recommender_sources_time(),
      m.admin_recommender_ms({ ms: status.averageSourcesMs ?? 0 }),
    ],
    [m.admin_recommender_pages(), String(pages)],
    [m.admin_recommender_page_cache(), share(status.pagesFromCache, pages)],
    [m.admin_recommender_fallbacks(), String(status.fallbacks)],
    [m.admin_recommender_source_cache(), share(status.sourceCacheHits, sources)],
    [
      m.admin_recommender_stream_now(),
      `${status.streamRequestsThisMinute} / ${status.streamRequestsPerMinuteLimit}`,
    ],
    [m.admin_recommender_stream_refused(), String(status.streamRequestsRefused)],
  ];
  return (
    <section className="space-y-3">
      <h2 className="px-1 text-sm font-semibold text-fg">{m.admin_recommender_state()}</h2>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-4">
        {cells.map(([term, value]) => (
          <div key={term} className="flex flex-col gap-1 bg-app p-3">
            <dt className="text-xs text-fg-soft">{term}</dt>
            <dd
              className={`text-sm tabular-nums ${!status.reachable && term === m.admin_recommender_service() ? "text-danger-strong" : "text-fg"}`}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
