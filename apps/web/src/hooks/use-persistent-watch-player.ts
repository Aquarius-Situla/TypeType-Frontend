import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { create } from "zustand";
import type { WatchStagePlayerProps } from "../components/watch-stage-player";

type PlayerOwner = symbol;

type ResumedStart = { requested: number; kept: number };

type PersistentWatchPlayerEntry = {
  owner: PlayerOwner;
  streamId: string;
  href: string;
  props: WatchStagePlayerProps;
  enabled: boolean;
  anchor: HTMLElement | null;
  attached: boolean;
  ended: boolean;
  replayKey: number;
  resumedStart: ResumedStart | null;
};

export type PlayerPosition = { left: number; top: number };

type PersistentWatchPlayerStore = {
  entry: PersistentWatchPlayerEntry | null;
  position: PlayerPosition | null;
  register: (
    owner: PlayerOwner,
    streamId: string,
    props: WatchStagePlayerProps,
    enabled: boolean,
    href: string,
  ) => void;
  setAnchor: (owner: PlayerOwner, anchor: HTMLElement | null) => void;
  setEnded: (owner: PlayerOwner, ended: boolean) => void;
  detach: (owner: PlayerOwner) => void;
  setPosition: (position: PlayerPosition) => void;
  close: (owner: PlayerOwner) => void;
};

// A watch page that takes the playing player back recomputes its start time from saved progress,
// which lags a few seconds behind; re-applying it would rewind non-SABR players.
function nextResumedStart(
  previous: PersistentWatchPlayerEntry | null,
  owner: PlayerOwner,
  streamId: string,
  requested: number,
  replayingEnded: boolean,
): ResumedStart | null {
  if (!previous || previous.streamId !== streamId || replayingEnded) return null;
  if (previous.owner !== owner) return { requested, kept: previous.props.startTime };
  return previous.resumedStart?.requested === requested ? previous.resumedStart : null;
}

export const usePersistentWatchPlayerStore = create<PersistentWatchPlayerStore>((set) => ({
  entry: null,
  position: null,
  register: (owner, streamId, props, enabled, href) =>
    set((state) => {
      const previous = state.entry;
      const replayingEnded = Boolean(
        previous && previous.streamId === streamId && previous.owner !== owner && previous.ended,
      );
      const resumedStart = nextResumedStart(
        previous,
        owner,
        streamId,
        props.startTime,
        replayingEnded,
      );
      const sameOwner = previous?.owner === owner;
      return {
        entry: {
          owner,
          streamId,
          href,
          props: resumedStart ? { ...props, startTime: resumedStart.kept } : props,
          enabled,
          anchor: sameOwner ? previous.anchor : null,
          attached: sameOwner ? previous.attached : false,
          ended: sameOwner && previous.streamId === streamId ? previous.ended : false,
          replayKey: replayingEnded
            ? (previous?.replayKey ?? 0) + 1
            : previous?.streamId === streamId
              ? previous.replayKey
              : 0,
          resumedStart,
        },
      };
    }),
  setAnchor: (owner, anchor) =>
    set((state) =>
      state.entry?.owner === owner
        ? { entry: { ...state.entry, anchor, attached: Boolean(anchor) } }
        : state,
    ),
  setEnded: (owner, ended) =>
    set((state) =>
      state.entry?.owner === owner && state.entry.ended !== ended
        ? { entry: { ...state.entry, ended } }
        : state,
    ),
  detach: (owner) =>
    set((state) =>
      state.entry?.owner === owner
        ? { entry: { ...state.entry, anchor: null, attached: false } }
        : state,
    ),
  setPosition: (position) => set({ position }),
  close: (owner) =>
    set((state) => (state.entry?.owner === owner ? { entry: null, position: null } : state)),
}));

export function usePersistentWatchPlayer(
  streamId: string,
  props: WatchStagePlayerProps,
  enabled: boolean,
) {
  const ownerRef = useRef<PlayerOwner | null>(null);
  const anchorElementRef = useRef<HTMLElement | null>(null);
  if (!ownerRef.current) ownerRef.current = Symbol("watch-player");
  const owner = ownerRef.current;
  const register = usePersistentWatchPlayerStore((state) => state.register);
  const setAnchor = usePersistentWatchPlayerStore((state) => state.setAnchor);
  const setEnded = usePersistentWatchPlayerStore((state) => state.setEnded);
  const detach = usePersistentWatchPlayerStore((state) => state.detach);
  const anchorRef = useCallback(
    (anchor: HTMLDivElement | null) => {
      anchorElementRef.current = anchor;
      setAnchor(owner, anchor);
    },
    [owner, setAnchor],
  );

  useLayoutEffect(() => {
    const trackedProps: WatchStagePlayerProps = {
      ...props,
      onPlay: () => {
        setEnded(owner, false);
        props.onPlay();
      },
      onSeeked: () => {
        setEnded(owner, false);
        props.onSeeked();
      },
      onEnded: () => {
        setEnded(owner, true);
        props.onEnded();
      },
    };
    register(
      owner,
      streamId,
      trackedProps,
      enabled,
      window.location.pathname + window.location.search,
    );
    setAnchor(owner, anchorElementRef.current);
  }, [enabled, owner, props, register, setAnchor, setEnded, streamId]);

  useEffect(() => () => detach(owner), [detach, owner]);

  return { anchorRef };
}
