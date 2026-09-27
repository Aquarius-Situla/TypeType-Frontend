import { expect, test } from "bun:test";
import {
  BlobReader,
  BlobWriter,
  TextReader,
  TextWriter,
  ZipReader,
  ZipWriter,
} from "@zip.js/zip.js";
import { prepareYoutubeTakeout } from "../src/lib/prepare-youtube-takeout";

test("preserves account metadata and excludes uploaded videos and other Google products", async () => {
  const writer = new ZipWriter(new BlobWriter());
  await writer.add(
    "Takeout/YouTube/subscriptions/subscriptions.csv",
    new TextReader("Channel Id\nUC1"),
  );
  await writer.add("Takeout/YouTube/videos/upload.mp4", new TextReader("not account data"));
  await writer.add("Takeout/Mail/mail.html", new TextReader("private unrelated data"));
  const phases: string[] = [];
  const result = await prepareYoutubeTakeout(new File([await writer.close()], "takeout.zip"), {
    onProgress: (progress) => phases.push(progress.phase),
  });
  expect(phases).toContain("scanning");
  expect(phases).toContain("packing");
  const reader = new ZipReader(new BlobReader(result));
  try {
    const entries = await reader.getEntries();
    expect(entries.map((entry) => entry.filename)).toEqual([
      "Takeout/YouTube/subscriptions/subscriptions.csv",
    ]);
    expect(await entries[0].getData?.(new TextWriter(), { checkSignature: true })).toBe(
      "Channel Id\nUC1",
    );
  } finally {
    await reader.close();
  }
});

test("extracts metadata from multiple ZIP parts and excludes media", async () => {
  const first = new ZipWriter(new BlobWriter());
  await first.add(
    "Takeout/YouTube and YouTube Music/subscriptions/subscriptions.csv",
    new TextReader("Channel Id\nUC1"),
  );
  const second = new ZipWriter(new BlobWriter());
  await second.add(
    "Takeout/YouTube and YouTube Music/history/watch-history.html",
    new TextReader("<html>history</html>"),
  );
  await second.add("Takeout/YouTube/videos/upload.mp4", new TextReader("video"));
  const outer = new ZipWriter(new BlobWriter());
  await outer.add("takeout-part-001.zip", new BlobReader(await first.close()));
  await outer.add("takeout-part-002.zip", new BlobReader(await second.close()));

  const result = await prepareYoutubeTakeout(new File([await outer.close()], "takeout.zip"));
  const reader = new ZipReader(new BlobReader(result));
  try {
    const entries = await reader.getEntries();
    expect(entries.map((entry) => entry.filename)).toEqual([
      "Takeout/YouTube and YouTube Music/subscriptions/subscriptions.csv",
      "Takeout/YouTube and YouTube Music/history/watch-history.html",
    ]);
  } finally {
    await reader.close();
  }
});

test("rejects a video-only part instead of starting an empty import", async () => {
  const writer = new ZipWriter(new BlobWriter());
  await writer.add("Takeout/YouTube/videos/upload.mp4", new TextReader("video"));
  await expect(
    prepareYoutubeTakeout(new File([await writer.close()], "takeout.zip")),
  ).rejects.toThrow();
});
