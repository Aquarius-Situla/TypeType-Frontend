import { m } from "../paraglide/messages.js";

// The interactive ad as a graph. Scene names are those of the clips in the published media set.

// How loud an objection is drawn, from a plain answer to the last one before the blast.
type AdLoudness = 0 | 1 | 2 | 3 | 4 | 5;

export type AdAnswer = {
  label: () => string;
  to: string;
  loud?: AdLoudness;
  // Only offered once the scene named here has been seen.
  needs?: string;
  // The answer dodges the pointer a few times, then gives in under this label.
  shy?: () => string;
};

// `wait` is the clip that loops while the viewer makes up their mind.
export type AdAsk = { question: () => string; answers: AdAnswer[]; wait: string };

// A scene plays its clip, then moves on, asks, or ends the trial.
export type AdScene = { next: string } | { ask: AdAsk } | { ending: number; title: () => string };

export const TRIAL_START = "intro";

// The objection ladder: each rung asks whether to object once more, louder than the last.
function objection(
  loud: AdLoudness,
  to: string,
  wait: string,
  question: () => string,
  wise = false,
): AdScene {
  const label = loud >= 3 ? () => m.ad_o_objection().toUpperCase() : m.ad_o_objection;
  return {
    ask: {
      question,
      wait,
      answers: [
        { label, to, loud },
        { label: wise ? m.ad_o_stop_wise : m.ad_o_stop, to: "obj_stop" },
      ],
    },
  };
}

export const TRIAL_SCENES: Record<string, AdScene> = {
  intro: {
    ask: {
      question: m.ad_q_trust,
      wait: "intro_attente",
      answers: [
        { label: m.ad_o_yes, to: "c1_oui" },
        { label: m.ad_o_no, to: "c1_non" },
      ],
    },
  },
  c1_oui: { next: "entree" },
  c1_non: { next: "entree" },
  entree: { next: "audience" },
  audience: {
    ask: {
      question: m.ad_q_exhibit,
      wait: "audience_attente",
      answers: [
        { label: m.ad_o_keyboard, to: "ex_clavier" },
        { label: m.ad_o_float, to: "ex_bouee" },
        { label: m.ad_o_shovel, to: "ex_pelle" },
      ],
    },
  },
  ex_clavier: { next: "climax" },
  ex_bouee: { next: "climax" },
  ex_pelle: { next: "climax" },
  climax: { next: "defense" },
  defense: {
    ask: {
      question: m.ad_q_defense,
      wait: "defense_attente",
      answers: [
        { label: m.ad_o_objection, to: "obj" },
        { label: m.ad_o_silent, to: "silence" },
      ],
    },
  },
  silence: { next: "fin1_suite" },
  obj: objection(1, "o1", "obj_attente", m.ad_q_again),
  o1: objection(2, "o2", "o1_attente", m.ad_q_again2),
  o2: objection(3, "o3", "o2_attente", m.ad_q_again3),
  o3: objection(4, "o4", "o3_attente", m.ad_q_again4),
  o4: objection(5, "o5", "o4_attente", m.ad_q_again5, true),
  o5: { next: "o5_fin" },
  o5_fin: { ending: 4, title: m.ad_end_4 },
  obj_stop: { next: "temoin" },
  temoin: {
    ask: {
      question: m.ad_q_witness,
      wait: "temoin_attente",
      answers: [
        { label: m.ad_o_voice, to: "t_voix" },
        { label: m.ad_o_pilot, to: "t_pilote" },
        { label: m.ad_o_undertaker, to: "t_croque" },
      ],
    },
  },
  t_voix: { next: "verdict" },
  t_pilote: { next: "verdict" },
  t_croque: { next: "croque_fin" },
  croque_fin: { ending: 5, title: m.ad_end_5 },
  verdict: {
    ask: {
      question: m.ad_q_verdict,
      wait: "verdict_attente",
      answers: [
        { label: m.ad_o_loses, to: "fin1" },
        { label: m.ad_o_guilty, to: "fin2", needs: "t_voix" },
        // The plane only comes down on the court if its pilot was called to the stand.
        { label: m.ad_o_wins, to: "fin3", needs: "t_pilote" },
      ],
    },
  },
  fin1: { next: "fin1_suite" },
  fin1_suite: {
    ask: {
      question: m.ad_q_plug,
      wait: "fin1_suite_attente",
      answers: [
        { label: m.ad_o_replug, to: "c7_rebr", shy: m.ad_o_replug_ok },
        { label: m.ad_o_leave, to: "c7_laisser" },
      ],
    },
  },
  c7_rebr: { next: "fin1_cri" },
  c7_laisser: { next: "fin1_cri" },
  fin1_cri: { next: "fin1_pack" },
  fin1_pack: { ending: 1, title: m.ad_end_1 },
  fin2: { ending: 2, title: m.ad_end_2 },
  fin3: { next: "boom" },
  boom: { next: "boom_fin" },
  boom_fin: { ending: 3, title: m.ad_end_3 },
};

// The choices offered in the chapter menu, in story order. The later objections are rungs of the
// first one and are left out.
export const TRIAL_CHAPTERS = [
  "intro",
  "audience",
  "defense",
  "obj",
  "temoin",
  "verdict",
  "fin1_suite",
] as const;

// For each ending: the scene that shows it, the clip whose thumbnail stands for it, and the witness
// whose testimony unlocks the answer leading to it.
export const TRIAL_ENDINGS: Record<number, { scene: string; picture: string; witness?: string }> = {
  1: { scene: "fin1_pack", picture: "c7_rebr" },
  2: { scene: "fin2", picture: "fin2", witness: "t_voix" },
  3: { scene: "boom_fin", picture: "fin3", witness: "t_pilote" },
  4: { scene: "o5_fin", picture: "o5" },
  5: { scene: "croque_fin", picture: "t_croque" },
};

export function endingTitle(ending: number): string {
  const scene = TRIAL_SCENES[TRIAL_ENDINGS[ending]?.scene ?? ""];
  return scene && "ending" in scene ? scene.title() : "";
}

const LONGEST_WALK_BACK = 12;

// The choice that led to a scene, for viewers who land on an ending without having picked one in
// this session (resumed ad, test link).
export function lastChoiceBefore(scene: string): string {
  let current = scene;
  for (let step = 0; step < LONGEST_WALK_BACK; step += 1) {
    const before = Object.entries(TRIAL_SCENES).find(([, value]) =>
      "next" in value
        ? value.next === current
        : "ask" in value && value.ask.answers.some((answer) => answer.to === current),
    );
    if (!before) return TRIAL_START;
    if ("ask" in before[1]) return before[0];
    current = before[0];
  }
  return TRIAL_START;
}
