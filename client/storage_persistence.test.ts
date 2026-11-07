import { readFileSync } from "node:fs";
import { describe, expect, test, vi } from "vitest";
import { extractSpaceLuaFromPageText, loadConfig } from "./boot_config.ts";
import {
  initStoragePersistence,
  type PersistenceStorage,
  retryStoragePersistence,
} from "./storage_persistence.ts";

function fakeStorage(persisted: boolean, grant: boolean) {
  const storage = {
    persisted: vi.fn(async () => persisted),
    persist: vi.fn(async () => grant),
  };
  return storage satisfies PersistenceStorage;
}

function fakeStore(requested = false) {
  const values = new Map<string, unknown>();
  if (requested)
    values.set(JSON.stringify(["client", "persistRequested"]), true);
  return {
    values,
    get: vi.fn(
      async (key: string[]) => values.get(JSON.stringify(key)) ?? null,
    ),
    set: vi.fn(async (key: string[], value: unknown) => {
      values.set(JSON.stringify(key), value);
    }),
  };
}

const local = { storesLocally: true };

describe("initStoragePersistence", () => {
  test("already persistent: no request, no warning", async () => {
    const storage = fakeStorage(true, true);
    const store = fakeStore();
    expect(await initStoragePersistence({ storage, store, ...local })).toBe(
      false,
    );
    expect(storage.persist).not.toHaveBeenCalled();
  });

  test("not persistent and never asked: requests once; granted hides the warning", async () => {
    const storage = fakeStorage(false, true);
    const store = fakeStore();
    expect(await initStoragePersistence({ storage, store, ...local })).toBe(
      false,
    );
    expect(storage.persist).toHaveBeenCalledTimes(1);
  });

  test("denied: warning shows", async () => {
    const storage = fakeStorage(false, false);
    const store = fakeStore();
    expect(await initStoragePersistence({ storage, store, ...local })).toBe(
      true,
    );
    expect(storage.persist).toHaveBeenCalledTimes(1);
  });

  test("the request is remembered, so the next boot does not ask again", async () => {
    const storage = fakeStorage(false, false);
    const store = fakeStore();
    await initStoragePersistence({ storage, store, ...local });
    expect(await initStoragePersistence({ storage, store, ...local })).toBe(
      true,
    );
    expect(storage.persist).toHaveBeenCalledTimes(1);
  });

  test("cleared local data (no stored flag) asks again", async () => {
    const storage = fakeStorage(false, false);
    await initStoragePersistence({ storage, store: fakeStore(), ...local });
    await initStoragePersistence({ storage, store: fakeStore(), ...local });
    expect(storage.persist).toHaveBeenCalledTimes(2);
  });

  test("the flag is stored before the request, so a crash does not re-ask", async () => {
    const storage = fakeStorage(false, false);
    const store = fakeStore();
    storage.persist.mockImplementation(async () => {
      expect(store.values.size).toBe(1);
      return false;
    });
    await initStoragePersistence({ storage, store, ...local });
    expect.assertions(1);
  });

  test("unsupported API: no icon, no errors, no request", async () => {
    const store = fakeStore();
    for (const storage of [undefined, {}, { persist: async () => true }]) {
      expect(
        await initStoragePersistence({
          storage: storage as any,
          store,
          ...local,
        }),
      ).toBe(false);
    }
    expect(store.set).not.toHaveBeenCalled();
  });

  test("an API that throws behaves like unsupported", async () => {
    const storage = {
      persisted: async () => {
        throw new Error("nope");
      },
      persist: async () => true,
    };
    expect(
      await initStoragePersistence({ storage, store: fakeStore(), ...local }),
    ).toBe(false);
  });

  test("no local copy of the space: no request, no icon", async () => {
    const storage = fakeStorage(false, false);
    const store = fakeStore();
    expect(
      await initStoragePersistence({
        storage,
        store,
        storesLocally: false,
      }),
    ).toBe(false);
    expect(storage.persist).not.toHaveBeenCalled();
  });
});

describe("retryStoragePersistence", () => {
  test("granted", async () => {
    expect(await retryStoragePersistence(fakeStorage(false, true))).toBe(true);
  });

  test("refused", async () => {
    const storage = fakeStorage(false, false);
    expect(await retryStoragePersistence(storage)).toBe(false);
    expect(storage.persist).toHaveBeenCalledTimes(1);
  });

  test("unsupported or throwing counts as refused", async () => {
    expect(await retryStoragePersistence(undefined)).toBe(false);
    expect(
      await retryStoragePersistence({
        persisted: async () => false,
        persist: async () => {
          throw new Error("nope");
        },
      }),
    ).toBe(false);
  });
});

describe("persistentStorageWarning config option", () => {
  async function stdConfig(extraLua = "") {
    const lua = [
      "libraries/Library/Std/APIs/Schema.md",
      "libraries/Library/Std/Config.md",
    ]
      .map((path) => extractSpaceLuaFromPageText(readFileSync(path, "utf8")))
      .join("\n");
    return loadConfig(`${lua}\n${extraLua}`, {}, false);
  }

  test("is on by default", async () => {
    expect((await stdConfig()).get("persistentStorageWarning", undefined)).toBe(
      true,
    );
  });

  test("can be turned off", async () => {
    const config = await stdConfig(
      `config.set("persistentStorageWarning", false)`,
    );
    expect(config.get("persistentStorageWarning", undefined)).toBe(false);
  });

  test("rejects a non-boolean", async () => {
    const config = await stdConfig();
    expect(() => config.set("persistentStorageWarning", "no")).toThrow();
  });
});
