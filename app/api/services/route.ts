import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Service from "@/models/Service";

export const dynamic = "force-dynamic";

export async function GET() {
  await dbConnect();
  const items = await Service.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  return NextResponse.json({ items });
}
