import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { adminCookie, verifyAdminToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import Booking from "@/models/Booking";
import SlotLock from "@/models/SlotLock";

const bodySchema = z.object({ status: z.enum(["cancelled", "completed", "no_show"]) });

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminToken(request.cookies.get(adminCookie)?.value);
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ ok: false }, { status: 400 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  await dbConnect();
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const booking = await Booking.findById(id).session(session);
      if (!booking) throw new Error("NOT_FOUND");
      booking.status = parsed.data.status;
      await booking.save({ session });
      if (parsed.data.status === "cancelled") await SlotLock.deleteMany({ bookingId: booking._id }).session(session);
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") return NextResponse.json({ ok: false }, { status: 404 });
    return NextResponse.json({ ok: false, message: "განახლება ვერ მოხერხდა." }, { status: 500 });
  } finally {
    await session.endSession();
  }
  return NextResponse.json({ ok: true });
}
