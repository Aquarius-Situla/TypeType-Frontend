import { CalendarClock, CircleDollarSign, LockKeyhole, RadioTower } from "lucide-react";
import type { VideoAvailability } from "../lib/video-availability";

type Props = {
  availability: VideoAvailability;
  compact?: boolean;
};

export function VideoAvailabilityIcon({ availability, compact = false }: Props) {
  const Icon =
    availability === "scheduled_premiere"
      ? CalendarClock
      : availability === "live_not_started"
        ? RadioTower
        : availability === "paid_content"
          ? CircleDollarSign
          : LockKeyhole;
  const sizeClass = compact ? "h-16 w-16" : "h-20 w-20";
  const iconClass = compact ? "h-8 w-8" : "h-10 w-10";

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-surface-strong`}
    >
      <Icon className={`${iconClass} text-white`} aria-hidden="true" />
    </div>
  );
}
