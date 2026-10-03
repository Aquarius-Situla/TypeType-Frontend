export type TakeoutFileHandle = {
  createWritable(): Promise<WritableStream<Uint8Array>>;
  getFile(): Promise<File>;
};

export type TakeoutDirectory = {
  getFileHandle(name: string, options?: { create?: boolean }): Promise<TakeoutFileHandle>;
  removeEntry(name: string): Promise<void>;
};

type StorageWithDirectory = StorageManager & {
  getDirectory?: () => Promise<TakeoutDirectory>;
};

type PreparedTakeout = { name: string; size: number };
const STORE_PREFIX = "typetype-portability-prepared-takeout:";
const FILE_PREFIX = "tt-takeout-prepared-";

export async function getTakeoutDirectory(): Promise<TakeoutDirectory | null> {
  try {
    if (typeof navigator === "undefined") return null;
    const storage = navigator.storage as StorageWithDirectory;
    return storage.getDirectory ? await storage.getDirectory() : null;
  } catch {
    return null;
  }
}

function readPrepared(ownerId: string): PreparedTakeout | null {
  try {
    if (typeof window === "undefined") return null;
    const value = window.localStorage.getItem(STORE_PREFIX + ownerId);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<PreparedTakeout>;
    if (
      typeof parsed.name !== "string" ||
      !parsed.name.startsWith(FILE_PREFIX) ||
      !parsed.name.endsWith(".zip") ||
      typeof parsed.size !== "number"
    ) {
      return null;
    }
    return { name: parsed.name, size: parsed.size };
  } catch {
    return null;
  }
}

export async function persistPreparedTakeout(
  ownerId: string,
  name: string,
  size: number,
): Promise<boolean> {
  const directory = await getTakeoutDirectory();
  if (!directory || typeof window === "undefined") return false;
  const previous = readPrepared(ownerId);
  try {
    window.localStorage.setItem(STORE_PREFIX + ownerId, JSON.stringify({ name, size }));
    if (previous && previous.name !== name) {
      await directory.removeEntry(previous.name).catch(() => undefined);
    }
    return true;
  } catch {
    return false;
  }
}

export async function getPreparedTakeout(ownerId: string): Promise<File | null> {
  const saved = readPrepared(ownerId);
  if (!saved) return null;
  try {
    const directory = await getTakeoutDirectory();
    if (!directory) return null;
    const file = await (await directory.getFileHandle(saved.name)).getFile();
    if (file.size !== saved.size) return null;
    return file;
  } catch {
    return null;
  }
}

export async function clearPreparedTakeout(ownerId: string): Promise<void> {
  const saved = readPrepared(ownerId);
  try {
    if (typeof window !== "undefined") window.localStorage.removeItem(STORE_PREFIX + ownerId);
  } catch {
    return;
  }
  if (!saved) return;
  const directory = await getTakeoutDirectory();
  await directory?.removeEntry(saved.name).catch(() => undefined);
}
