import { NextRequest, NextResponse } from "next/server";
import { adminCookie, hasAdminPermission, verifyAdminToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import AuditLog from "@/models/AuditLog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminToken(request.cookies.get(adminCookie)?.value);
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });
  if (!hasAdminPermission(auth, "audit.read")) return NextResponse.json({ ok: false }, { status: 403 });
  await dbConnect();
  const items = await AuditLog.find({}).sort({ createdAt: -1 }).limit(300).lean();
  return NextResponse.json({ ok: true, items });
}
