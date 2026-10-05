import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";

const COOKIE = "rehab_admin";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-only-change-me-dev-only-change-me");

export async function createAdminToken(username: string) {
  return new SignJWT({ role: "admin", username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);
}

export async function verifyAdminToken(token?: string | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.role === "admin" ? payload : null;
  } catch {
    return null;
  }
}

export async function requireAdminPage() {
  const store = await cookies();
  const payload = await verifyAdminToken(store.get(COOKIE)?.value);
  if (!payload) redirect("/admin/login");
  return payload;
}

export async function isValidAdminCredentials(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD || "";
  if (!expectedPass) return false;
  const safeEq = (a: string, b: string) => {
    const aa = Buffer.from(a);
    const bb = Buffer.from(b);
    return aa.length === bb.length && timingSafeEqual(aa, bb);
  };
  return safeEq(username, expectedUser) && safeEq(password, expectedPass);
}

export const adminCookie = COOKIE;
