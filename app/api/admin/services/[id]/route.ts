import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { adminCookie, verifyAdminToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import Service from "@/models/Service";
import Booking from "@/models/Booking";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  durationMinutes: z.coerce.number().int().min(30).max(240).optional(),
  price: z.union([z.coerce.number().min(0), z.null()]).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

async function auth(request: NextRequest) {
  return verifyAdminToken(request.cookies.get(adminCookie)?.value);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await auth(request))) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ ok: false }, { status: 400 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "არასწორი მონაცემებია." }, { status: 400 });
  await dbConnect();
  const item = await Service.findByIdAndUpdate(id, parsed.data, { new: true, runValidators: true });
  if (!item) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await auth(request))) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ ok: false }, { status: 400 });
  await dbConnect();
  const used = await Booking.exists({ serviceId: id });
  if (used) {
    const item = await Service.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!item) return NextResponse.json({ ok: false }, { status: 404 });
    return NextResponse.json({ ok: true, softDeleted: true, item });
  }
  const item = await Service.findByIdAndDelete(id);
  if (!item) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, softDeleted: false });
}
