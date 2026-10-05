import { model, models, Schema } from "mongoose";

const SmsLogSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", default: null },
    phone: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed", "skipped"], required: true },
    payload: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export default models.SmsLog || model("SmsLog", SmsLogSchema);
