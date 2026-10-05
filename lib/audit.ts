import AuditLog from "@/models/AuditLog";

export async function writeAudit(entry: {
  actor?: string;
  action: string;
  entity: string;
  entityId?: string;
  summary: string;
  metadata?: unknown;
}) {
  try {
    await AuditLog.create({
      actor: entry.actor || "admin",
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId || "",
      summary: entry.summary,
      metadata: entry.metadata ?? null,
    });
  } catch (error) {
    console.error("audit log failed", error);
  }
}
