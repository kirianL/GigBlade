export type AuditEvent = {
  actorUserId?: string;
  tenantId?: string;
  action: string;
  resource: string;
  metadata?: Record<string, unknown>;
};

export type AuditLog = {
  record(event: AuditEvent): Promise<void>;
};

export async function recordAuditEvent(
  log: AuditLog,
  event: AuditEvent,
): Promise<void> {
  await log.record(event);
}
