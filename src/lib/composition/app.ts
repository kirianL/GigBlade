import { createMemoryApp } from "@/lib/composition/memory-app";
import { createRealApp } from "@/lib/composition/real-app";

type App = ReturnType<typeof createMemoryApp> | ReturnType<typeof createRealApp>;

let app: App | undefined;

export function getRuntime(): "memory" | "real" {
  return process.env.APP_RUNTIME === "real" ? "real" : "memory";
}

export function getApp(): App {
  if (!app) {
    app = getRuntime() === "real" ? createRealApp() : createMemoryApp();
  }

  return app;
}
