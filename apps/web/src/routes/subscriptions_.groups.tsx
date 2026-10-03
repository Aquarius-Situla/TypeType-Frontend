import { createFileRoute } from "@tanstack/react-router";
import { GroupManager } from "../components/subscription-groups/group-manager";
import { useAuth } from "../hooks/use-auth";

function SubscriptionGroupsPage(): React.JSX.Element {
  const { me } = useAuth();
  return <GroupManager key={me?.id} />;
}

export const Route = createFileRoute("/subscriptions_/groups")({
  component: SubscriptionGroupsPage,
});
