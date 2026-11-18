// The still frame of an animated emote, on the CDNs that publish one; other images come back unchanged.
export function stillEmoteUrl(url: string): string {
  return url
    .replace(/(cdn\.betterttv\.net\/emote\/[^/]+)\/(\dx\.webp)$/, "$1/static/$2")
    .replace(/(cdn\.7tv\.app\/emote\/[^/]+)\/(\dx)\.webp$/, "$1/$2_static.webp")
    .replace(/(static-cdn\.jtvnw\.net\/emoticons\/v2\/[^/]+)\/default\//, "$1/static/");
}

// WebKit keeps a decoding thread for every animated image it has shown: a busy chat ran Safari past 500 threads and
// froze playback after about a quarter of an hour. Every iOS browser is WebKit, whatever its name.
export function isWebKitBrowser(userAgent: string, maxTouchPoints: number): boolean {
  if (/iPhone|iPad|iPod/.test(userAgent)) return true;
  if (/Macintosh/.test(userAgent) && maxTouchPoints > 1) return true;
  return /AppleWebKit/.test(userAgent) && !/(Chrome|Chromium|Edg|OPR|Firefox)\//.test(userAgent);
}
