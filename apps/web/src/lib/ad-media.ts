// Ad media never ship with this repository: they are served from their own host, for every
// instance alike, and nothing there is requested until the viewer turns ad mode on.
const AD_MEDIA = "https://disgustingfilthyads.typetype.video";

// The media set holds every video twice: 1080p at the root, 720p under `720/`. Viewers on a
// slow or metered connection get the lighter one. Browsers that do not report their connection
// (Firefox, Safari) get 1080p. Chrome reports about 1.5 Mbit/s before it has measured anything,
// so only a lower figure counts as slow.
type Connection = { saveData?: boolean; effectiveType?: string; downlink?: number };
const SLOW_BELOW_MBPS = 1.5;

export function wantsLightVideo(connection: Connection | undefined): boolean {
  if (!connection) return false;
  if (connection.saveData) return true;
  if (connection.effectiveType && connection.effectiveType !== "4g") return true;
  return typeof connection.downlink === "number" && connection.downlink < SLOW_BELOW_MBPS;
}

function videoRoot(): string {
  if (typeof navigator === "undefined") return AD_MEDIA;
  const connection = (navigator as Navigator & { connection?: Connection }).connection;
  return wantsLightVideo(connection) ? `${AD_MEDIA}/720` : AD_MEDIA;
}

export function adVideoUrl(file: string): string {
  return `${videoRoot()}/${file}`;
}

export function adSubtitlesUrl(locale: string): string {
  return `${AD_MEDIA}/sous-titres/${locale}.json`;
}

// The folder and file names below are those of the published media set.
const TRIAL_MEDIA = `${AD_MEDIA}/proces`;

export function trialClipUrl(scene: string): string {
  return `${videoRoot()}/proces/${scene}.mp4`;
}

export function trialThumbnailUrl(scene: string): string {
  return `${TRIAL_MEDIA}/vignettes/${scene}.jpg`;
}

export function trialAudioUrl(file: string): string {
  return `${TRIAL_MEDIA}/audio/${file}`;
}

// The five endings of the trial played back to back, as a plain video to replay or download.
export function trialEndingUrl(ending: number): string {
  return `${TRIAL_MEDIA}/fins/fin${ending}.mp4`;
}

// One still per ad, for the credits shown once the five endings are found.
export function adCreditsPictureUrl(position: number): string {
  return `${AD_MEDIA}/generique/${position}.jpg`;
}

// Whether the ad videos can be reached from here (an offline host, a blocker). Asked once, when the
// viewer turns ad mode on.
export async function adMediaAvailable(): Promise<boolean> {
  try {
    const response = await fetch(adVideoUrl("1-squishy-keyboard.mp4"), {
      method: "HEAD",
      cache: "no-store",
    });
    return response.ok && (response.headers.get("content-type") ?? "").startsWith("video/");
  } catch {
    return false;
  }
}
