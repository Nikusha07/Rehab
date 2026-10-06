import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { getAvailability } from "@/lib/availability";
import { SITE } from "@/lib/config";
import { hashPhoneVerificationToken } from "@/lib/phone-verification";
import { sendBookingSms } from "@/lib/sms";
import { slotKeys } from "@/lib/time";
import Booking from "@/models/Booking";
import Patient from "@/models/Patient";
import PhoneVerification from "@/models/PhoneVerification";
import Service from "@/models/Service";
import SlotLock from "@/models/SlotLock";
import SmsLog from "@/models/SmsLog";
import Specialist from "@/models/Specialist";

const schema = z.object({
  patientName: z.string().trim().min(2).max(120),
  patientPhone: z.string().transform((v) => v.replace(/\D/g, "")).refine((v) => /^5\d{8}$/.test(v), "არასწორი ტელეფონის ნომერი"),
  phoneVerificationToken: z.string().trim().min(40).max(256),
  serviceId: z.string().refine((v) => mongoose.isValidObjectId(v)),
  specialistId: z.string().refine((v) => mongoose.isValidObjectId(v)),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().trim().max(1000).optional().default(""),
  website: z.string().optional().default(""),
});

function code() {
  return randomBytes(5).toString("hex").slice(0, 8).toUpperCase();
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "შეამოწმეთ შევსებული ინფორმაცია." }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: false, message: "მოთხოვნა უარყოფილია." }, { status: 400 });

  await dbConnect();
  const { patientName, patientPhone, phoneVerificationToken, serviceId, specialistId, date, time, notes } = parsed.data;
  const [service, specialist] = await Promise.all([
    Service.findOne({ _id: serviceId, isActive: true }).lean(),
    Specialist.findOne({ _id: specialistId, isActive: true }).lean(),
  ]);
  if (!service || !specialist) return NextResponse.json({ ok: false, message: "არჩეული მომსახურება ან სპეციალისტი აღარ არის ხელმისაწვდომი." }, { status: 404 });

  const availability = await getAvailability(date, specialistId, service.durationMinutes);
  const selected = availability.slots?.find((slot: { time: string; available: boolean }) => slot.time === time);
  if (!availability.ok || !selected?.available) {
    return NextResponse.json({ ok: false, message: "ეს დრო უკვე დაკავებულია ან მიუწვდომელია." }, { status: 409 });
  }

  const session = await mongoose.startSession();
  let booking: any;
  const confirmationCode = code();
  try {
    await session.withTransaction(async () => {
      const tokenHash = hashPhoneVerificationToken(patientPhone, phoneVerificationToken);
      const verification = await PhoneVerification.findOneAndUpdate(
        {
          phone: patientPhone,
          tokenHash,
          verifiedAt: { $ne: null },
          tokenExpiresAt: { $gt: new Date() },
          consumedAt: null,
        },
        { $set: { consumedAt: new Date() } },
        { new: true, session }
      );
      if (!verification) throw new Error("PHONE_NOT_VERIFIED");

      const patient = await Patient.findOneAndUpdate(
        { phone: patientPhone },
        { $set: { name: patientName } },
        { upsert: true, new: true, session, setDefaultsOnInsert: true }
      );
      const created = await Booking.create(
        [{
          patientId: patient._id,
          patientName,
          patientPhone,
          serviceId,
          specialistId,
          date,
          time,
          durationMinutes: service.durationMinutes,
          notes,
          confirmationCode,
        }],
        { session }
      );
      booking = created[0];
      const keys = slotKeys(specialistId, date, time, service.durationMinutes, SITE.slotMinutes);
      await SlotLock.insertMany(
        keys.map((key) => ({ key, bookingId: booking._id, specialistId, date, time: key.split("|").at(-1) })),
        { session, ordered: true }
      );
    });
  } catch (error: any) {
    if (error instanceof Error && error.message === "PHONE_NOT_VERIFIED") {
      return NextResponse.json({ ok: false, message: "ტელეფონის ნომერი თავიდან დაადასტურეთ SMS კოდით." }, { status: 403 });
    }
    if (error?.code === 11000) return NextResponse.json({ ok: false, message: "ეს დრო ამ წამს უკვე სხვამ დაჯავშნა. აირჩიეთ სხვა დრო." }, { status: 409 });
    console.error("booking transaction failed", error);
    return NextResponse.json({ ok: false, message: "ჩაწერა ვერ შესრულდა. სცადეთ ხელახლა." }, { status: 500 });
  } finally {
    await session.endSession();
  }

  const text = `${SITE.name}: ვიზიტი დადასტურებულია. ${service.name}, ${specialist.name}, ${date} ${time}. ჯავშნის კოდი: ${confirmationCode}.`;
  try {
    const sms = await sendBookingSms(patientPhone, text);
    await SmsLog.create({ bookingId: booking._id, phone: patientPhone, message: text, status: sms.success ? "sent" : ("skipped" in sms && sms.skipped ? "skipped" : "failed"), payload: { ...sms, kind: "booking_confirmation" } });
  } catch (smsError) {
    console.error("SMS/logging failed after booking", smsError);
  }

  return NextResponse.json({ ok: true, confirmationCode, date, time, service: service.name, specialist: specialist.name }, { status: 201 });
}
