import { BlobReader, type CreateReadableOptions, type FileEntry } from "@zip.js/zip.js";

const ZIP32_WRAP = 0x1_0000_0000;
const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const LOCAL_FILE_HEADER_SIZE = 30;
const READ_CHUNK_BYTES = 1024 * 1024;

type EntryMapping = {
  logicalStart: number;
  logicalEnd: number;
  offsetDelta: number;
};

export class TakeoutZipReader extends BlobReader {
  private readonly physicalSize: number;
  private readonly entries = new Map<number, FileEntry>();
  private mapping: EntryMapping | null = null;

  constructor(blob: Blob) {
    super(blob);
    this.physicalSize = blob.size;
  }

  registerEntry(entry: FileEntry): void {
    this.entries.set(entry.offset, entry);
  }

  async withEntryBounds<T>(entry: FileEntry, operation: () => Promise<T>): Promise<T> {
    const mapping = await this.findEntryMapping(entry.offset, entry);
    if (!mapping) return operation();
    const originalSize = this.size;
    this.size = Math.max(originalSize, mapping.logicalEnd);
    this.mapping = mapping;
    try {
      return await operation();
    } finally {
      this.size = originalSize;
      this.mapping = null;
    }
  }

  override async readUint8Array(offset: number, length: number): Promise<Uint8Array> {
    if (length === LOCAL_FILE_HEADER_SIZE) {
      const entry = this.entries.get(offset);
      this.mapping = entry ? await this.findEntryMapping(offset, entry) : null;
    }
    return super.readUint8Array(this.mapOffset(offset, length), length);
  }

  override createReadable(options: CreateReadableOptions = {}): ReadableStream<Uint8Array> {
    const reader = this;
    const offset = options.offset ?? 0;
    const size = options.size ?? Math.max(0, this.size - offset);
    const chunkSize = Math.max(1, options.chunkSize ?? READ_CHUNK_BYTES);
    let processed = 0;
    return new ReadableStream<Uint8Array>({
      async pull(controller) {
        if (processed >= size) {
          controller.close();
          return;
        }
        const data = await reader.readUint8Array(
          offset + processed,
          Math.min(chunkSize, size - processed),
        );
        if (!data.length) {
          controller.close();
          return;
        }
        processed += data.length;
        controller.enqueue(data);
      },
    });
  }

  private mapOffset(offset: number, length: number): number {
    const mapping = this.mapping;
    return mapping && offset >= mapping.logicalStart && offset + length <= mapping.logicalEnd
      ? offset + mapping.offsetDelta
      : offset;
  }

  private async findEntryMapping(
    logicalStart: number,
    entry: FileEntry,
  ): Promise<EntryMapping | null> {
    const firstWrap = Math.ceil(-logicalStart / ZIP32_WRAP);
    const lastWrap = Math.floor(
      (this.physicalSize - LOCAL_FILE_HEADER_SIZE - logicalStart) / ZIP32_WRAP,
    );
    const matches: { actualStart: number; filenameLength: number; extraLength: number }[] = [];

    for (let wrap = firstWrap; wrap <= lastWrap; wrap++) {
      const actualStart = logicalStart + wrap * ZIP32_WRAP;
      const header = await super.readUint8Array(actualStart, LOCAL_FILE_HEADER_SIZE);
      if (header.length !== LOCAL_FILE_HEADER_SIZE) continue;
      const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
      if (
        view.getUint32(0, true) !== LOCAL_FILE_HEADER_SIGNATURE ||
        view.getUint16(8, true) !== entry.compressionMethod
      ) {
        continue;
      }

      const filenameLength = view.getUint16(26, true);
      const extraLength = view.getUint16(28, true);
      if (filenameLength !== entry.rawFilename.length) continue;
      const filename = await super.readUint8Array(
        actualStart + LOCAL_FILE_HEADER_SIZE,
        filenameLength,
      );
      if (!filename.every((byte, index) => byte === entry.rawFilename[index])) continue;
      const hasDataDescriptor = (view.getUint16(6, true) & 0x08) !== 0;
      const localSize = view.getUint32(18, true);
      if (!hasDataDescriptor && localSize !== 0xffffffff && localSize !== entry.compressedSize) {
        continue;
      }
      matches.push({ actualStart, filenameLength, extraLength });
    }

    if (matches.length !== 1) return null;
    const match = matches[0];
    const dataEnd =
      logicalStart +
      LOCAL_FILE_HEADER_SIZE +
      match.filenameLength +
      match.extraLength +
      entry.compressedSize +
      24;
    return {
      logicalStart,
      logicalEnd: dataEnd,
      offsetDelta: match.actualStart - logicalStart,
    };
  }
}
