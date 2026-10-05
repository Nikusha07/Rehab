import { NextRequest, NextResponse } from "next/server";
import { adminCookie, verifyAdminToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminToken(request.cookies.get(adminCookie)?.value);
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, username: String(auth.username || "admin"), role: String(auth.accessRole || "owner") });
}
