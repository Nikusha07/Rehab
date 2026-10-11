import { SITE } from "@/lib/config";
import { addDays, minutesToTime, nowInTbilisi, timeToMinutes, weekdayOf } from "@/lib/time";
import BlockedDate from "@/models/BlockedDate";
import SlotLock from "@/models/SlotLock";
import Booking from "@/models/Booking";
import Specialist from "@/models/Specialist";
import WorkingHours from "@/models/WorkingHours";

export async function getAvailability(date: string, specialistId: string, durationMinutes: number, ignoreBookingId?: string) {
  const now = nowInTbilisi();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < now.date || date > addDays(now.date, SITE.bookingDaysAhead)) {
    return { ok: false, message: "ამ თარიღზე ჩაწერა შეუძლებელია.", slots: [] };
  }

  const specialist = await Specialist.findOne({ _id: specialistId, isActive: true }).lean();
  if (!specialist) return { ok: false, message: "სპეციალისტი ვერ მოიძებნა.", slots: [] };

  const blocked = await BlockedDate.findOne({ date, $or: [{ specialistId: null }, { specialistId }] }).lean();
  if (blocked) return { ok: true, blocked: true, message: blocked.title || "ამ დღეს ჩაწერა შეზღუდულია.", slots: [] };

  const weekday = weekdayOf(date);
  let wh: any = await WorkingHours.findOne({ specialistId, weekday }).lean();
  if (wh && Number(wh.scheduleVersion || 0) < 1) {
    await WorkingHours.updateOne(
      { _id: wh._id },
      { $set: { openTime: "09:00", closeTime: "18:00", scheduleVersion: 1 } }
    ).catch(() => undefined);
    wh = { ...wh, openTime: "09:00", closeTime: "18:00", scheduleVersion: 1 };
  }
  const schedule = wh || { openTime: "09:00", closeTime: "18:00", isDayOff: weekday === 0 };
  if (schedule.isDayOff) return { ok: true, blocked: true, message: "ამ დღეს სპეციალისტს სამუშაო დღე არ აქვს.", slots: [] };

  const lockFilter: Record<string, unknown> = { specialistId, date };
  if (ignoreBookingId) lockFilter.bookingId = { $ne: ignoreBookingId };

  const bookingFilter: Record<string, unknown> = { specialistId, date, status: "confirmed" };
  if (ignoreBookingId) bookingFilter._id = { $ne: ignoreBookingId };

  const [locks, bookings] = await Promise.all([
    SlotLock.find(lockFilter).select("time -_id").lean(),
    Booking.find(bookingFilter).select("time durationMinutes -_id").lean(),
  ]);

  const lockedTimes = new Set(locks.map((x) => x.time));
  const start = timeToMinutes(schedule.openTime);
  const end = timeToMinutes(schedule.closeTime);
  const slots: { time: string; available: boolean; reason?: string }[] = [];

  for (let minute = start; minute + durationMinutes <= end; minute += SITE.slotMinutes) {
    const time = minutesToTime(minute);
    const past = date === now.date && time <= now.time;
    const candidateEnd = minute + durationMinutes;

    const overlapsBooking = bookings.some((booking: any) => {
      const bookedStart = timeToMinutes(booking.time);
      const bookedEnd = bookedStart + Number(booking.durationMinutes || 0);
      return minute < bookedEnd && candidateEnd > bookedStart;
    });

    const blocks = Math.ceil(durationMinutes / SITE.lockMinutes);
    let lockCollision = false;
    for (let i = 0; i < blocks; i++) {
      if (lockedTimes.has(minutesToTime(minute + i * SITE.lockMinutes))) {
        lockCollision = true;
        break;
      }
    }

    const collision = overlapsBooking || lockCollision;
    slots.push({ time, available: !past && !collision, reason: past ? "წარსული დრო" : collision ? "დაკავებულია" : undefined });
  }

  return { ok: true, blocked: false, slots, availableCount: slots.filter((x) => x.available).length };
}
