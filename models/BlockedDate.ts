import { model, models, Schema } from "mongoose";

const BlockedDateSchema = new Schema(
  {
    date: { type: String, required: true, index: true },
    specialistId: { type: Schema.Types.ObjectId, ref: "Specialist", default: null },
    title: { type: String, required: true },
    reason: { type: String, default: "" },
  },
  { timestamps: true }
);
BlockedDateSchema.index({ date: 1, specialistId: 1 }, { unique: true });

export default models.BlockedDate || model("BlockedDate", BlockedDateSchema);
