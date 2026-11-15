import { expect, test } from "bun:test";
import { toWebVtt } from "../src/lib/web-vtt";

test("converts JSON thumbnail cues to WebVTT", () => {
  const json = JSON.stringify([
    { startTime: 0, endTime: 5, text: "https://img.example/sb.jpg#xywh=0,0,160,90" },
    { startTime: 3725.5, endTime: 3730, text: "https://img.example/sb.jpg#xywh=160,0,160,90" },
  ]);
  expect(toWebVtt(json)).toBe(
    "WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nhttps://img.example/sb.jpg#xywh=0,0,160,90\n\n" +
      "01:02:05.500 --> 01:02:10.000\nhttps://img.example/sb.jpg#xywh=160,0,160,90\n",
  );
});

test("keeps real WebVTT and rejects anything else", () => {
  expect(toWebVtt("WEBVTT\n\n00:00.000 --> 00:01.000\nhi")).toStartWith("WEBVTT");
  expect(toWebVtt("not vtt")).toBeNull();
  expect(toWebVtt("[]")).toBeNull();
});
