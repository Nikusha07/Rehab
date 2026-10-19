import { model, models, Schema } from "mongoose";

const InvoiceSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
  number: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  patient: { name: String, personalId: String, phone: String, address: String },
  center: { name: String, taxId: String, address: String, bank: String, bankCode: String, account: String, director: String },
  items: [{ description: String, unitPrice: Number, quantity: Number }],
  totalCents: { type: Number, required: true },
  revision: { type: Number, default: 0 },
}, { timestamps: true });

export default models.Invoice || model("Invoice", InvoiceSchema);
