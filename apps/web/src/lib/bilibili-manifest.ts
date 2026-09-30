import type { AudioStreamItem, VideoStreamItem } from "../types/api";
import { proxyUrl } from "./proxy";
import { hasPlayableDirectUrl } from "./stream-delivery";

type VideoCandidate = VideoStreamItem & { codec: string };
type AudioCandidate = AudioStreamItem & { codec: string };

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function bandwidthFromUrl(url: string): number | null {
  try {
    const value = new URL(url).searchParams.get("bw");
    if (value === null) return null;
    const bandwidth = Number(value);
    return Number.isFinite(bandwidth) && bandwidth > 0 ? bandwidth : null;
  } catch {
    return null;
  }
}

function heightFromResolution(value: string): number | null {
  const match = value.match(/(\d+)\s*[pP]/);
  if (!match) return null;
  const height = Number(match[1]);
  return Number.isFinite(height) && height > 0 ? height : null;
}

function videoDimensions(stream: VideoStreamItem): { width: number; height: number } | null {
  const height = stream.height > 0 ? stream.height : heightFromResolution(stream.resolution);
  if (height === null) return null;
  const width = stream.width > 0 ? stream.width : Math.round((height * 16) / 9);
  return { width, height };
}

function codecPrefix(codec: string): string {
  return codec.split(".")[0]?.toLowerCase() ?? "";
}

function codecPriority(prefix: string): number {
  if (prefix.startsWith("avc1")) return 0;
  if (prefix.startsWith("av01")) return 1;
  if (prefix.startsWith("hev1") || prefix.startsWith("hvc1")) return 2;
  return 3;
}

function isSupportedCodec(mimeType: string, codec: string): boolean {
  if (typeof MediaSource === "undefined") return true;
  return MediaSource.isTypeSupported(`${mimeType}; codecs="${codec}"`);
}

function isVideoCandidate(stream: VideoStreamItem): stream is VideoCandidate {
  return (
    hasPlayableDirectUrl(stream) && typeof stream.codec === "string" && stream.codec.length > 0
  );
}

function isAudioCandidate(stream: AudioStreamItem): stream is AudioCandidate {
  return (
    hasPlayableDirectUrl(stream) && typeof stream.codec === "string" && stream.codec.length > 0
  );
}

function audioCodec(codec: string): string {
  return codec === "mp4a" ? "mp4a.40.2" : codec;
}

function videoCodecGroups(streams: VideoStreamItem[]): VideoCandidate[][] {
  const supported = streams
    .filter(isVideoCandidate)
    .filter((stream) => isSupportedCodec(mimeType(stream.mimeType, "video/mp4"), stream.codec));

  const groups = new Map<string, VideoCandidate[]>();
  for (const stream of supported) {
    const prefix = codecPrefix(stream.codec);
    const existing = groups.get(prefix);
    if (existing) {
      existing.push(stream);
    } else {
      groups.set(prefix, [stream]);
    }
  }

  const sortedPrefixes = [...groups.keys()].sort((a, b) => codecPriority(a) - codecPriority(b));

  return sortedPrefixes
    .map((prefix) => {
      const list = groups.get(prefix) ?? [];
      const byHeight = new Map<number, VideoCandidate>();
      for (const item of list) {
        const dim = videoDimensions(item);
        const h = dim?.height ?? 0;
        if (h <= 0) continue;
        const existing = byHeight.get(h);
        const itemBw = item.bitrate ?? bandwidthFromUrl(item.url) ?? 0;
        const existingBw = existing ? (existing.bitrate ?? bandwidthFromUrl(existing.url) ?? 0) : 0;
        if (!existing || itemBw > existingBw) {
          byHeight.set(h, item);
        }
      }
      return [...byHeight.values()].sort((a, b) => {
        const ha = videoDimensions(a)?.height ?? 0;
        const hb = videoDimensions(b)?.height ?? 0;
        return hb - ha;
      });
    })
    .filter((group) => group.length > 0);
}

