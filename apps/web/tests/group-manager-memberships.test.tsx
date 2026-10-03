import { afterEach, expect, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { ChannelGroupEditor } from "../src/components/subscription-groups/channel-group-editor";
import { useGroupManager } from "../src/hooks/use-group-manager";
import { updateGroupMemberships } from "../src/lib/api-subscription-groups";
import {
  groupMembershipPageOptions,
  selectedMembershipOptions,
} from "../src/lib/group-membership-queries";
import { channelMembershipChanges } from "../src/lib/subscription-group-selection";
import { useAuthStore } from "../src/stores/auth-store";
import type { GroupedSubscription } from "../src/types/subscription-groups";

const originalFetch = globalThis.fetch;
const clients: QueryClient[] = [];
afterEach(() => {
  globalThis.fetch = originalFetch;
  useAuthStore.getState().setSignedOut();
  for (const client of clients.splice(0)) client.clear();
});
const groups = ["tech", "science", "travel"].map((id) => ({
  id,
  name: id,
  channelCount: 1,
  createdAt: 0,
  updatedAt: 0,
}));
const channel: GroupedSubscription = {
  channelUrl: "https://example.com/channel/selected",
  name: "Selected channel",
  avatarUrl: "",
  subscribedAt: 0,
  groupIds: ["tech", "travel"],
};
const other = { ...channel, channelUrl: "https://example.com/channel/other", groupIds: [] };

function readManager(current: string[], draft?: string[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  const options = groupMembershipPageOptions(undefined, {
    page: 0,
    limit: 10,
    filter: "all",
    excluded: false,
    search: "",
  });
  client.setQueryData(options.queryKey, {
    items: [channel, other],
    total: 2,
    totalSubscriptions: 2,
    ungroupedCount: 1,
    page: 0,
    limit: 10,
  });
  client.setQueryData(selectedMembershipOptions(undefined, [channel.channelUrl]).queryKey, [
    { ...channel, groupIds: current },
  ]);
  let state: ReturnType<typeof useGroupManager> | undefined;
  function ReadManager(): React.JSX.Element | null {
    const manager = useGroupManager(groups, true);
    state = manager;
    if (!manager.validSelected.has(channel.channelUrl)) {
      manager.toggle(channel.channelUrl);
      return null;
    }
    if (draft && !manager.drafts.has(channel.channelUrl)) {
      manager.setDraft(channel.channelUrl, new Set(draft));
      return null;
    }
    const visible = manager.visible[0];
    return (
      <ChannelGroupEditor
        channel={visible}
        groups={groups}
        desired={manager.drafts.get(visible.channelUrl) ?? new Set(visible.groupIds)}
        onChange={() => {}}
        busy={false}
        disabled={false}
        onSave={() => {}}
        onCancel={() => {}}
      />
    );
  }
  const markup = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <ReadManager />
    </QueryClientProvider>,
  );
  if (!state) throw new Error("Manager did not render");
  return { state, markup, client, options };
}

test("inline editing shows refreshed selected memberships without changing page order or cache", () => {
  const { state, markup, client, options } = readManager(["travel"]);
  expect(state.visible.map((item) => item.channelUrl)).toEqual([
    channel.channelUrl,
    other.channelUrl,
  ]);
  expect(state.visible[0].groupIds).toEqual(["travel"]);
  expect(state.visible[1]).toEqual(other);
  expect(markup).toContain('aria-label="Remove travel"');
  expect(markup).not.toContain('aria-label="Remove tech"');
  expect(client.getQueryData(options.queryKey)?.items[0].groupIds).toEqual(["tech", "travel"]);
});

test("a retained draft is saved against refreshed memberships, including externally removed groups", async () => {
  const desired = ["tech", "science", "travel"];
  const { state, markup } = readManager(["travel"], desired);
  const draft = state.drafts.get(channel.channelUrl);
  if (!draft) throw new Error("Draft was lost");
  expect([...draft]).toEqual(desired);
  for (const id of desired) expect(markup).toContain(`aria-label="Remove ${id}"`);
  const stored = new Set(["travel"]);
  useAuthStore.getState().setToken("membership-regression");
  globalThis.fetch = async (input, init) => {
    const group = new URL(String(input), "https://fixture.test").pathname.split("/").at(-2);
    if (!group) throw new Error("Missing group ID");
    expect(JSON.parse(String(init?.body)).channelUrls).toEqual([channel.channelUrl]);
    if (init?.method === "PUT") stored.add(group);
    else stored.delete(group);
    return new Response(null, { status: 204 });
  };
  await updateGroupMemberships(channelMembershipChanges(state.visible[0], draft));
  expect([...stored].sort()).toEqual([...desired].sort());
});
