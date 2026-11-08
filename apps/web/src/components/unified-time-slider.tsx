import { useEffect, useRef, useState } from "react";
import { useSabrSeekTarget } from "../hooks/use-sabr-seek-target";
import {
  percentFromMediaSeconds,
  secondsFromMediaSliderPercent,
  secondsFromSliderPercent,
} from "../lib/sabr-player-seek";
import { requestSabrSeek } from "../lib/sabr-vidstack-bridge";
import { TimeSlider, useMediaRemote, useMediaState } from "../lib/vidstack";
import { m } from "../paraglide/messages.js";

const HOVER_PREVIEW_DEBOUNCE_MS = 150;
const REACHED_TOLERANCE_SECONDS = 0.5;

export type UnifiedTimeSliderProps = {
  sabr?: boolean;
  seeking?: boolean;
  thumbnails?: string;
  video?: HTMLVideoElement | null;
};

export function UnifiedTimeSlider({
  sabr: sabrProp,
  seeking = false,
  thumbnails,
  video = null,
}: UnifiedTimeSliderProps) {
  const sabr = sabrProp ?? Boolean(video);
  const [dragTarget, setDragTarget] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHoverSettled, setIsHoverSettled] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);

  const remote = useMediaRemote();
  const mediaDuration = useMediaState("duration");
  const mediaSeeking = Boolean(useMediaState("seeking"));
  const mediaCurrentTime = useMediaState("currentTime");

  const sabrTarget = useSabrSeekTarget(video, seeking);

  const seekTarget =
    dragTarget ??
    (sabr && video && sabrTarget !== null ? percentFromMediaSeconds(video, sabrTarget) : null);

  useEffect(() => {
    if (sabr) {
      if (!seeking) setDragTarget(null);
    } else {
      if (!mediaSeeking) setDragTarget(null);
    }
  }, [sabr, seeking, mediaSeeking]);

  useEffect(() => {
    if (dragTarget === null) return;
    if (!sabr && mediaDuration > 0) {
      const targetTime = (dragTarget / 100) * mediaDuration;
      if (Math.abs(mediaCurrentTime - targetTime) < REACHED_TOLERANCE_SECONDS) {
        setDragTarget(null);
      }
    }
  }, [dragTarget, sabr, mediaCurrentTime, mediaDuration]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current !== null) {
        window.clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    };
  }, []);

  const handlePointerMove = () => {
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsHoverSettled(true);
    }, HOVER_PREVIEW_DEBOUNCE_MS);
  };

  const handlePointerLeave = () => {
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHoverSettled(false);
  };

  const style = seekTarget === null ? undefined : { "--typetype-seek-target": `${seekTarget}%` };
  const isSeekingActive = (sabr ? seeking : mediaSeeking) || seekTarget !== null;
  const activeThumbnails = thumbnails && (isHoverSettled || isDragging) ? thumbnails : undefined;

  return (
    <TimeSlider.Root
      className="vds-time-slider vds-slider"
      style={style}
      aria-label={m.ui_seek()}
      aria-busy={Boolean(sabr ? seeking : mediaSeeking)}
      orientation="horizontal"
      data-seeking={isSeekingActive ? "true" : undefined}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(percent) => {
        setIsDragging(false);
        setDragTarget(percent);

        if (sabr && video) {
          const seconds = secondsFromMediaSliderPercent(video, percent);
          if (seconds !== null) requestSabrSeek(video, seconds);
        } else {
          const seconds = secondsFromSliderPercent(video?.duration ?? mediaDuration, percent);
          if (seconds !== null) {
            if (video && requestSabrSeek(video, seconds)) return;
            remote.seek(seconds);
          }
        }
      }}
    >
      <TimeSlider.Track className="vds-slider-track" />
      <TimeSlider.TrackFill className="vds-slider-track-fill vds-slider-track" />
      <TimeSlider.Progress className="vds-slider-progress vds-slider-track" />
      <TimeSlider.Thumb className="vds-slider-thumb" />
      <TimeSlider.Preview className="vds-slider-preview">
        {activeThumbnails && (
          <TimeSlider.Thumbnail.Root
            src={activeThumbnails}
            className="vds-slider-thumbnail vds-thumbnail"
          >
            <TimeSlider.Thumbnail.Img />
          </TimeSlider.Thumbnail.Root>
        )}
        <TimeSlider.Value className="vds-slider-value" />
      </TimeSlider.Preview>
    </TimeSlider.Root>
  );
}
