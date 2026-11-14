import { m } from "../paraglide/messages.js";

// Who made what in the overlay media, shown in the credits roll and on the replay page. The full
// list, title by title, is in public/THIRD_PARTY_NOTICES.txt.
export const AD_CREDITS: { role: () => string; names: string[] }[] = [
  { role: m.ad_credits_voices, names: ["ElevenLabs (Eleven v4)", "OpenAI (gpt-audio)"] },
  {
    role: m.ad_credits_music,
    names: [
      "Rafael Krux · FreePD (CC0)",
      "Bryan Teoh · FreePD (CC0)",
      "Kevin MacLeod · incompetech.com (CC BY 4.0)",
    ],
  },
  {
    role: m.ad_credits_sounds,
    names: ["Joseph Sardin · BigSoundBank (CC0)", "Kenney · kenney.nl (CC0)"],
  },
];
