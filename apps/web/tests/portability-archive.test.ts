import { expect, test } from "bun:test";
import { BlobWriter, TextReader, ZipWriter } from "@zip.js/zip.js";
import { isZipArchive, portabilityArchiveIssue } from "../src/lib/portability-archive";

test("recognizes a ZIP by its contents rather than its filename", async () => {
  const writer = new ZipWriter(new BlobWriter());
  await writer.add("account.json", new TextReader("{}"));
  const archive = await writer.close();
  const namelessZip = new File([archive], "backup-without-extension.data");

  expect(await isZipArchive(namelessZip)).toBe(true);
  expect(await portabilityArchiveIssue(namelessZip, "zip")).toBeNull();
  expect(await portabilityArchiveIssue(namelessZip)).toBeNull();
  expect(await isZipArchive(new File(["not a zip"], "backup.zip"))).toBe(false);
});

test("routes a ZIP submitted to a JSON importer to the matching source", async () => {
  const writer = new ZipWriter(new BlobWriter());
  await writer.add("backup.json", new TextReader("{}"));
  const archive = await writer.close();
  const file = new File([archive], "arbitrary-name.zip");

  expect(await portabilityArchiveIssue(file, "json")).toBe("wrong-format");
});

test("marks a non-ZIP file as invalid for a ZIP-based importer", async () => {
  const file = new File(["[]"], "takeout.json", { type: "application/json" });

  expect(await portabilityArchiveIssue(file, "zip")).toBe("invalid-zip");
});
