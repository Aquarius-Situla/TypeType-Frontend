// The sound bed of the trial: music and heart monitor that run under the clips and across their
// cuts, at the levels of the linear edit of the ad.

// Heart monitor loops, named after their audio files.
export type AdMonitor = "normal" | "rapide" | "panique" | "plat" | "off";
export type AdBed = { tirade: number; outro: number; monitor: AdMonitor; monitorLevel: number };

const BEDS = {
  calm: { tirade: 0, outro: 0, monitor: "normal", monitorLevel: 1 },
  speech: { tirade: 0.2, outro: 0, monitor: "rapide", monitorLevel: 1 },
  brisk: { tirade: 0, outro: 0, monitor: "rapide", monitorLevel: 1 },
  hushed: { tirade: 0, outro: 0, monitor: "normal", monitorLevel: 0.3 },
  tense: { tirade: 0, outro: 0, monitor: "panique", monitorLevel: 1 },
  flatline: { tirade: 0, outro: 0, monitor: "plat", monitorLevel: 1 },
  wrecked: { tirade: 0, outro: 0, monitor: "off", monitorLevel: 0 },
  outro: { tirade: 0, outro: 0.24, monitor: "off", monitorLevel: 0 },
} satisfies Record<string, AdBed>;

// Scenes that are not listed play over the calm bed.
const SCENE_BED: Record<string, keyof typeof BEDS> = {
  ex_clavier: "speech",
  ex_bouee: "speech",
  ex_pelle: "speech",
  climax: "speech",
  o3: "brisk",
  o4: "brisk",
  o5: "wrecked",
  o5_fin: "outro",
  t_voix: "hushed",
  t_croque: "tense",
  croque_fin: "outro",
  verdict: "tense",
  fin1: "tense",
  fin1_suite: "tense",
  c7_rebr: "flatline",
  c7_laisser: "flatline",
  fin1_cri: "flatline",
  fin1_pack: "outro",
  fin2: "hushed",
  boom: "wrecked",
  boom_fin: "outro",
};

export function bedFor(scene: string, waiting: boolean): AdBed {
  // The plug choice is asked over a flat line: the patient is already gone.
  if (waiting && scene === "fin1_suite") return BEDS.flatline;
  return BEDS[SCENE_BED[scene] ?? "calm"];
}
