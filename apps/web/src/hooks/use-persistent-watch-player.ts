import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { create } from "zustand";
import type { WatchStagePlayerProps } from "../components/watch-stage-player";
import { createRegisterLoopProbe } from "../lib/register-loop-probe";

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
): ResumedStart | null {
  if (!previous || previous.streamId !== streamId) return null;
  if (previous.owner !== owner) return { requested, kept: previous.props.startTime };
  return previous.resumedStart?.requested === requested ? previous.resumedStart : null;
}

export const usePersistentWatchPlayerStore = create<PersistentWatchPlayerStore>((set) => ({
  entry: null,
  position: null,
  register: (owner, streamId, props, enabled, href) =>
    set((state) => {
      const resumedStart = nextResumedStart(state.entry, owner, streamId, props.startTime);
      return {
        entry: {
          owner,
          streamId,
          href,
          props: resumedStart ? { ...props, startTime: resumedStart.kept } : props,
          enabled,
          anchor: state.entry?.owner === owner ? state.entry.anchor : null,
          attached: state.entry?.owner === owner ? state.entry.attached : false,
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
  const probeRef = useRef<ReturnType<typeof createRegisterLoopProbe> | null>(null);
  probeRef.current ??= createRegisterLoopProbe();
  const owner = ownerRef.current;
  const register = usePersistentWatchPlayerStore((state) => state.register);
  const setAnchor = usePersistentWatchPlayerStore((state) => state.setAnchor);
  const detach = usePersistentWatchPlayerStore((state) => state.detach);
  const anchorRef = useCallback(
    (anchor: HTMLDivElement | null) => {
      anchorElementRef.current = anchor;
      setAnchor(owner, anchor);
    },
    [owner, setAnchor],
  );

  useLayoutEffect(() => {
    probeRef.current?.(streamId, enabled, props as unknown as Record<string, unknown>);
    register(owner, streamId, props, enabled, window.location.pathname + window.location.search);
    setAnchor(owner, anchorElementRef.current);
  }, [enabled, owner, props, register, setAnchor, streamId]);

  useEffect(() => () => detach(owner), [detach, owner]);

  return { anchorRef };
}
