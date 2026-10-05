import { NextRequest, NextResponse } from "next/server";
import { adminCookie, hasAdminPermission, verifyAdminToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import AuditLog from "@/models/AuditLog";
import BlockedDate from "@/models/BlockedDate";
import Booking from "@/models/Booking";
import Patient from "@/models/Patient";
import Service from "@/models/Service";
import SiteSetting from "@/models/SiteSetting";
import SmsLog from "@/models/SmsLog";
import Specialist from "@/models/Specialist";
import WorkingHours from "@/models/WorkingHours";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminToken(request.cookies.get(adminCookie)?.value);
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });
  if (!hasAdminPermission(auth, "backup.read")) return NextResponse.json({ ok: false }, { status: 403 });
  await dbConnect();
  const [bookings, patients, services, specialists, workingHours, blockedDates, settings, smsLogs, auditLogs] = await Promise.all([
    Booking.find({}).lean(), Patient.find({}).lean(), Service.find({}).lean(), Specialist.find({}).lean(), WorkingHours.find({}).lean(), BlockedDate.find({}).lean(), SiteSetting.find({}).lean(), SmsLog.find({}).sort({ createdAt: -1 }).limit(5000).lean(), AuditLog.find({}).sort({ createdAt: -1 }).limit(5000).lean(),
  ]);
  const payload = { exportedAt: new Date().toISOString(), version: 1, bookings, patients, services, specialists, workingHours, blockedDates, settings, smsLogs, auditLogs };
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="rehab-backup-${stamp}.json"`, "Cache-Control": "no-store" } });
}
