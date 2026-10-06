import { model, models, Schema } from "mongoose";

const PhoneVerificationSchema = new Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    codeHash: { type: String, required: true },
    codeExpiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, required: true },
    windowStartedAt: { type: Date, required: true },
    sendsInWindow: { type: Number, default: 1 },
    verifiedAt: { type: Date, default: null },
    tokenHash: { type: String, default: "" },
    tokenExpiresAt: { type: Date, default: null },
    consumedAt: { type: Date, default: null },
    cleanupAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

export default models.PhoneVerification || model("PhoneVerification", PhoneVerificationSchema);
