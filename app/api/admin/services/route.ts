import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminCookie, verifyAdminToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import Service from "@/models/Service";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional().default(""),
  durationMinutes: z.coerce.number().int().min(30).max(240).default(30),
  price: z.union([z.coerce.number().min(0), z.null()]).optional().default(null),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
});

async function authorized(request: NextRequest) {
  return verifyAdminToken(request.cookies.get(adminCookie)?.value);
}

export async function GET(request: NextRequest) {
  if (!(await authorized(request))) return NextResponse.json({ ok: false }, { status: 401 });
  await dbConnect();
  const items = await Service.find({}).sort({ sortOrder: 1, name: 1 }).lean();
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: NextRequest) {
  if (!(await authorized(request))) return NextResponse.json({ ok: false }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "შეამოწმეთ შევსებული მონაცემები." }, { status: 400 });
  await dbConnect();
  const item = await Service.create(parsed.data);
  return NextResponse.json({ ok: true, item }, { status: 201 });
}
