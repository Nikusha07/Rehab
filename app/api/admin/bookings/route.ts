import { NextRequest, NextResponse } from "next/server";
import { adminCookie, verifyAdminToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import Booking from "@/models/Booking";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminToken(request.cookies.get(adminCookie)?.value);
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });
  await dbConnect();
  const items = await Booking.find({})
    .sort({ date: -1, time: -1 })
    .limit(250)
    .populate("serviceId", "name")
    .populate("specialistId", "name title")
    .lean();
  return NextResponse.json({ ok: true, items });
}
