import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Specialist from "@/models/Specialist";

export const dynamic = "force-dynamic";

export async function GET() {
  await dbConnect();
  const items = await Specialist.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  return NextResponse.json({ items });
}
