import { NextResponse } from "next/server";
import { adminCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookie, "", { httpOnly: true, expires: new Date(0), path: "/" });
  return response;
}
