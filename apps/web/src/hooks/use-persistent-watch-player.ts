import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { create } from "zustand";
import type { WatchStagePlayerProps } from "../components/watch-stage-player";

type PlayerOwner = symbol;

type PersistentWatchPlayerEntry = {
  owner: PlayerOwner;
  streamId: string;
  href: string;
  props: WatchStagePlayerProps;
  enabled: boolean;
  anchor: HTMLElement | null;
  attached: boolean;
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

export const usePersistentWatchPlayerStore = create<PersistentWatchPlayerStore>((set) => ({
  entry: null,
  position: null,
  register: (owner, streamId, props, enabled, href) =>
    set((state) => ({
      entry: {
        owner,
        streamId,
        href,
        props,
        enabled,
        anchor: state.entry?.owner === owner ? state.entry.anchor : null,
        attached: state.entry?.owner === owner ? state.entry.attached : false,
      },
    })),
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
    register(owner, streamId, props, enabled, window.location.pathname + window.location.search);
    setAnchor(owner, anchorElementRef.current);
  }, [enabled, owner, props, register, setAnchor, streamId]);

  useEffect(() => () => detach(owner), [detach, owner]);

  return { anchorRef };
}
