import type { ReactNode } from "react";
import { useSettings } from "../hooks/use-settings";
import { videoGridClassName } from "../lib/layout-preferences";
import { m } from "../paraglide/messages.js";
import { ScrollSentinel } from "./scroll-sentinel";
import { VideoGridSkeleton } from "./video-grid-skeleton";

type Props<T> = {
  items: T[];
  itemKey: (item: T) => string;
  render: (item: T) => ReactNode;
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => unknown;
  empty: string;
  idPrefix: string;
};

export function TwitchGrid<T>(props: Props<T>) {
  const { settings } = useSettings();
  if (props.isLoading) return <VideoGridSkeleton idPrefix={props.idPrefix} />;
  if (props.isError && props.items.length === 0) {
    return <p className="py-16 text-center text-fg-muted text-sm">{m.twitch_load_error()}</p>;
  }
  if (props.items.length === 0) {
    return <p className="py-16 text-center text-fg-muted text-sm">{props.empty}</p>;
  }
  return (
    <>
      <div className={videoGridClassName(settings.videoGridColumns)}>
        {props.items.map((item) => (
          <div key={props.itemKey(item)}>{props.render(item)}</div>
        ))}
      </div>
      {props.isFetchingNextPage && (
        <VideoGridSkeleton idPrefix={`${props.idPrefix}-next`} count={4} />
      )}
      <ScrollSentinel
        onIntersect={() => void props.fetchNextPage()}
        enabled={props.hasNextPage && !props.isFetchingNextPage}
      />
    </>
  );
}

export function TwitchDisabled() {
  return <p className="py-24 text-center text-fg-muted text-sm">{m.twitch_disabled()}</p>;
}
