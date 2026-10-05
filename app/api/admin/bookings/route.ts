import { NextRequest, NextResponse } from "next/server";
import { adminCookie, verifyAdminToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import Booking from "@/models/Booking";
import Service from "@/models/Service";
import Specialist from "@/models/Specialist";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminToken(request.cookies.get(adminCookie)?.value);
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    await dbConnect();

    const items = await Booking.find({})
      .sort({ date: -1, time: -1 })
      .limit(250)
      .populate({ path: "serviceId", select: "name", model: Service })
      .populate({ path: "specialistId", select: "name title", model: Specialist })
      .lean();

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("Admin bookings load failed:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load bookings" },
      { status: 500 }
    );
  }
}
