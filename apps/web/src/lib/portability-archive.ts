import { BlobReader, isZipFile } from "@zip.js/zip.js";

export type PortabilityArchiveIssue = "invalid-zip" | "wrong-format";

export function isZipArchive(file: Blob): Promise<boolean> {
  return isZipFile(new BlobReader(file), { strictness: "tolerant" });
}

export async function portabilityArchiveIssue(
  file: File,
  expectedExtension?: string,
): Promise<PortabilityArchiveIssue | null> {
  const advertisedZip =
    /\.zip$/i.test(file.name) ||
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed";
  let isZip = false;
  try {
    isZip = await isZipArchive(file);
  } catch {
    if (advertisedZip) return "invalid-zip";
  }
  if (!isZip && (advertisedZip || expectedExtension === "zip")) return "invalid-zip";
  return isZip && expectedExtension != null && expectedExtension !== "zip" ? "wrong-format" : null;
}
