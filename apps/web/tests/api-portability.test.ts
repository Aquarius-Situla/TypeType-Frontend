import { afterEach, expect, mock, test } from "bun:test";

if (!("localStorage" in globalThis)) {
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    },
  });
}

const { startPortabilityImport } = await import("../src/lib/api-portability");
const { useAuthStore } = await import("../src/stores/auth-store");

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  useAuthStore.getState().setSignedOut();
});

test("portability imports send the selected source format", async () => {
  useAuthStore.getState().setToken("test-token");
  globalThis.fetch = mock(async () =>
    Response.json({
      id: "job-id",
      kind: "import",
      state: "queued",
      createdAt: 1,
      updatedAt: 1,
      requestId: null,
      preview: null,
      result: null,
      progress: null,
      errorCode: null,
      errorMessage: null,
    }),
  );

  const { ZipWriter, BlobWriter, TextReader } = await import("@zip.js/zip.js");
  const archive = new ZipWriter(new BlobWriter());
  await archive.add("Takeout/YouTube/subscriptions.csv", new TextReader("Channel Id\nUC1"));
  const accepted = mock(() => undefined);
  await startPortabilityImport(
    new File([await archive.close()], "takeout.zip"),
    "youtube-takeout",
    { onAccepted: accepted },
  );
  expect(accepted).toHaveBeenCalledWith(expect.objectContaining({ id: "job-id" }));

  const [url, request] = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0] as [
    string,
    RequestInit,
  ];
  expect(url).toBe("/api/portability/imports?format=youtube-takeout");
  expect(request.method).toBe("POST");
  expect(request.body).toBeInstanceOf(FormData);
  expect((request.body as FormData).get("file")).toBeInstanceOf(File);
});

test("automatic imports let the server detect the source without a format hint", async () => {
  useAuthStore.getState().setToken("test-token");
  globalThis.fetch = mock(async () =>
    Response.json({
      id: "auto-job-id",
      kind: "import",
      state: "queued",
      createdAt: 1,
      updatedAt: 1,
      requestId: null,
      preview: null,
      result: null,
      progress: null,
      errorCode: null,
      errorMessage: null,
    }),
  );

  const { ZipWriter, BlobWriter, TextReader } = await import("@zip.js/zip.js");
  const archive = new ZipWriter(new BlobWriter());
  await archive.add("Takeout/YouTube/subscriptions.csv", new TextReader("Channel Id\nUC1"));
  await startPortabilityImport(new File([await archive.close()], "takeout.zip"), "auto");

  const [url] = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0] as [string];
  expect(url).toBe("/api/portability/imports");
});
