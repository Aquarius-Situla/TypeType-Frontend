import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { voteTwitchPoll } from "../lib/api-twitch";
import { useTwitchAccount } from "./use-twitch";

type VoteState = { choice: string | null; already: boolean; pending: boolean; failed: boolean };

const IDLE: VoteState = { choice: null, already: false, pending: false, failed: false };

// The vote is free (no channel points), so Twitch counts one per viewer; the counts arrive with the next highlights read.
export function useTwitchPollVote(login: string, pollId: string) {
  const linked = useTwitchAccount().data?.linked === true;
  const queryClient = useQueryClient();
  const [state, setState] = useState<VoteState>(IDLE);

  async function vote(choiceId: string) {
    if (state.pending || state.choice || state.already) return;
    setState({ ...IDLE, pending: true });
    const result = await voteTwitchPoll(pollId, choiceId).catch(() => "failed" as const);
    setState({
      ...IDLE,
      choice: result === "counted" ? choiceId : null,
      already: result === "already",
      failed: result === "failed",
    });
    if (result === "counted")
      void queryClient.invalidateQueries({ queryKey: ["twitch", "chat-highlights", login] });
  }

  return { ...state, canVote: linked && !state.choice && !state.already, vote };
}
