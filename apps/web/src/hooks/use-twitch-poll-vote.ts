import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { voteTwitchPoll } from "../lib/api-twitch";
import { useTwitchAccount } from "./use-twitch";

type VoteState = { choice: string | null; pending: boolean; failed: boolean };

// The vote is free (no channel points), so Twitch counts one per viewer; the counts arrive with the next highlights read.
export function useTwitchPollVote(login: string, pollId: string) {
  const linked = useTwitchAccount().data?.linked === true;
  const queryClient = useQueryClient();
  const [state, setState] = useState<VoteState>({ choice: null, pending: false, failed: false });

  async function vote(choiceId: string) {
    if (state.pending || state.choice) return;
    setState({ choice: null, pending: true, failed: false });
    const ok = await voteTwitchPoll(pollId, choiceId).catch(() => false);
    setState({ choice: ok ? choiceId : null, pending: false, failed: !ok });
    if (ok) void queryClient.invalidateQueries({ queryKey: ["twitch", "chat-highlights", login] });
  }

  return { ...state, canVote: linked && !state.choice, vote };
}
