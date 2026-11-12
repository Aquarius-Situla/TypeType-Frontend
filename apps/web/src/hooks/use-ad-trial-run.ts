import { useEffect, useRef, useState } from "react";
import type { AdProgress } from "../lib/ad-progress";
import { lastChoiceBefore, TRIAL_CHAPTERS, TRIAL_SCENES, TRIAL_START } from "../lib/ad-trial";
import { readAdVault, rememberEnding, rememberScene } from "../lib/ad-vault";

type TrialState = {
  scene: string;
  seen: ReadonlySet<string>;
  // The clip of the scene is over: its choice or its ending is on screen.
  waiting: boolean;
  // The scene of the last choice made, to come back to from an ending.
  lastAsk: string | null;
};

// The run of the viewer through the trial: the scene on screen, what was seen, and the moves from
// one scene to another (a choice, an ending, the chapter list).
export function useAdTrialRun(progress: AdProgress, onFinish: () => void) {
  const [state, setState] = useState<TrialState>(() => ({
    scene: progress.scene,
    seen: new Set(progress.seen),
    waiting: progress.waiting,
    lastAsk: null,
  }));
  const current = TRIAL_SCENES[state.scene];
  // Remembered across sessions, unlike `seen`: what can be skipped and what the chapters open.
  const [known, setKnown] = useState<ReadonlySet<string>>(() => new Set(readAdVault().scenes));
  const [endings, setEndings] = useState<readonly number[]>(() => readAdVault().endings);
  const [chapters, setChapters] = useState(false);
  // Counts the chapters unlocked in this session: each one shows the note again.
  const [unlocked, setUnlocked] = useState(0);
  const [freshEnding, setFreshEnding] = useState(false);
  // How far the viewer got in the current clip: a clip seen for the first time can be rewound,
  // not skipped ahead. Only clips already watched to the end are free to seek and skip.
  const reached = useRef({ scene: progress.scene, time: progress.time });

  // Mirror the state into the shared progress object, which the ad break saves.
  useEffect(() => {
    progress.scene = state.scene;
    progress.seen = [...state.seen];
    progress.waiting = state.waiting;
  }, [progress, state]);

  function play(scene: string, from: string | null = null) {
    progress.time = 0;
    setState((before) => ({
      scene,
      seen: new Set([...before.seen, scene]),
      waiting: false,
      lastAsk: from ?? before.lastAsk,
    }));
  }

  function clipEnded() {
    if (!state.waiting) {
      const isNewChapter =
        !known.has(state.scene) &&
        state.scene !== TRIAL_START &&
        (TRIAL_CHAPTERS as readonly string[]).includes(state.scene);
      setKnown(new Set(rememberScene(state.scene).scenes));
      if (isNewChapter) setUnlocked((count) => count + 1);
    }
    if (!current) return onFinish();
    if ("next" in current) return play(current.next);
    setState((before) => ({ ...before, waiting: true }));
  }

  const asking = current && "ask" in current && state.waiting ? current.ask : null;
  const ending = current && "ending" in current && state.waiting ? current : null;

  useEffect(() => {
    if (!ending) return;
    setFreshEnding(!readAdVault().endings.includes(ending.ending));
    setEndings(rememberEnding(ending.ending).endings);
  }, [ending]);

  function backToChoice() {
    const scene = state.lastAsk ?? lastChoiceBefore(state.scene);
    progress.time = 0;
    setState((before) => ({ ...before, scene, waiting: true }));
  }

  function restart() {
    progress.time = 0;
    setChapters(false);
    setState({ scene: TRIAL_START, seen: new Set([TRIAL_START]), waiting: false, lastAsk: null });
  }

  // Straight to a choice from the chapter menu.
  // `witness` is the scene that unlocks the answer of an ending reached back from the chapter list.
  function jumpTo(scene: string, witness?: string) {
    progress.time = 0;
    setChapters(false);
    setState({
      scene,
      // A jump from the menu starts a new run from there: no witness called before counts, only
      // the one of the ending gone back to.
      seen: new Set([scene, ...(witness ? [witness] : [])]),
      waiting: true,
      lastAsk: scene,
    });
  }

  return {
    state,
    asking,
    ending,
    known,
    endings,
    chapters,
    setChapters,
    unlocked,
    freshEnding,
    reached,
    play,
    clipEnded,
    backToChoice,
    restart,
    jumpTo,
  };
}
