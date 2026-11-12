import { trialClipUrl } from "./ad-media";
import { TRIAL_SCENES } from "./ad-trial";

// Every clip the current scene can lead to, so that it is loaded before it is needed.
export function upcomingClips(scene: string): string[] {
  const current = TRIAL_SCENES[scene];
  if (!current) return [];
  if ("next" in current) return [trialClipUrl(current.next)];
  if ("ask" in current) {
    return [
      trialClipUrl(current.ask.wait),
      ...current.ask.answers.map((answer) => trialClipUrl(answer.to)),
    ];
  }
  return [];
}
