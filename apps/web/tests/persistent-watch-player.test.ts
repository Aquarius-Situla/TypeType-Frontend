import { expect, test } from "bun:test";
import type { WatchStagePlayerProps } from "../src/components/watch-stage-player";
import { usePersistentWatchPlayerStore } from "../src/hooks/use-persistent-watch-player";

const props = {} as WatchStagePlayerProps;

test("keeps the player entry after its watch route detaches", () => {
  const owner = Symbol("test-player");
  const anchor = {} as HTMLElement;
  const store = usePersistentWatchPlayerStore.getState();

  store.register(owner, "stream-1", props, true, "/watch?v=stream-1&list=playlist");
  store.setAnchor(owner, anchor);
  store.setPosition({ left: 24, top: 48 });
  store.detach(owner);

  expect(usePersistentWatchPlayerStore.getState()).toMatchObject({
    position: { left: 24, top: 48 },
    entry: {
      owner,
      streamId: "stream-1",
      href: "/watch?v=stream-1&list=playlist",
      props,
      enabled: true,
      anchor: null,
      attached: false,
    },
  });

  store.close(owner);
  expect(usePersistentWatchPlayerStore.getState()).toMatchObject({ entry: null, position: null });
});

test("ignores lifecycle updates from an old route owner", () => {
  const firstOwner = Symbol("first-player");
  const secondOwner = Symbol("second-player");
  const firstAnchor = {} as HTMLElement;
  const secondAnchor = {} as HTMLElement;
  const store = usePersistentWatchPlayerStore.getState();

  store.register(firstOwner, "stream-1", props, true, "/watch?v=stream-1");
  store.register(secondOwner, "stream-2", props, true, "/watch?v=stream-2");
  store.setAnchor(firstOwner, firstAnchor);
  store.detach(firstOwner);
  store.setAnchor(secondOwner, secondAnchor);

  expect(usePersistentWatchPlayerStore.getState().entry).toMatchObject({
    owner: secondOwner,
    streamId: "stream-2",
    href: "/watch?v=stream-2",
    anchor: secondAnchor,
    attached: true,
  });

  store.close(secondOwner);
});

test("a watch page that takes the player back keeps the playing start time", () => {
  const firstOwner = Symbol("first-page");
  const returningOwner = Symbol("returning-page");
  const store = usePersistentWatchPlayerStore.getState();
  const startingAt = (startTime: number) => ({ ...props, startTime }) as WatchStagePlayerProps;

  store.register(firstOwner, "bilibili-1", startingAt(0), true, "/watch?v=bilibili-1");
  store.detach(firstOwner);
  store.register(returningOwner, "bilibili-1", startingAt(42_000), true, "/watch?v=bilibili-1");
  store.register(returningOwner, "bilibili-1", startingAt(42_000), true, "/watch?v=bilibili-1");

  expect(usePersistentWatchPlayerStore.getState().entry?.props.startTime).toBe(0);

  store.register(
    returningOwner,
    "bilibili-1",
    startingAt(90_000),
    true,
    "/watch?v=bilibili-1&t=90",
  );
  expect(usePersistentWatchPlayerStore.getState().entry?.props.startTime).toBe(90_000);

  store.close(returningOwner);
});

test("another video starts at its own time", () => {
  const firstOwner = Symbol("first-page");
  const nextOwner = Symbol("next-page");
  const store = usePersistentWatchPlayerStore.getState();

  store.register(firstOwner, "stream-1", { ...props, startTime: 5_000 }, true, "/watch?v=stream-1");
  store.register(nextOwner, "stream-2", { ...props, startTime: 30_000 }, true, "/watch?v=stream-2");

  expect(usePersistentWatchPlayerStore.getState().entry?.props.startTime).toBe(30_000);
  store.close(nextOwner);
});
