export type PlatformLog = {
  level: "error" | "warn" | "info";
  event: string;
  operation?: string;
  tenantId?: string;
  requestId?: string;
  provider?: string;
  providerCode?: string;
  reason?: string;
  detail?: string;
};

const ALERT_WINDOW_MS = 60_000;
const ALERT_SPIKE = 3;

type AlertHit = { at: number; key: string };

let hits: AlertHit[] = [];

export function resetPlatformAlertStateForTests(): void {
  hits = [];
}

export function logPlatformEvent(entry: PlatformLog): void {
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      ...entry,
    }),
  );
}

export function raisePlatformAlert(
  entry: Omit<PlatformLog, "level" | "event"> & { immediate?: boolean },
): void {
  const key = `${entry.operation ?? "unknown"}:${entry.reason ?? "unknown"}`;
  const now = Date.now();
  hits = hits.filter((hit) => now - hit.at < ALERT_WINDOW_MS);
  hits.push({ at: now, key });

  const volume = hits.filter((hit) => hit.key === key).length;
  if (!entry.immediate && volume < ALERT_SPIKE) {
    return;
  }

  const { immediate: _ignored, ...fields } = entry;
  logPlatformEvent({
    level: "error",
    event: "platform_alert",
    ...fields,
    reason: entry.immediate
      ? entry.reason
      : `volume_spike:${entry.reason ?? "unknown"}`,
  });
}
