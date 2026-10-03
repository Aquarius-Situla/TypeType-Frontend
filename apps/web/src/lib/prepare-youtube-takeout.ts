import { BlobWriter, type FileEntry, ZipReader, ZipWriter } from "@zip.js/zip.js";
import { m } from "../paraglide/messages.js";
import type { PortabilityPreparationProgress } from "./portability-preparation-progress";
import { isTakeoutStorageQuotaError } from "./takeout-errors";
import { TakeoutZipReader } from "./takeout-zip-reader";
import { isRootZipPart, isTakeoutMetadata, streamTakeoutPart } from "./youtube-takeout-archive";
import {
  MAX_IN_MEMORY_BYTES,
  MAX_METADATA_BYTES,
  MAX_TAKEOUT_ENTRIES,
  YoutubeTakeoutMetadataPacker,
} from "./youtube-takeout-metadata-packer";
import {
  getTakeoutDirectory,
  persistPreparedTakeout,
  type TakeoutFileHandle,
} from "./youtube-takeout-prepared-store";

const MAX_NESTED_BYTES = 4 * 1024 * 1024 * 1024;
const MAX_NESTED_TOTAL_BYTES = 16 * 1024 * 1024 * 1024;
const MAX_NESTED_ARCHIVES = 32;
const PROGRESS_INTERVAL_BYTES = 8 * 1024 * 1024;

type PrepareOptions = {
  ownerId?: string;
  onProgress?: (progress: Omit<PortabilityPreparationProgress, "ownerId">) => void;
};

export async function prepareYoutubeTakeout(
  file: File,
  options: PrepareOptions = {},
): Promise<File> {
  const sourceReader = new TakeoutZipReader(file);
  const reader = new ZipReader(sourceReader);
  const directory = options.ownerId ? await getTakeoutDirectory() : null;
  const outputName = directory ? `tt-takeout-prepared-${crypto.randomUUID()}.zip` : null;
  let outputHandle: TakeoutFileHandle | null = null;
  let outputStream: WritableStream<Uint8Array> | null = null;
  let completed = false;

  try {
    const metadata: FileEntry[] = [];
    const parts: FileEntry[] = [];
    let entryCount = 0;
    let nestedBytes = 0;
    options.onProgress?.({ phase: "scanning", processed: 0, total: null });
    for await (const value of reader.getEntriesGenerator()) {
      if (++entryCount > MAX_TAKEOUT_ENTRIES)
        throw new Error(m.portability_takeout_metadata_limit());
      const entry = value;
      if (entryCount % 256 === 0) {
        options.onProgress?.({ phase: "scanning", processed: entryCount, total: null });
      }
      if (entry.directory) continue;
      sourceReader.registerEntry(entry);
      if (isTakeoutMetadata(entry.filename)) metadata.push(entry);
      else if (isRootZipPart(entry.filename)) {
        if (entry.encrypted || entry.uncompressedSize > MAX_NESTED_BYTES) {
          throw new Error(m.portability_takeout_metadata_limit());
        }
        nestedBytes += entry.uncompressedSize;
        if (nestedBytes > MAX_NESTED_TOTAL_BYTES || parts.length >= MAX_NESTED_ARCHIVES) {
          throw new Error(m.portability_takeout_metadata_limit());
        }
        parts.push(entry);
      }
    }
    if (metadata.length === 0 && parts.length === 0) {
      throw new Error(m.portability_takeout_no_metadata());
    }
    if ((!directory || !outputName) && nestedBytes > MAX_IN_MEMORY_BYTES) {
      throw new Error(m.portability_takeout_storage_required());
    }

    if (directory && outputName) {
      outputHandle = await directory.getFileHandle(outputName, { create: true });
      outputStream = await outputHandle.createWritable();
    }
    const blobWriter = outputStream ? null : new BlobWriter("application/zip");
    const writer = new ZipWriter(outputStream ?? (blobWriter as BlobWriter), { passThrough: true });
    const packer = new YoutubeTakeoutMetadataPacker(writer, outputStream, options.onProgress);
    let extractedBytes = 0;
    let lastExtractReport = 0;

    try {
      for (const entry of metadata) await packer.add(entry, 0, sourceReader);
      for (let index = 0; index < parts.length; index++) {
        const part = parts[index];
        if (!directory) {
          const nested = await sourceReader.withEntryBounds(part, () =>
            part.getData<Blob>(new BlobWriter("application/zip")),
          );
          const nestedSourceReader = new TakeoutZipReader(nested);
          const nestedReader = new ZipReader(nestedSourceReader);
          try {
            for await (const value of nestedReader.getEntriesGenerator()) {
              if (++entryCount > MAX_TAKEOUT_ENTRIES)
                throw new Error(m.portability_takeout_metadata_limit());
              const entry = value;
              if (!entry.directory) nestedSourceReader.registerEntry(entry);
              if (!entry.directory && isTakeoutMetadata(entry.filename)) {
                await packer.add(entry, index + 1, nestedSourceReader);
              }
            }
          } finally {
            await nestedReader.close();
          }
          continue;
        }

        const tempName = `tt-takeout-part-${crypto.randomUUID()}.zip`;
        try {
          const tempHandle = await directory.getFileHandle(tempName, { create: true });
          options.onProgress?.({
            phase: "extracting",
            processed: extractedBytes,
            total: nestedBytes,
          });
          const writable = await tempHandle.createWritable();
          await sourceReader.withEntryBounds(part, () =>
            streamTakeoutPart(part, writable, (bytes) => {
              extractedBytes += bytes;
              if (
                extractedBytes - lastExtractReport >= PROGRESS_INTERVAL_BYTES ||
                extractedBytes === nestedBytes
              ) {
                lastExtractReport = extractedBytes;
                options.onProgress?.({
                  phase: "extracting",
                  processed: extractedBytes,
                  total: nestedBytes,
                });
              }
            }),
          );
          const nestedSourceReader = new TakeoutZipReader(await tempHandle.getFile());
          const nestedReader = new ZipReader(nestedSourceReader);
          try {
            for await (const value of nestedReader.getEntriesGenerator()) {
              if (++entryCount > MAX_TAKEOUT_ENTRIES)
                throw new Error(m.portability_takeout_metadata_limit());
              const entry = value;
              if (!entry.directory) nestedSourceReader.registerEntry(entry);
              if (!entry.directory && isTakeoutMetadata(entry.filename)) {
                await packer.add(entry, index + 1, nestedSourceReader);
              }
            }
          } finally {
            await nestedReader.close();
          }
        } finally {
          await directory.removeEntry(tempName).catch(() => undefined);
        }
      }

      if (packer.selectedCount === 0) throw new Error(m.portability_takeout_no_metadata());
      const result = await writer.close();
      const archive = outputHandle ? await outputHandle.getFile() : (result as Blob);
      if (archive.size > MAX_METADATA_BYTES) {
        throw new Error(m.portability_takeout_metadata_limit());
      }
      const prepared = new File([archive], "youtube-takeout.zip", { type: "application/zip" });
      if (outputName && options.ownerId)
        await persistPreparedTakeout(options.ownerId, outputName, prepared.size);
      completed = true;
      return prepared;
    } finally {
      if (!completed) await outputStream?.abort().catch(() => undefined);
    }
  } catch (error) {
    if (isTakeoutStorageQuotaError(error)) {
      throw new Error(m.portability_takeout_storage_required());
    }
    throw error;
  } finally {
    if (!completed && outputName) await directory?.removeEntry(outputName).catch(() => undefined);
    await reader.close();
  }
}
