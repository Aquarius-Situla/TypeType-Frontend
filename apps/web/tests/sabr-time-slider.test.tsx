import { expect, mock, test } from "bun:test";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { registerSabrVidstackControls } from "../src/lib/sabr-vidstack-bridge";

let sliderProps: Record<string, unknown> = {};
const sabrSeek = mock(() => undefined);
const remoteSeek = mock(() => undefined);

const Root = ({ children, ...props }: { children?: ReactNode } & Record<string, unknown>) => {
  sliderProps = props;
  return <>{children}</>;
};
const Slot = ({ children }: { children?: ReactNode }) => <>{children}</>;

const vidstack = await import("../src/lib/vidstack");

mock.module("../src/lib/vidstack", () => ({
  ...vidstack,
  TimeSlider: {
    Root,
    Preview: Slot,
    Progress: Slot,
    Thumb: Slot,
    Track: Slot,
    TrackFill: Slot,
    Value: Slot,
    Thumbnail: {
      Root: Slot,
      Img: () => null,
    },
  },
  useMediaRemote: () => ({ seek: remoteSeek }),
  useMediaState: () => 600,
}));

const { AudioTimeSlider } = await import("../src/components/audio-time-slider");
const { SabrTimeSlider } = await import("../src/components/sabr-time-slider");
const { UnifiedTimeSlider } = await import("../src/components/unified-time-slider");

const video = {
  duration: 600,
  seekable: {
    length: 0,
    start: () => 0,
    end: () => 0,
  },
} as HTMLVideoElement;

test("keeps the video SABR slider interactive while a seek is pending", () => {
  sabrSeek.mockClear();
  const unregister = registerSabrVidstackControls(video, {
    play: async () => {},
    pause: () => {},
    seek: sabrSeek,
  });
  renderToStaticMarkup(<SabrTimeSlider seeking video={video} />);

  expect(sliderProps.disabled).toBeUndefined();
  expect(sliderProps["aria-busy"]).toBe(true);
  expect(sliderProps.orientation).toBe("horizontal");
  expect(sliderProps["data-seeking"]).toBe("true");

  const onDragEnd = sliderProps.onDragEnd as (percent: number) => void;
  onDragEnd(80);

  expect(sabrSeek).toHaveBeenCalledWith(480);
  unregister();
});

test("keeps the audio SABR slider interactive while a seek is pending", () => {
  sabrSeek.mockClear();
  const unregister = registerSabrVidstackControls(video, {
    play: async () => {},
    pause: () => {},
    seek: sabrSeek,
  });
  renderToStaticMarkup(<AudioTimeSlider seeking video={video} />);

  expect(sliderProps.disabled).toBeUndefined();
  expect(sliderProps["aria-busy"]).toBe(true);
  expect(sliderProps.orientation).toBe("horizontal");
  expect(sliderProps["data-seeking"]).toBe("true");

  const onDragEnd = sliderProps.onDragEnd as (percent: number) => void;
  onDragEnd(20);

  expect(sabrSeek).toHaveBeenCalledWith(120);
  expect(remoteSeek).not.toHaveBeenCalled();
  unregister();
});

test("commits seek through media remote when seeking non-SABR media (Bilibili/NicoNico)", () => {
  remoteSeek.mockClear();
  renderToStaticMarkup(<UnifiedTimeSlider />);

  expect(sliderProps.disabled).toBeUndefined();
  expect(sliderProps.orientation).toBe("horizontal");

  const onDragEnd = sliderProps.onDragEnd as (percent: number) => void;
  onDragEnd(50);

  expect(remoteSeek).toHaveBeenCalledWith(300);
});
