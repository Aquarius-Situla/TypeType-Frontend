import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { m } from "../../paraglide/messages.js";

type ManagedQuery = Pick<
  UseQueryResult,
  "data" | "isPending" | "isError" | "isFetching" | "refetch"
>;
type Props = {
  groups: ManagedQuery;
  channels: ManagedQuery;
  selection?: ManagedQuery;
  children: ReactNode;
};

export function GroupManagerData({
  groups,
  channels,
  selection,
  children,
}: Props): React.JSX.Element {
  const queries = selection ? [groups, channels, selection] : [groups, channels];
  const loaded = queries.every((query) => query.data !== undefined);
  const failed = queries.some((query) => query.isError);
  const refreshing = queries.some((query) => query.isFetching);
  if (queries.some((query) => query.isPending))
    return (
      <p role="status" className="py-16 text-center text-sm text-fg-muted">
        {m.sg_loading()}
      </p>
    );
  return (
    <>
      {failed && (
        <div
          role="alert"
          className="flex shrink-0 flex-wrap items-center gap-3 border border-danger/40 bg-surface px-3 py-2 text-sm"
        >
          <p className="min-w-0 flex-1 text-danger">
            {loaded ? m.sg_refresh_error() : m.sg_load_error()}
          </p>
          <button
            type="button"
            disabled={refreshing}
            className="sg-button"
            onClick={() => {
              for (const query of queries) void query.refetch();
            }}
          >
            {refreshing ? m.sg_refreshing() : m.sg_retry()}
          </button>
        </div>
      )}
      {loaded && (
        <fieldset
          disabled={failed}
          className="sg-workspace grid min-h-0 min-w-0 flex-1 gap-3 lg:grid-cols-[224px_minmax(0,1fr)]"
        >
          {children}
        </fieldset>
      )}
    </>
  );
}
