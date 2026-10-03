import type { FileEntry, ZipWriter } from "@zip.js/zip.js";
import { m } from "../paraglide/messages.js";
import type { PortabilityPreparationProgress } from "./portability-preparation-progress";
import type { TakeoutZipReader } from "./takeout-zip-reader";
import { appendTakeoutMetadata, uniqueTakeoutEntryName } from "./youtube-takeout-archive";

export const MAX_METADATA_BYTES = 512 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 2 * 1024 * 1024 * 1024;
export const MAX_IN_MEMORY_BYTES = 64 * 1024 * 1024;
export const MAX_TAKEOUT_ENTRIES = 100_000;
const PROGRESS_INTERVAL_BYTES = 8 * 1024 * 1024;

export class YoutubeTakeoutMetadataPacker<T> {
  private readonly usedNames = new Set<string>();
  private compressedBytes = 0;
  private expandedBytes = 0;
  private count = 0;
  private packedBytes = 0;
  private lastPackReport = 0;
  private readonly writer: ZipWriter<T>;
  private readonly outputStream: WritableStream<Uint8Array> | null;
  private readonly onProgress?: (progress: Omit<PortabilityPreparationProgress, "ownerId">) => void;

  constructor(
    writer: ZipWriter<T>,
    outputStream: WritableStream<Uint8Array> | null,
    onProgress?: (progress: Omit<PortabilityPreparationProgress, "ownerId">) => void,
  ) {
    this.writer = writer;
    this.outputStream = outputStream;
    this.onProgress = onProgress;
  }

  get selectedCount(): number {
    return this.count;
  }

  async add(entry: FileEntry, part: number, reader: TakeoutZipReader): Promise<void> {
    if (entry.encrypted) throw new Error(m.portability_takeout_metadata_limit());
    this.compressedBytes += entry.compressedSize;
    this.expandedBytes += entry.uncompressedSize;
    this.count++;
    if (
      this.count > MAX_TAKEOUT_ENTRIES ||
      entry.uncompressedSize > MAX_METADATA_BYTES ||
      this.compressedBytes > MAX_METADATA_BYTES ||
      this.expandedBytes > MAX_EXPANDED_BYTES ||
      (!this.outputStream && this.compressedBytes > MAX_IN_MEMORY_BYTES)
    ) {
      throw new Error(
        !this.outputStream && this.compressedBytes > MAX_IN_MEMORY_BYTES
          ? m.portability_takeout_storage_required()
          : m.portability_takeout_metadata_limit(),
      );
    }
    this.onProgress?.({ phase: "packing", processed: this.packedBytes, total: null });
    await reader.withEntryBounds(entry, () =>
      appendTakeoutMetadata(
        this.writer,
        entry,
        uniqueTakeoutEntryName(entry.filename, part, this.usedNames),
        (bytes) => {
          this.packedBytes += bytes;
          if (this.packedBytes - this.lastPackReport >= PROGRESS_INTERVAL_BYTES) {
            this.lastPackReport = this.packedBytes;
            this.onProgress?.({ phase: "packing", processed: this.packedBytes, total: null });
          }
        },
      ),
    );
  }
}
