import { MediaTracksMixin } from "@videojs/media/media-tracks";
import { HTMLVideoAdapter } from "@videojs/react";
import { SabrMediaReadout } from "./sabr-media-readout";
import { mirrorSabrRenditions } from "./sabr-video-renditions";
import {
  isSabrPlaybackEventTransient,
  requestSabrSeek,
  requestSabrVidstackPlayback,
} from "./sabr-vidstack-bridge";

export class SabrVideoAdapter extends MediaTracksMixin(HTMLVideoAdapter) {
  readonly engine = null;
  #resumePosition = 0;
  #protectStart = true;
  #readout = new SabrMediaReadout();
  #releaseRenditions = mirrorSabrRenditions(this);

  override destroy(): void {
    this.#releaseRenditions();
    super.destroy();
  }

  override play(): Promise<void> {
    const video = this.#video();
    if (!video) return Promise.resolve();
    this.#resumePosition = video.currentTime;
    return requestSabrVidstackPlayback(video, true);
  }

  override pause(): void {
    const video = this.#video();
    if (video && !video.paused) void requestSabrVidstackPlayback(video, false);
  }

  override get currentTime(): number {
    const video = this.#video();
    return this.#readout.time(
      super.currentTime,
      video !== null && isSabrPlaybackEventTransient(video),
    );
  }

  override get duration(): number {
    const video = this.#video();
    return this.#readout.duration(
      super.duration,
      video !== null && isSabrPlaybackEventTransient(video),
    );
  }

  override set currentTime(seconds: number) {
    const video = this.#video();
    if (!video) return;
    const resetToStart =
      this.#protectStart && seconds === 0 && this.#resumePosition > 0 && !video.ended;
    if (seconds === 0) this.#protectStart = false;
    if (resetToStart) return;
    this.#readout.target(seconds);
    requestSabrSeek(video, seconds);
  }

  #video(): HTMLVideoElement | null {
    const target = this.target;
    return target instanceof HTMLVideoElement ? target : null;
  }
}
