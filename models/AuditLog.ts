import { model, models, Schema } from "mongoose";

const AuditLogSchema = new Schema(
  {
    actor: { type: String, required: true, default: "admin", index: true },
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true, index: true },
    entityId: { type: String, default: "", index: true },
    summary: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });

export default models.AuditLog || model("AuditLog", AuditLogSchema);