function audioCandidates(streams: AudioStreamItem[]): AudioCandidate[] {
  return [...streams]
    .filter(isAudioCandidate)
    .filter((stream) =>
      isSupportedCodec(mimeType(stream.mimeType, "audio/mp4"), audioCodec(stream.codec)),
    )
    .sort((a, b) => {
      const bwA = a.bitrate ?? bandwidthFromUrl(a.url) ?? 0;
      const bwB = b.bitrate ?? bandwidthFromUrl(b.url) ?? 0;
      return bwB - bwA;
    });
}

export function bilibiliVariantCount(
  videoStreams: VideoStreamItem[],
  audioStreams: AudioStreamItem[],
): number {
  const groups = videoCodecGroups(videoStreams);
  const audios = audioCandidates(audioStreams);
  return Math.max(1, groups.length * Math.max(1, audios.length));
}

function videoRepresentation(stream: VideoCandidate, index: number): string | null {
  const dimensions = videoDimensions(stream);
  if (dimensions === null) return null;
  const bandwidth = Math.max(1, stream.bitrate ?? bandwidthFromUrl(stream.url) ?? 1);
  const frameRate = stream.fps > 0 ? ` frameRate="${stream.fps}"` : "";
  return (
    `<Representation id="v${index}" bandwidth="${bandwidth}"` +
    ` width="${dimensions.width}" height="${dimensions.height}"${frameRate}` +
    ` codecs="${escapeXml(stream.codec)}">` +
    `<BaseURL>${escapeXml(proxyUrl(stream.url))}</BaseURL>` +
    `<SegmentBase indexRange="${stream.indexStart}-${stream.indexEnd}">` +
    `<Initialization range="${stream.initStart}-${stream.initEnd}"/>` +
    `</SegmentBase>` +
    `</Representation>`
  );
}

function audioRepresentation(stream: AudioCandidate, index = 0): string {
  const bandwidth = Math.max(1, bandwidthFromUrl(stream.url) ?? stream.bitrate ?? 128000);
  return (
    `<Representation id="a${index}" bandwidth="${bandwidth}" codecs="${escapeXml(audioCodec(stream.codec))}">` +
    `<AudioChannelConfiguration` +
    ` schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011"` +
    ` value="2"/>` +
    `<BaseURL>${escapeXml(proxyUrl(stream.url))}</BaseURL>` +
    `<SegmentBase indexRange="${stream.indexStart}-${stream.indexEnd}">` +
    `<Initialization range="${stream.initStart}-${stream.initEnd}"/>` +
    `</SegmentBase>` +
    `</Representation>`
  );
}

function mimeType(value: string, fallback: string): string {
  const [type] = value.split(";");
  const trimmed = type?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export function buildBilibiliDashManifest(
  videoStreams: VideoStreamItem[],
  audioStreams: AudioStreamItem[],
  duration: number,
  variant = 0,
): string | null {
  if (duration <= 0) return null;
  const groups = videoCodecGroups(videoStreams);
  const audios = audioCandidates(audioStreams);
  if (groups.length === 0 || audios.length === 0) return null;
  const videoGroup = groups[variant % groups.length];
  const audio = audios[Math.floor(variant / groups.length) % audios.length];
  if (!videoGroup || videoGroup.length === 0 || !audio) return null;

  const videoReps = videoGroup
    .map((v, i) => videoRepresentation(v, i))
    .filter((xml): xml is string => xml !== null);
  if (videoReps.length === 0) return null;

  const audioXml = audioRepresentation(audio, 0);
  const primaryVideo = videoGroup[0];
  const mpd = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<MPD xmlns="urn:mpeg:dash:schema:mpd:2011"`,
    ` profiles="urn:mpeg:dash:profile:full:2011"`,
    ` type="static" mediaPresentationDuration="PT${duration}S" minBufferTime="PT4S">`,
    `<Period>`,
    `<AdaptationSet mimeType="${escapeXml(mimeType(primaryVideo.mimeType, "video/mp4"))}" startWithSAP="1">`,
    ...videoReps,
    `</AdaptationSet>`,
    `<AdaptationSet mimeType="${escapeXml(mimeType(audio.mimeType, "audio/mp4"))}" lang="und" startWithSAP="1">`,
    audioXml,
    `</AdaptationSet>`,
    `</Period>`,
    `</MPD>`,
  ].join("");
  return `data:application/dash+xml;base64,${btoa(mpd)}`;
}
