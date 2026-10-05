import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { getAvailability } from "@/lib/availability";
import Service from "@/models/Service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || "";
  const specialistId = searchParams.get("specialistId") || "";
  const serviceId = searchParams.get("serviceId") || "";
  if (!mongoose.isValidObjectId(specialistId) || !mongoose.isValidObjectId(serviceId)) {
    return NextResponse.json({ ok: false, message: "მონაცემები არასწორია.", slots: [] }, { status: 400 });
  }
  await dbConnect();
  const service = await Service.findOne({ _id: serviceId, isActive: true }).lean();
  if (!service) return NextResponse.json({ ok: false, message: "მომსახურება ვერ მოიძებნა.", slots: [] }, { status: 404 });
  const result = await getAvailability(date, specialistId, service.durationMinutes);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
