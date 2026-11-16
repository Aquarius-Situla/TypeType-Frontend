import { m } from "../paraglide/messages.js";
import { isMemberOnlyMessage } from "./member-only";

export type VideoAvailability =
  | "scheduled_premiere"
  | "live_not_started"
  | "paid_content"
  | "members_only";

type AvailabilityCopy = {
  heading: string;
  message: string;
};

export function resolveVideoAvailability(error: unknown): VideoAvailability | null {
  if (!(error instanceof Error)) return null;
  if ("code" in error && typeof error.code === "string" && isAvailabilityCode(error.code)) {
    return error.code;
  }

  const message = error.message.toLowerCase();
  if (message.includes("premieres in") || message.includes("premiere has not started")) {
    return "scheduled_premiere";
  }
  if (isMemberOnlyMessage(message)) return "members_only";
  if (
    message.includes("paid video") ||
    message.includes("payment required") ||
    message.includes("youtube music premium")
  ) {
    return "paid_content";
  }
  return null;
}

export function videoAvailabilityCopy(
  availability: VideoAvailability,
  sourceMessage?: string,
): AvailabilityCopy {
  if (availability === "scheduled_premiere") {
    return {
      heading: m.video_premiere_scheduled(),
      message: premiereMessage(sourceMessage),
    };
  }
  if (availability === "live_not_started") {
    return {
      heading: m.video_live_offline(),
      message: m.video_live_not_started(),
    };
  }
  if (availability === "paid_content") {
    return {
      heading: m.video_paid(),
      message: m.video_paid_message(),
    };
  }
  return {
    heading: m.video_members_only(),
    message: m.video_members_only_message(),
  };
}

function isAvailabilityCode(code: string | null): code is VideoAvailability {
  return (
    code === "scheduled_premiere" ||
    code === "live_not_started" ||
    code === "paid_content" ||
    code === "members_only"
  );
}

function premiereMessage(sourceMessage?: string): string {
  const relativeTime = sourceMessage?.match(/premieres?\s+in\s+(.+?)[.!]?$/i)?.[1]?.trim();
  return relativeTime
    ? m.video_premiere_starts_in({ relativeTime })
    : m.video_premiere_not_started();
}
