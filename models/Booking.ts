import { model, models, Schema } from "mongoose";

const BookingSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    patientName: { type: String, required: true },
    patientPhone: { type: String, required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    specialistId: { type: Schema.Types.ObjectId, ref: "Specialist", required: true, index: true },
    date: { type: String, required: true, index: true },
    time: { type: String, required: true },
    durationMinutes: { type: Number, required: true },
    status: { type: String, enum: ["confirmed", "cancelled", "completed", "no_show"], default: "confirmed", index: true },
    notes: { type: String, default: "" },
    confirmationCode: { type: String, required: true, unique: true, index: true },
    reminderSentAt: { type: Date, default: null, index: true },
    reminderLastError: { type: String, default: "" },
  },
  { timestamps: true }
);
BookingSchema.index({ specialistId: 1, date: 1, time: 1 });
BookingSchema.index({ date: 1, status: 1, reminderSentAt: 1 });

export default models.Booking || model("Booking", BookingSchema);
