import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { sendBookingSms } from "@/lib/sms";
import { addDays, nowInTbilisi } from "@/lib/time";
import Booking from "@/models/Booking";
import SmsLog from "@/models/SmsLog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const tomorrow = addDays(nowInTbilisi().date, 1);
  const bookings = await Booking.find({
    date: tomorrow,
    status: "confirmed",
    reminderSentAt: null,
  })
    .sort({ time: 1 })
    .limit(250);

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const booking of bookings) {
    const text = `რეაბილიტაციის ცენტრი: შეგახსენებთ, რომ ხვალ ${booking.date} ${booking.time}-ზე გაქვთ ვიზიტი. კოდი: ${booking.confirmationCode}.`;

    try {
      const sms = await sendBookingSms(booking.patientPhone, text);
      const status = sms.success ? "sent" : ("skipped" in sms && sms.skipped ? "skipped" : "failed");

      await SmsLog.create({
        bookingId: booking._id,
        phone: booking.patientPhone,
        message: text,
        status,
        payload: { ...sms, kind: "reminder", reminderDate: tomorrow },
      });

      if (sms.success) {
        booking.reminderSentAt = new Date();
        booking.reminderLastError = "";
        await booking.save();
        sent += 1;
      } else if (status === "skipped") {
        skipped += 1;
      } else {
        booking.reminderLastError = "SMS sending failed";
        await booking.save();
        failed += 1;
      }
    } catch (error) {
      booking.reminderLastError = error instanceof Error ? error.message : "Reminder failed";
      await booking.save().catch(() => undefined);
      await SmsLog.create({
        bookingId: booking._id,
        phone: booking.patientPhone,
        message: text,
        status: "failed",
        payload: { kind: "reminder", reminderDate: tomorrow, error: booking.reminderLastError },
      }).catch(() => undefined);
      failed += 1;
    }
  }

  return NextResponse.json({ ok: true, date: tomorrow, total: bookings.length, sent, failed, skipped });
}
