const MAX_CHANNELS = 500;
const MAX_BODY_BYTES = 1024 * 1024;
const MAX_URL_LENGTH = 2048;
const ENCODER = new TextEncoder();
const EMPTY_BODY_BYTES = ENCODER.encode(JSON.stringify({ channelUrls: [] })).byteLength;

export function membershipBatches(urls: string[]): { batches: string[][]; invalid: string[] } {
  const batches: string[][] = [];
  const invalid: string[] = [];
  let batch: string[] = [];
  let bytes = EMPTY_BODY_BYTES;
  for (const url of new Set(urls)) {
    if (!url.trim() || url.length > MAX_URL_LENGTH) {
      invalid.push(url);
      continue;
    }
    const size = ENCODER.encode(JSON.stringify(url)).byteLength;
    if (batch.length === MAX_CHANNELS || bytes + size + (batch.length ? 1 : 0) > MAX_BODY_BYTES) {
      batches.push(batch);
      batch = [];
      bytes = EMPTY_BODY_BYTES;
    }
    bytes += size + (batch.length ? 1 : 0);
    batch.push(url);
  }
  if (batch.length) batches.push(batch);
  return { batches, invalid };
}
