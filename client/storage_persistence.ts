import type { KvKey } from "../plug-api/types/datastore.ts";

/** The part of `navigator.storage` used here. */
export type PersistenceStorage = Pick<StorageManager, "persisted" | "persist">;

/** Set in the space's local data once `persist()` was called automatically. */
export const persistRequestedKey: KvKey = ["client", "persistRequested"];

function isSupported(
  storage?: Partial<PersistenceStorage>,
): storage is PersistenceStorage {
  return (
    typeof storage?.persisted === "function" &&
    typeof storage?.persist === "function"
  );
}

/**
 * Chromium browsers never prompt for persistent storage: they grant or deny it
 * silently based on their own signals, so a user can't act on a warning.
 */
export function isChromium(nav: {
  userAgent: string;
  userAgentData?: { brands?: { brand: string }[] };
}): boolean {
  const brands = nav.userAgentData?.brands;
  return brands
    ? brands.some((b) => b.brand === "Chromium")
    : /\bChrom(e|ium)\//.test(nav.userAgent);
}

/**
 * Asks the browser to make this space's local data persistent (so it is not
 * evicted under storage pressure). Browsers that prompt are asked only once per
 * space and browser; `silent` browsers never prompt, so they are asked on every
 * boot (their answer can change over time) and a denial is only logged.
 * Returns whether storage is (still) not persistent. Whether to warn about it
 * is up to the caller (the `persistentStorageWarning` config option).
 */
export async function initStoragePersistence({
  storage,
  store,
  storesLocally,
  silent = false,
}: {
  storage?: Partial<PersistenceStorage>;
  store: {
    get(key: KvKey): Promise<unknown>;
    set(key: KvKey, value: unknown): Promise<void>;
  };
  /** Whether this client keeps a copy of the space in the browser. */
  storesLocally: boolean;
  /** The browser decides without prompting and the user can't act on it. */
  silent?: boolean;
}): Promise<boolean> {
  if (!storesLocally || !isSupported(storage)) {
    return false;
  }
  try {
    if (await storage.persisted()) {
      return false;
    }
    if (silent) {
      if (!(await storage.persist())) {
        console.warn("The browser denied persistent storage");
      }
      return false;
    }
    let persisted = false;
    if (!(await store.get(persistRequestedKey))) {
      // Remember first: some browsers prompt, and a crash must not re-prompt
      await store.set(persistRequestedKey, true);
      persisted = await storage.persist();
    }
    return !persisted;
  } catch (e: any) {
    console.warn("Could not check persistent storage:", e.message);
    return false;
  }
}

/** Requests persistent storage again. Returns whether it was granted. */
export async function retryStoragePersistence(
  storage?: Partial<PersistenceStorage>,
): Promise<boolean> {
  if (!isSupported(storage)) {
    return false;
  }
  try {
    return await storage.persist();
  } catch (e: any) {
    console.warn("Could not request persistent storage:", e.message);
    return false;
  }
}
