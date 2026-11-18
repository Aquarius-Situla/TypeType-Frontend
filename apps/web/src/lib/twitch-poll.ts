import type { TwitchPoll } from "../types/twitch";

export type PollRow = {
  id: string;
  title: string;
  votes: number;
  percent: number;
  leading: boolean;
};

export function pollRows(poll: TwitchPoll): PollRow[] {
  const total = poll.choices.reduce((sum, choice) => sum + choice.votes, 0);
  const best = Math.max(0, ...poll.choices.map((choice) => choice.votes));
  return poll.choices.map((choice) => ({
    id: choice.id,
    title: choice.title,
    votes: choice.votes,
    percent: total > 0 ? Math.round((choice.votes / total) * 100) : 0,
    leading: best > 0 && choice.votes === best,
  }));
}

export function pollRunning(poll: TwitchPoll): boolean {
  return poll.status === "ACTIVE";
}

export function pollRemainingSeconds(poll: TwitchPoll, fetchedAt: number, now: number): number {
  return Math.max(0, Math.ceil((poll.remainingMs - (now - fetchedAt)) / 1000));
}

export function clockLabel(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
