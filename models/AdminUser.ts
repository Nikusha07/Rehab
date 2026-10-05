import { model, models, Schema } from "mongoose";

const AdminUserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    role: { type: String, enum: ["owner", "reception", "doctor"], default: "reception", index: true },
    isActive: { type: Boolean, default: true, index: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default models.AdminUser || model("AdminUser", AdminUserSchema);
