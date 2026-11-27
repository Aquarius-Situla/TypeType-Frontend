// hls.js and dash.js weigh more than the rest of the player: a YouTube video over SABR never loads them.
export const loadHlsMedia = () => import("../components/videojs-hls-media");
export const loadDashMedia = () => import("../components/videojs-dash-media");

// YouTube plays over SABR unless the stream is live: the HLS player is fetched as soon as the stream says so.
export function preloadLiveMedia(stream: { isLive: boolean; hlsUrl: string }): void {
  if (stream.isLive && stream.hlsUrl) void loadHlsMedia().catch(() => undefined);
}
