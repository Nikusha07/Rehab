import { model, models, Schema } from "mongoose";

const PatientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, index: true },
    email: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default models.Patient || model("Patient", PatientSchema);
