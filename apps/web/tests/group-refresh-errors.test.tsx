import { afterEach, expect, test } from "bun:test";
import { QueryClient, QueryClientProvider, QueryObserver } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { GroupManagerData } from "../src/components/subscription-groups/group-manager-data";
import { useGroupActions } from "../src/hooks/use-subscription-groups";
import { MembershipUpdateError } from "../src/lib/api-subscription-groups";
import { m } from "../src/paraglide/messages.js";
import type { GroupedSubscription, SubscriptionGroup } from "../src/types/subscription-groups";

const cleanups: Array<() => void> = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
});

function readActions(client: QueryClient, enabled: boolean): ReturnType<typeof useGroupActions> {
  let actions: ReturnType<typeof useGroupActions> | undefined;
  function ReadActions(): null {
    actions = useGroupActions(enabled);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <ReadActions />
    </QueryClientProvider>,
  );
  if (!actions) throw new Error("Actions did not render");
  return actions;
}

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const failedReads = new Set<string>();
  const reads = { groups: 0, memberships: 0 };
  const state: { memberships: string[]; writes: number } = { memberships: [], writes: 0 };
  const group: SubscriptionGroup = {
    id: "tech",
    name: "Tech",
    channelCount: 0,
    createdAt: 0,
    updatedAt: 0,
  };
  const channel: GroupedSubscription = {
    channelUrl: "https://www.youtube.com/channel/example",
    name: "Example",
    avatarUrl: "",
    subscribedAt: 0,
    groupIds: [],
  };
  const groupKey = ["subscription-groups", "profile"];
  const channelKey = ["subscription-group-memberships", "profile"];
  client.setQueryData(groupKey, [group]);
  client.setQueryData(channelKey, [channel]);
  const groups = new QueryObserver(client, {
    queryKey: groupKey,
    staleTime: Infinity,
    queryFn: async () => {
      reads.groups++;
      if (failedReads.has("groups")) throw new Error("Group refresh unavailable");
      return [{ ...group, channelCount: state.memberships.length ? 1 : 0 }];
    },
  });
  const channels = new QueryObserver(client, {
    queryKey: channelKey,
    staleTime: Infinity,
    queryFn: async () => {
      reads.memberships++;
      if (failedReads.has("memberships")) throw new Error("Membership refresh unavailable");
      return [{ ...channel, groupIds: [...state.memberships] }];
    },
  });
  const unsubscribers = [groups.subscribe(() => {}), channels.subscribe(() => {})];
  cleanups.push(() => {
    for (const unsubscribe of unsubscribers) unsubscribe();
    client.clear();
  });
  return {
    client,
    groups,
    channels,
    state,
    reads,
    failedReads,
    write: async () => {
      state.writes++;
      state.memberships = ["tech"];
    },
    retry: () => Promise.all([groups.refetch(), channels.refetch()]),
    actions: () =>
      readActions(
        client,
        groups.getCurrentResult().isSuccess && channels.getCurrentResult().isSuccess,
      ),
    render: () =>
      renderToStaticMarkup(
        <GroupManagerData groups={groups.getCurrentResult()} channels={channels.getCurrentResult()}>
          <button type="button">Edit memberships</button>
        </GroupManagerData>,
      ),
  };
}

test("the default mutation path refreshes group definitions after a deletion request", async () => {
  const fixture = setup();
  const readsBefore = fixture.reads.groups;

  expect(await fixture.actions().run(async () => undefined, "Deleted")).toBe(true);

  expect(fixture.reads.groups).toBe(readsBefore + 1);
});

test("saved memberships with a failed refresh pause editing; recovery only repeats reads", async () => {
  const fixture = setup();
  fixture.failedReads.add("memberships");
  expect(await fixture.actions().run(fixture.write, "Saved")).toBe(true);
  expect(fixture.state.memberships).toEqual(["tech"]);
  expect(fixture.channels.getCurrentResult().data?.[0].groupIds).toEqual([]);
  expect(fixture.render()).toContain(m.sg_refresh_error());
  expect(fixture.render()).toContain('<fieldset disabled=""');
  expect(await fixture.actions().run(fixture.write, "Saved")).toBe(false);
  expect(fixture.state.writes).toBe(1);

  await fixture.retry();
  expect(fixture.render()).toContain('<fieldset disabled=""');
  fixture.failedReads.clear();
  await fixture.retry();
  expect(fixture.channels.getCurrentResult().data?.[0].groupIds).toEqual(["tech"]);
  expect(fixture.render()).not.toContain("disabled");
  expect(fixture.render()).not.toContain('role="alert"');
  expect(fixture.state.writes).toBe(1);
});

test("a failed group-definition refresh also prevents edits with fresh memberships", async () => {
  const fixture = setup();
  fixture.failedReads.add("groups");
  expect(await fixture.actions().run(fixture.write, "Saved")).toBe(true);
  expect(fixture.channels.getCurrentResult().data?.[0].groupIds).toEqual(["tech"]);
  expect(fixture.render()).toContain('<fieldset disabled=""');
  expect(await fixture.actions().run(fixture.write, "Saved")).toBe(false);
  expect(fixture.state.writes).toBe(1);
});

test("partial write failures retain their failed result through a failed refresh", async () => {
  const fixture = setup();
  fixture.failedReads.add("memberships");
  expect(
    await fixture.actions().run(async () => {
      await fixture.write();
      throw new MembershipUpdateError(["https://www.youtube.com/channel/example"]);
    }, "Saved"),
  ).toBe(false);
  expect(fixture.render()).toContain('<fieldset disabled=""');
  fixture.failedReads.clear();
  await fixture.retry();
  expect(fixture.state.writes).toBe(1);
  expect(fixture.channels.getCurrentResult().data?.[0].groupIds).toEqual(["tech"]);
  expect(fixture.render()).not.toContain("disabled");
});

test("background refresh failures retain data but pause editing", async () => {
  const fixture = setup();
  fixture.failedReads.add("memberships");
  await fixture.channels.refetch();
  expect(fixture.render()).toContain("Edit memberships");
  expect(fixture.render()).toContain(m.sg_refresh_error());
  expect(fixture.render()).toContain('<fieldset disabled=""');
  expect(fixture.state.writes).toBe(0);
});

test("initial-load errors expose recovery without rendering an empty editable workspace", async () => {
  const fixture = setup();
  fixture.failedReads.add("groups");
  await fixture.client.resetQueries({ queryKey: ["subscription-groups"] });
  expect(fixture.render()).toContain(m.sg_load_error());
  expect(fixture.render()).toContain(m.sg_retry());
  expect(fixture.render()).not.toContain("Edit memberships");
});
