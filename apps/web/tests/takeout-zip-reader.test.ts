import { expect, test } from "bun:test";
import { BlobWriter, type FileEntry, TextReader, ZipWriter } from "@zip.js/zip.js";
import { TakeoutZipReader } from "../src/lib/takeout-zip-reader";
import { isYoutubeTakeoutArchive } from "../src/lib/youtube-takeout-archive";

const ZIP32_WRAP = 0x1_0000_0000;

function sparseBlob(offset: number, data: Uint8Array, size: number): Blob {
  return {
    size,
    slice(start = 0, end = size) {
      const from = Math.max(start, offset);
      const to = Math.min(end, offset + data.length);
      return new Blob([from < to ? data.subarray(from - offset, to - offset) : new Uint8Array()]);
    },
  } as Blob;
}

test("reads an entry whose 32-bit local-header offset wrapped past 4 GiB", async () => {
  const name = new TextEncoder().encode("history.csv");
  const content = new TextEncoder().encode("Channel Id\nUC1");
  const header = new Uint8Array(30 + name.length + content.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(8, 0, true);
  view.setUint32(18, content.length, true);
  view.setUint32(22, content.length, true);
  view.setUint16(26, name.length, true);
  header.set(name, 30);
  header.set(content, 30 + name.length);

  const logicalOffset = 912_345_678;
  const physicalOffset = logicalOffset + ZIP32_WRAP;
  const reader = new TakeoutZipReader(
    sparseBlob(physicalOffset, header, physicalOffset + header.length),
  );
  reader.registerEntry({
    offset: logicalOffset,
    rawFilename: name,
    compressionMethod: 0,
    compressedSize: content.length,
  } as FileEntry);

  const localHeader = await reader.readUint8Array(logicalOffset, 30);
  expect(new DataView(localHeader.buffer).getUint32(0, true)).toBe(0x04034b50);
  const stream = reader.createReadable({
    offset: logicalOffset + 30 + name.length,
    size: content.length,
  });
  expect(await new Response(stream).text()).toBe("Channel Id\nUC1");
});

test("normalizes an overflowing logical offset before zip.js validates entry bounds", async () => {
  const name = new TextEncoder().encode("part.zip");
  const content = new TextEncoder().encode("archive");
  const header = new Uint8Array(30 + name.length + content.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(8, 0, true);
  view.setUint32(18, content.length, true);
  view.setUint32(22, content.length, true);
  view.setUint16(26, name.length, true);
  header.set(name, 30);
  header.set(content, 30 + name.length);

  const physicalOffset = 123;
  const entry = {
    offset: ZIP32_WRAP + physicalOffset,
    rawFilename: name,
    compressionMethod: 0,
    compressedSize: content.length,
  } as FileEntry;
  const reader = new TakeoutZipReader(
    sparseBlob(physicalOffset, header, physicalOffset + header.length),
  );
  reader.registerEntry(entry);

  const originalSize = reader.size;
  await reader.withEntryBounds(entry, async () => {
    expect(reader.size).toBeGreaterThan(originalSize);
    const localHeader = await reader.readUint8Array(entry.offset, 30);
    expect(new DataView(localHeader.buffer).getUint32(0, true)).toBe(0x04034b50);
    const stream = reader.createReadable({
      offset: entry.offset + 30 + name.length,
      size: content.length,
    });
    expect(await new Response(stream).text()).toBe("archive");
  });

  expect(entry.offset).toBe(ZIP32_WRAP + physicalOffset);
  expect(reader.size).toBe(originalSize);
});

test("detects a direct Google Takeout archive from its YouTube metadata paths", async () => {
  const writer = new ZipWriter(new BlobWriter());
  await writer.add(
    "Takeout/YouTube et YouTube Music/abonnements/abonnements.csv",
    new TextReader("Channel Id\nUC1"),
  );
  const file = new File([await writer.close()], "takeout.zip");

  expect(await isYoutubeTakeoutArchive(file)).toBe(true);
});

test("detects Google Takeout transfer archives before decompressing their parts", async () => {
  const writer = new ZipWriter(new BlobWriter());
  await writer.add(
    "takeout-20260905T223911Z-2-001.zip",
    new TextReader("not a real nested archive"),
  );
  const file = new File([await writer.close()], "transfer-01a07621.zip");

  expect(await isYoutubeTakeoutArchive(file)).toBe(true);
});
