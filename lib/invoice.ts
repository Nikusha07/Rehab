import { z } from "zod";

export const patientFields = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.union([z.literal(""), z.email()]),
  notes: z.string().trim().max(3000),
  personalId: z.string().trim().regex(/^(\d{11})?$/),
  address: z.string().trim().max(300),
});
export const registrationSchema = patientFields.extend({
  email: patientFields.shape.email.default(""), notes: patientFields.shape.notes.default(""), personalId: patientFields.shape.personalId.default(""), address: patientFields.shape.address.default(""),
  phone: z.string().transform(v => v.replace(/\D/g, "")).pipe(z.string().regex(/^\d{9,15}$/)),
});
export const centerDefaults = {
  name: 'შპს სამკურნალო ფიზკულტურისა და რეაბილიტაციის ცენტრი „Reha საჩხერე“',
  taxId: "439428914", address: "საჩხერე, გომართელის ქუჩა N10",
  bank: 'სს „საქართველოს ბანკი“', bankCode: "BAGAGE22", account: "GE33BG0000000612374796",
  director: "ნინო კირვალიძე",
};
const text = z.string().trim().min(1).max(300);
export const invoiceSchema = z.object({
  number: z.string().trim().min(1).max(40),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => { const d = new Date(v); return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v; }),
  center: z.object({ name: text, taxId: text, address: text, bank: text, bankCode: text, account: text, director: text }),
  items: z.array(z.object({
    description: text,
    unitPrice: z.number().finite().min(0).max(1000000).refine(v => Math.abs(v * 100 - Math.round(v * 100)) < 0.000001),
    quantity: z.number().int().min(1).max(10000),
  })).min(1).max(100),
});
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export function lineTotal(item: InvoiceInput["items"][number]) { return Math.round(item.unitPrice * 100) * item.quantity; }
export function invoiceTotal(items: InvoiceInput["items"]) { return items.reduce((total, item) => total + lineTotal(item), 0); }
export function money(cents: number) { return (cents / 100).toFixed(2); }
