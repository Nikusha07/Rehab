import { NextRequest, NextResponse } from "next/server";
import { adminCookie, createAdminToken, isValidAdminCredentials } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const username = String(body.username || "");
  const password = String(body.password || "");
  if (!(await isValidAdminCredentials(username, password))) {
    return NextResponse.json({ ok: false, message: "მომხმარებელი ან პაროლი არასწორია." }, { status: 401 });
  }
  const token = await createAdminToken(username);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/",
  });
  return response;
}
