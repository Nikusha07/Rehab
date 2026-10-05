import { model, models, Schema } from "mongoose";

const WorkingHoursSchema = new Schema(
  {
    specialistId: { type: Schema.Types.ObjectId, ref: "Specialist", required: true, index: true },
    weekday: { type: Number, required: true, min: 0, max: 6 },
    openTime: { type: String, default: "10:00" },
    closeTime: { type: String, default: "18:00" },
    isDayOff: { type: Boolean, default: false },
  },
  { timestamps: true }
);
WorkingHoursSchema.index({ specialistId: 1, weekday: 1 }, { unique: true });

export default models.WorkingHours || model("WorkingHours", WorkingHoursSchema);
