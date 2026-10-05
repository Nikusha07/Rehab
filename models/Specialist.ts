import { model, models, Schema } from "mongoose";

const SpecialistSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, default: "" },
    bio: { type: String, default: "" },
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.Specialist || model("Specialist", SpecialistSchema);
