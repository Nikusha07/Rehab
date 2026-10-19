import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { adminCookie, hasAdminPermission, verifyAdminToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { invoiceSchema, invoiceTotal } from "@/lib/invoice";
import Patient from "@/models/Patient";
import Invoice from "@/models/Invoice";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
async function access(request: NextRequest, context: Context, write = false) {
  const auth = await verifyAdminToken(request.cookies.get(adminCookie)?.value);
  if (!auth) return { error: NextResponse.json({ ok: false }, { status: 401 }) };
  if (!hasAdminPermission(auth, write ? "patients.write" : "patients.read")) return { error: NextResponse.json({ ok: false }, { status: 403 }) };
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) return { error: NextResponse.json({ ok: false }, { status: 400 }) };
  return { id, auth };
}
export async function GET(request: NextRequest, context: Context) {
  const a = await access(request, context); if (a.error) return a.error;
  try {
    await dbConnect();
    const items = await Invoice.find({ patientId: a.id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ ok: true, items }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ ok: false, message: "ანგარიშების ჩატვირთვა ვერ მოხერხდა." }, { status: 500 }); }
}
async function save(request: NextRequest, context: Context, update: boolean) {
  const a = await access(request, context, true); if (a.error) return a.error;
  const body = await request.json().catch(() => null);
  const parsed = invoiceSchema.safeParse(body);
  if (!parsed.success || (update && (!mongoose.isValidObjectId(body?._id) || !Number.isInteger(body?.revision))))
    return NextResponse.json({ ok: false, message: "შეავსეთ ყველა ველი. ფასი უნდა იყოს არაუარყოფითი (მაქს. 2 ათწილადი), რაოდენობა — დადებითი მთელი რიცხვი." }, { status: 400 });
  try {
    await dbConnect();
    await Invoice.init();
    const patient = await Patient.findById(a.id).lean();
    if (!patient) return NextResponse.json({ ok: false }, { status: 404 });
    const data = { ...parsed.data, totalCents: invoiceTotal(parsed.data.items) };
    // A saved invoice keeps the patient's original details for reproducible reprints.
    const invoice = update
      ? await Invoice.findOneAndUpdate({ _id: body._id, patientId: a.id, revision: body.revision }, { $set: data, $inc: { revision: 1 } }, { new: true, runValidators: true })
      : await Invoice.create({ ...data, patientId: a.id, patient: { name: patient.name, personalId: patient.personalId || "", phone: patient.phone, address: patient.address || "" } });
    if (!invoice) return NextResponse.json({ ok: false, message: "ანგარიში სხვა ფანჯარაში შეიცვალა. ხელახლა გახსენით და გაიმეორეთ ცვლილება." }, { status: 409 });
    await writeAudit({ actor: String(a.auth?.username || "admin"), action: update ? "invoice.update" : "invoice.create", entity: "invoice", entityId: String(invoice._id), summary: `ანგარიშ-ფაქტურა ${invoice.number}` });
    return NextResponse.json({ ok: true, invoice }, { status: update ? 200 : 201 });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return NextResponse.json({ ok: false, message: "ამ ნომრით ანგარიში უკვე არსებობს. მიუთითეთ სხვა ნომერი." }, { status: 409 });
    return NextResponse.json({ ok: false, message: "ანგარიშის შენახვა ვერ მოხერხდა." }, { status: 500 });
  }
}
export async function POST(request: NextRequest, context: Context) { return save(request, context, false); }
export async function PATCH(request: NextRequest, context: Context) { return save(request, context, true); }
