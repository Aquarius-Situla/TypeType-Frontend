import { type FileEntry, ZipReader, type ZipWriter } from "@zip.js/zip.js";
import { TakeoutZipReader } from "./takeout-zip-reader";

export type ArchiveEntry = FileEntry;

export function isTakeoutMetadata(name: string): boolean {
  return /youtube.*\.(csv|html|json)$/i.test(name);
}

export function isRootZipPart(name: string): boolean {
  return !name.includes("/") && /\.zip$/i.test(name);
}

export async function isYoutubeTakeoutArchive(file: Blob): Promise<boolean> {
  const sourceReader = new TakeoutZipReader(file);
  const reader = new ZipReader(sourceReader);
  try {
    for await (const value of reader.getEntriesGenerator()) {
      const entry = value as FileEntry;
      if (entry.directory) continue;
      sourceReader.registerEntry(entry);
      const name = entry.filename.replaceAll("\\", "/");
      if (name.toLowerCase().startsWith("takeout/") && isTakeoutMetadata(name)) return true;
      if (/^takeout-\d{8}t\d{6}z-\d+-\d+\.zip$/i.test(name)) return true;
    }
  } catch {
    return false;
  } finally {
    await reader.close();
  }
  return false;
}

export function uniqueTakeoutEntryName(name: string, part: number, used: Set<string>): string {
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  let duplicate = 1;
  let candidate = "";
  do {
    candidate = `takeout-part-${part}-${duplicate}/${name}`;
    duplicate++;
  } while (used.has(candidate));
  used.add(candidate);
  return candidate;
}

export async function appendTakeoutMetadata<T>(
  writer: ZipWriter<T>,
  entry: FileEntry,
  name: string,
  onBytes: (bytes: number) => void,
): Promise<void> {
  const transfer = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      onBytes(chunk.byteLength);
      controller.enqueue(chunk);
    },
  });
  const add = writer.add(name, transfer.readable, { entry });
  const copy = entry.getData<void>(transfer.writable, { passThrough: true });
  await Promise.all([add, copy]);
}

export async function streamTakeoutPart(
  entry: ArchiveEntry,
  output: WritableStream<Uint8Array>,
  onBytes: (bytes: number) => void,
): Promise<void> {
  const transfer = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      onBytes(chunk.byteLength);
      controller.enqueue(chunk);
    },
  });
  await Promise.all([entry.getData<void>(transfer.writable), transfer.readable.pipeTo(output)]);
}
