import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearPanelAuthSession,
  PANEL_SESSION_KEY,
  readPanelAuthSession,
  writePanelAuthSession,
} from "@/panel/panel-session";

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

describe("panel-session client storage (SEC-01)", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    const localStorage = createMemoryStorage();
    const sessionStorage = createMemoryStorage();
    (globalThis as unknown as { window: unknown }).window = {
      localStorage,
      sessionStorage,
      dispatchEvent: () => true,
    };
  });

  afterEach(() => {
    (globalThis as unknown as { window: unknown }).window = originalWindow;
  });

  it("no persiste token en localStorage ni sessionStorage", () => {
    writePanelAuthSession({
      user: { email: "hola@gigblade.com", name: "Kirian", role: "platform" },
    });

    const raw = globalThis.window.localStorage.getItem(PANEL_SESSION_KEY);
    expect(raw).toBeTruthy();
    expect(raw).not.toContain("token");
    expect(globalThis.window.sessionStorage.getItem(PANEL_SESSION_KEY)).toBeNull();

    const parsed = readPanelAuthSession();
    expect(parsed).toEqual({
      user: { email: "hola@gigblade.com", name: "Kirian", role: "platform" },
    });
  });

  it("limpia automáticamente cualquier token heredado en localStorage al leer", () => {
    globalThis.window.localStorage.setItem(
      PANEL_SESSION_KEY,
      JSON.stringify({
        token: "legacy-secret-token",
        user: { email: "hola@gigblade.com", name: "Kirian", role: "platform" },
      }),
    );

    const parsed = readPanelAuthSession();
    expect(parsed).toEqual({
      user: { email: "hola@gigblade.com", name: "Kirian", role: "platform" },
    });

    const updatedRaw = globalThis.window.localStorage.getItem(PANEL_SESSION_KEY);
    expect(updatedRaw).not.toContain("legacy-secret-token");
    expect(updatedRaw).not.toContain("token");

    clearPanelAuthSession();
    expect(globalThis.window.localStorage.getItem(PANEL_SESSION_KEY)).toBeNull();
  });
});
