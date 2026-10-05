import { model, models, Schema } from "mongoose";

const SlotLockSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    specialistId: { type: Schema.Types.ObjectId, ref: "Specialist", required: true, index: true },
    date: { type: String, required: true, index: true },
    time: { type: String, required: true },
  },
  { timestamps: true }
);
SlotLockSchema.index({ specialistId: 1, date: 1, time: 1 });

export default models.SlotLock || model("SlotLock", SlotLockSchema);
