import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { create } from "zustand";
import type { WatchStagePlayerProps } from "../components/watch-stage-player";
import type { VideoStream } from "../types/stream";

type PlayerOwner = symbol;

type PersistentWatchPlayerEntry = {
  owner: PlayerOwner;
  streamId: string;
  href: string;
  props: WatchStagePlayerProps;
  enabled: boolean;
  anchor: HTMLElement | null;
  attached: boolean;
  stream?: VideoStream;
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
    stream?: VideoStream,
  ) => void;
  setAnchor: (owner: PlayerOwner, anchor: HTMLElement | null) => void;
  detach: (owner: PlayerOwner) => void;
  setPosition: (position: PlayerPosition) => void;
  close: (owner: PlayerOwner) => void;
};

export const usePersistentWatchPlayerStore = create<PersistentWatchPlayerStore>((set) => ({
  entry: null,
  position: null,
  register: (owner, streamId, props, enabled, href, stream) =>
    set((state) => {
      const prev = state.entry;
      const nextStream = stream ?? (prev?.owner === owner ? prev.stream : undefined);
      if (
        prev &&
        prev.owner === owner &&
        prev.streamId === streamId &&
        prev.enabled === enabled &&
        prev.href === href &&
        prev.stream === nextStream
      ) {
        prev.props = props;
        return state;
      }
      return {
        entry: {
          owner,
          streamId,
          href,
          props,
          enabled,
          anchor: prev?.owner === owner ? prev.anchor : null,
          attached: prev?.owner === owner ? prev.attached : false,
          stream: nextStream,
        },
      };
    }),
  setAnchor: (owner, anchor) =>
    set((state) => {
      if (!state.entry || state.entry.owner !== owner) return state;
      const attached = Boolean(anchor);
      if (state.entry.anchor === anchor && state.entry.attached === attached) {
        return state;
      }
      return { entry: { ...state.entry, anchor, attached } };
    }),
  detach: (owner) =>
    set((state) => {
      if (!state.entry || state.entry.owner !== owner) return state;
      if (state.entry.anchor === null && !state.entry.attached) return state;
      return { entry: { ...state.entry, anchor: null, attached: false } };
    }),
  setPosition: (position) => set({ position }),
  close: (owner) =>
    set((state) => (state.entry?.owner === owner ? { entry: null, position: null } : state)),
}));

export function usePersistentWatchPlayer(
  streamId: string,
  props: WatchStagePlayerProps,
  enabled: boolean,
  stream?: VideoStream,
) {
  const ownerRef = useRef<PlayerOwner | null>(null);
  const anchorElementRef = useRef<HTMLElement | null>(null);
  if (!ownerRef.current) ownerRef.current = Symbol("watch-player");
  const owner = ownerRef.current;
  const register = usePersistentWatchPlayerStore((state) => state.register);
  const setAnchor = usePersistentWatchPlayerStore((state) => state.setAnchor);
  const detach = usePersistentWatchPlayerStore((state) => state.detach);
  const hasEntry = usePersistentWatchPlayerStore((state) => state.entry !== null);
  const propsRef = useRef(props);
  propsRef.current = props;

  const currentEntry = usePersistentWatchPlayerStore.getState().entry;
  if (currentEntry?.owner === owner) {
    currentEntry.props = props;
  }

  const anchorRef = useCallback(
    (anchor: HTMLDivElement | null) => {
      anchorElementRef.current = anchor;
      setAnchor(owner, anchor);
    },
    [owner, setAnchor],
  );

  useLayoutEffect(() => {
    register(
      owner,
      streamId,
      propsRef.current,
      enabled,
      window.location.pathname + window.location.search,
      stream,
    );
    setAnchor(owner, anchorElementRef.current);
  }, [enabled, owner, register, setAnchor, streamId, stream]);

  useEffect(() => {
    if (!hasEntry && enabled && anchorElementRef.current) {
      register(
        owner,
        streamId,
        propsRef.current,
        enabled,
        window.location.pathname + window.location.search,
        stream,
      );
      setAnchor(owner, anchorElementRef.current);
    }
  }, [hasEntry, enabled, owner, register, setAnchor, streamId, stream]);

  useEffect(() => () => detach(owner), [detach, owner]);

  return { anchorRef };
}
