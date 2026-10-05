import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { adminCookie, hasAdminPermission, verifyAdminToken } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { dbConnect } from "@/lib/db";
import { getAvailability } from "@/lib/availability";
import { SITE } from "@/lib/config";
import { sendBookingSms } from "@/lib/sms";
import { slotKeys } from "@/lib/time";
import Booking from "@/models/Booking";
import Patient from "@/models/Patient";
import Service from "@/models/Service";
import Specialist from "@/models/Specialist";
import SlotLock from "@/models/SlotLock";
import SmsLog from "@/models/SmsLog";

const bodySchema = z.object({
  status: z.enum(["confirmed", "cancelled", "completed", "no_show"]).optional(),
  patientName: z.string().trim().min(2).max(120).optional(),
  patientPhone: z.string().transform((v) => v.replace(/\D/g, "")).refine((v) => /^5\d{8}$/.test(v)).optional(),
  serviceId: z.string().refine((v) => mongoose.isValidObjectId(v)).optional(),
  specialistId: z.string().refine((v) => mongoose.isValidObjectId(v)).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  notes: z.string().trim().max(1000).optional(),
}).refine((value) => Object.keys(value).length > 0);

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminToken(request.cookies.get(adminCookie)?.value);
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });
  if (!hasAdminPermission(auth, "bookings.write")) return NextResponse.json({ ok: false, message: "ამ როლს ჯავშნის შეცვლის უფლება არ აქვს." }, { status: 403 });
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ ok: false }, { status: 400 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "შეამოწმეთ მონაცემები." }, { status: 400 });
  await dbConnect();
  const existing = await Booking.findById(id).lean();
  if (!existing) return NextResponse.json({ ok: false }, { status: 404 });
  const nextStatus = parsed.data.status || existing.status;
  const patientName = parsed.data.patientName ?? existing.patientName;
  const patientPhone = parsed.data.patientPhone ?? existing.patientPhone;
  const serviceId = parsed.data.serviceId ?? String(existing.serviceId);
  const specialistId = parsed.data.specialistId ?? String(existing.specialistId);
  const date = parsed.data.date ?? existing.date;
  const time = parsed.data.time ?? existing.time;
  const notes = parsed.data.notes ?? existing.notes ?? "";
  const scheduleChanged = serviceId !== String(existing.serviceId) || specialistId !== String(existing.specialistId) || date !== existing.date || time !== existing.time;
  const [service, specialist] = await Promise.all([Service.findById(serviceId).lean(), Specialist.findById(specialistId).lean()]);
  if (!service || !specialist) return NextResponse.json({ ok: false, message: "სერვისი ან სპეციალისტი ვერ მოიძებნა." }, { status: 404 });
  if (nextStatus === "confirmed" && (scheduleChanged || existing.status !== "confirmed")) {
    const availability = await getAvailability(date, specialistId, service.durationMinutes, id);
    const selected = availability.slots?.find((slot: { time: string; available: boolean }) => slot.time === time);
    if (!availability.ok || !selected?.available) return NextResponse.json({ ok: false, message: availability.message || "არჩეული დრო მიუწვდომელია." }, { status: 409 });
  }
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const booking = await Booking.findById(id).session(session); if (!booking) throw new Error("NOT_FOUND");
      const patient = await Patient.findOneAndUpdate({ phone: patientPhone }, { $set: { name: patientName } }, { upsert: true, new: true, session, setDefaultsOnInsert: true });
      const mustRebuildLocks = scheduleChanged || booking.status !== nextStatus;
      if (mustRebuildLocks) await SlotLock.deleteMany({ bookingId: booking._id }).session(session);
      if (nextStatus === "confirmed" && mustRebuildLocks) {
        const keys = slotKeys(specialistId, date, time, service.durationMinutes, SITE.slotMinutes);
        await SlotLock.insertMany(keys.map((key) => ({ key, bookingId: booking._id, specialistId, date, time: key.split("|").at(-1) })), { session, ordered: true });
      }
      booking.patientId = patient._id; booking.patientName = patientName; booking.patientPhone = patientPhone; booking.serviceId = serviceId; booking.specialistId = specialistId; booking.date = date; booking.time = time; booking.durationMinutes = service.durationMinutes; booking.notes = notes; booking.status = nextStatus;
      await booking.save({ session });
    });
  } catch (error: any) {
    if (error?.code === 11000) return NextResponse.json({ ok: false, message: "ეს დრო უკვე დაკავებულია." }, { status: 409 });
    if (error instanceof Error && error.message === "NOT_FOUND") return NextResponse.json({ ok: false }, { status: 404 });
    console.error("booking update failed", error); return NextResponse.json({ ok: false, message: "განახლება ვერ მოხერხდა." }, { status: 500 });
  } finally { await session.endSession(); }
  const actor = String(auth.username || "admin");
  await writeAudit({ actor, action: scheduleChanged ? "booking.edit" : `booking.status.${nextStatus}`, entity: "booking", entityId: id, summary: scheduleChanged ? `ჯავშანი შეიცვალა: ${patientName}, ${date} ${time}` : `ჯავშნის სტატუსი შეიცვალა: ${patientName} → ${nextStatus}`, metadata: { previous: { date: existing.date, time: existing.time, status: existing.status }, next: { date, time, status: nextStatus } } });
  let smsText = "";
  if (nextStatus === "cancelled" && existing.status !== "cancelled") smsText = `${SITE.name}: თქვენი ${date} ${time}-ზე დაგეგმილი ვიზიტი გაუქმებულია.`;
  else if (scheduleChanged && nextStatus === "confirmed") smsText = `${SITE.name}: თქვენი ვიზიტი განახლდა — ${date}, ${time}. კოდი: ${existing.confirmationCode}.`;
  if (smsText) { try { const sms = await sendBookingSms(patientPhone, smsText); await SmsLog.create({ bookingId: id, phone: patientPhone, message: smsText, status: sms.success ? "sent" : ("skipped" in sms && sms.skipped ? "skipped" : "failed"), payload: sms }); } catch (error) { console.error("booking update sms failed", error); } }
  const item = await Booking.findById(id).populate({ path: "serviceId", select: "name durationMinutes price", model: Service }).populate({ path: "specialistId", select: "name title", model: Specialist }).lean();
  return NextResponse.json({ ok: true, item });
}
