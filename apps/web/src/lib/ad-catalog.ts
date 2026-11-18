import { m } from "../paraglide/messages.js";
import { adVideoUrl } from "./ad-media";
import { type AdVault, adIsDue } from "./ad-vault";

// `id` is what the vault remembers as seen; `cues` is the key of a classic ad in the subtitle files.
export type Ad =
  | { kind: "classic"; id: string; brand: () => string; src: string; cues: string }
  | { kind: "trial"; id: string; brand: () => string };

// The address is worked out when the ad plays, once the browser has measured the connection.
function classic(id: string, brand: () => string, file: string, cues: string): Ad {
  return {
    kind: "classic",
    id,
    brand,
    cues,
    get src() {
      return adVideoUrl(file);
    },
  };
}

// One ad plays before each video, in this order, then the rotation starts over. The interactive
// trial comes last: it is the one the six others build up to.
export const AD_ROTATION: readonly Ad[] = [
  classic("squishy", m.ad_brand_1, "1-squishy-keyboard.mp4", "pub1"),
  classic("floatmax", m.ad_brand_2, "2-floatmax.mp4", "pub2"),
  classic("gravely", m.ad_brand_3, "3-gravely-associates.mp4", "pub3"),
  classic("mourning", m.ad_brand_4, "4-mourning-and-sons.mp4", "pub4"),
  classic("plummet", m.ad_brand_5, "5-plummet-air.mp4", "pub5"),
  classic("backrooms", m.ad_brand_6, "6-backrooms-residences.mp4", "pub6"),
  { kind: "trial", id: "trial", brand: m.ad_brand_7 },
];

// An unfinished ad comes back before the next one in the rotation.
export function nextAdIndex(vault: AdVault): number | null {
  if (!adIsDue(vault)) return null;
  const index = vault.pending?.index ?? vault.next;
  return index >= 0 && index < AD_ROTATION.length ? index : 0;
}

// On the sponsors page the trial unlocks once every classic ad has been watched to the end.
export function trialIsEarned(vault: AdVault): boolean {
  return AD_ROTATION.every((ad) => ad.kind === "trial" || vault.seen.includes(ad.id));
}
