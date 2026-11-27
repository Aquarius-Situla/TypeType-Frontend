import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTwitchLiveNotifications,
  updateTwitchLiveNotifications,
} from "../lib/api-notifications";
import { useTwitchAccount } from "./use-twitch";

const KEY = ["notifications", "twitch-live"];

export function useTwitchLiveNotifications() {
  const linked = useTwitchAccount().data?.linked === true;
  const client = useQueryClient();
  const query = useQuery({ queryKey: KEY, queryFn: fetchTwitchLiveNotifications, enabled: linked });
  const update = useMutation({
    mutationFn: updateTwitchLiveNotifications,
    onSuccess: (saved) => {
      client.setQueryData(KEY, saved);
      void client.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
  return { linked, query, update };
}
