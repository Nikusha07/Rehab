import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { adminCookie, hasAdminPermission, verifyAdminToken } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { dbConnect } from "@/lib/db";
import { getAvailability } from "@/lib/availability";
import { SITE } from "@/lib/config";
import { sendBookingSms } from "@/lib/sms";
import { slotKeys, timeToMinutes } from "@/lib/time";
import Booking from "@/models/Booking";
import Patient from "@/models/Patient";
import Service from "@/models/Service";
import Specialist from "@/models/Specialist";
import SlotLock from "@/models/SlotLock";
import SmsLog from "@/models/SmsLog";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  patientId: z.string().refine((v) => mongoose.isValidObjectId(v)).optional(),
  patientName: z.string().trim().min(2).max(120),
  patientPhone: z.string().transform((v) => v.replace(/\D/g, "")).refine((v) => /^5\d{8}$/.test(v)),
  serviceId: z.string().refine((v) => mongoose.isValidObjectId(v)),
  specialistId: z.string().refine((v) => mongoose.isValidObjectId(v)),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  notes: z.string().trim().max(1000).optional().default(""),
});
class SelectedPatientChanged extends Error {}

function confirmationCode() { return randomBytes(5).toString("hex").slice(0, 8).toUpperCase(); }

export async function GET(request: NextRequest) {
  const auth = await verifyAdminToken(request.cookies.get(adminCookie)?.value);
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });
  if (!hasAdminPermission(auth, "bookings.read")) return NextResponse.json({ ok: false }, { status: 403 });
  try {
    await dbConnect();
    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");
    const status = request.nextUrl.searchParams.get("status");
    const filter: Record<string, unknown> = {};
    if (from || to) filter.date = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
    if (status && ["confirmed","completed","cancelled","no_show"].includes(status)) filter.status = status;
    const items = await Booking.find(filter).sort({ date: -1, time: -1 }).limit(from || to ? 1000 : 500)
      .populate({ path: "serviceId", select: "name durationMinutes price", model: Service })
      .populate({ path: "specialistId", select: "name title", model: Specialist }).lean();
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("Admin bookings load failed:", error);
    return NextResponse.json({ ok: false, error: "Failed to load bookings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminToken(request.cookies.get(adminCookie)?.value);
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });
  if (!hasAdminPermission(auth, "bookings.write")) return NextResponse.json({ ok: false, message: "ამ როლს ჯავშნის შექმნის უფლება არ აქვს." }, { status: 403 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "შეამოწმეთ შევსებული ინფორმაცია." }, { status: 400 });
  await dbConnect();
  const { patientId, patientName, patientPhone, serviceId, specialistId, date, time, notes } = parsed.data;
  const [service, specialist] = await Promise.all([Service.findOne({ _id: serviceId, isActive: true }).lean(), Specialist.findOne({ _id: specialistId, isActive: true }).lean()]);
  if (!service || !specialist) return NextResponse.json({ ok: false, message: "მომსახურება ან სპეციალისტი მიუწვდომელია." }, { status: 404 });
  const durationMinutes = parsed.data.endTime ? timeToMinutes(parsed.data.endTime) - timeToMinutes(time) : service.durationMinutes;
  if (durationMinutes <= 0) return NextResponse.json({ ok: false, message: "დასრულების დრო დაწყების შემდეგ უნდა იყოს." }, { status: 400 });
  const availability = await getAvailability(date, specialistId, durationMinutes, undefined, time);
  const selected = availability.slots?.find((slot: { time: string; available: boolean }) => slot.time === time);
  if (!availability.ok || !selected?.available) return NextResponse.json({ ok: false, message: "ეს დრო უკვე დაკავებულია ან მიუწვდომელია." }, { status: 409 });
  const session = await mongoose.startSession(); let booking: any; const code = confirmationCode();
  try {
    await session.withTransaction(async () => {
      const patient = patientId
        ? await Patient.findOne({ _id: patientId, name: patientName, phone: patientPhone }).session(session)
        : await Patient.findOneAndUpdate({ phone: patientPhone }, { $set: { name: patientName } }, { upsert: true, new: true, session, setDefaultsOnInsert: true });
      if (!patient) throw new SelectedPatientChanged();
      const created = await Booking.create([{ patientId: patient._id, patientName, patientPhone, serviceId, specialistId, date, time, durationMinutes, notes, confirmationCode: code, source: "admin" }], { session });
      booking = created[0];
      const keys = slotKeys(specialistId, date, time, durationMinutes, SITE.lockMinutes);
      await SlotLock.insertMany(keys.map((key) => ({ key, bookingId: booking._id, specialistId, date, time: key.split("|").at(-1) })), { session, ordered: true });
    });
  } catch (error: any) {
    if (error instanceof SelectedPatientChanged) return NextResponse.json({ ok: false, message: "პაციენტის მონაცემები შეიცვალა. მოძებნეთ და აირჩიეთ პაციენტი ხელახლა." }, { status: 409 });
    if (error?.code === 11000) return NextResponse.json({ ok: false, message: "ეს დრო უკვე სხვამ დაიკავა." }, { status: 409 });
    console.error("admin booking create failed", error); return NextResponse.json({ ok: false, message: "ჯავშნის შექმნა ვერ მოხერხდა." }, { status: 500 });
  } finally { await session.endSession(); }
  await writeAudit({ actor: String(auth.username || "admin"), action: "booking.create", entity: "booking", entityId: String(booking._id), summary: `ხელით შეიქმნა ჯავშანი: ${patientName}, ${date} ${time}`, metadata: { patientPhone, serviceId, specialistId, date, time } });
  const text = `${SITE.name}: თქვენი ვიზიტი დაჯავშნილია ${date}, ${time} საათზე. კოდი: ${code}.`;
  try { const sms = await sendBookingSms(patientPhone, text); await SmsLog.create({ bookingId: booking._id, phone: patientPhone, message: text, status: sms.success ? "sent" : ("skipped" in sms && sms.skipped ? "skipped" : "failed"), payload: sms }); } catch (error) { console.error("admin booking sms failed", error); }
  return NextResponse.json({ ok: true, item: booking, confirmationCode: code }, { status: 201 });
}
