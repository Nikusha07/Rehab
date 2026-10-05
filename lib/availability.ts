import { SITE } from "@/lib/config";
import { addDays, minutesToTime, nowInTbilisi, timeToMinutes, weekdayOf } from "@/lib/time";
import BlockedDate from "@/models/BlockedDate";
import SlotLock from "@/models/SlotLock";
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
  const wh = await WorkingHours.findOne({ specialistId, weekday }).lean();
  const schedule = wh || { openTime: "10:00", closeTime: "18:00", isDayOff: weekday === 0 };
  if (schedule.isDayOff) return { ok: true, blocked: true, message: "ამ დღეს სპეციალისტს სამუშაო დღე არ აქვს.", slots: [] };

  const lockFilter: Record<string, unknown> = { specialistId, date };
  if (ignoreBookingId) lockFilter.bookingId = { $ne: ignoreBookingId };
  const locks = await SlotLock.find(lockFilter).select("time -_id").lean();
  const lockedTimes = new Set(locks.map((x) => x.time));
  const start = timeToMinutes(schedule.openTime);
  const end = timeToMinutes(schedule.closeTime);
  const slots: { time: string; available: boolean; reason?: string }[] = [];

  for (let minute = start; minute + durationMinutes <= end; minute += SITE.slotMinutes) {
    const time = minutesToTime(minute);
    const past = date === now.date && time <= now.time;
    const blocks = Math.ceil(durationMinutes / SITE.slotMinutes);
    let collision = false;
    for (let i = 0; i < blocks; i++) {
      if (lockedTimes.has(minutesToTime(minute + i * SITE.slotMinutes))) collision = true;
    }
    slots.push({ time, available: !past && !collision, reason: past ? "წარსული დრო" : collision ? "დაკავებულია" : undefined });
  }

  return { ok: true, blocked: false, slots, availableCount: slots.filter((x) => x.available).length };
}
