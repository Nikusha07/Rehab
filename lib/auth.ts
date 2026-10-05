import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { dbConnect } from "@/lib/db";
import AdminUser from "@/models/AdminUser";

const COOKIE = "rehab_admin";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-only-change-me-dev-only-change-me");

export type AdminAccessRole = "owner" | "reception" | "doctor";
export type AdminPermission = "bookings.read" | "bookings.write" | "patients.read" | "patients.write" | "analytics.read" | "sms.read" | "settings.write" | "catalog.write" | "users.write" | "audit.read" | "backup.read";

const permissions: Record<AdminAccessRole, AdminPermission[]> = {
  owner: ["bookings.read","bookings.write","patients.read","patients.write","analytics.read","sms.read","settings.write","catalog.write","users.write","audit.read","backup.read"],
  reception: ["bookings.read","bookings.write","patients.read","patients.write","analytics.read","sms.read"],
  doctor: ["bookings.read","patients.read","analytics.read"],
};

export function hasAdminPermission(payload: any, permission: AdminPermission) {
  const role = (payload?.accessRole || "owner") as AdminAccessRole;
  return permissions[role]?.includes(permission) ?? false;
}

export function hashAdminPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const passwordHash = scryptSync(password, salt, 64).toString("hex");
  return { salt, passwordHash };
}

export function verifyAdminPassword(password: string, salt: string, storedHash: string) {
  try {
    const actual = Buffer.from(scryptSync(password, salt, 64).toString("hex"), "hex");
    const expected = Buffer.from(storedHash, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function createAdminToken(username: string, accessRole: AdminAccessRole = "owner") {
  return new SignJWT({ role: "admin", username, accessRole })
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

export async function authenticateAdminCredentials(usernameInput: string, password: string) {
  const username = usernameInput.trim().toLowerCase();
  try {
    await dbConnect();
    const user = await AdminUser.findOne({ username, isActive: true });
    if (user && verifyAdminPassword(password, user.salt, user.passwordHash)) {
      user.lastLoginAt = new Date();
      await user.save();
      return { username: user.username, accessRole: user.role as AdminAccessRole };
    }
  } catch (error) {
    console.error("database admin auth lookup failed", error);
  }

  const expectedUser = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
  const expectedPass = process.env.ADMIN_PASSWORD || "";
  if (!expectedPass) return null;
  const safeEq = (a: string, b: string) => {
    const aa = Buffer.from(a);
    const bb = Buffer.from(b);
    return aa.length === bb.length && timingSafeEqual(aa, bb);
  };
  return safeEq(username, expectedUser) && safeEq(password, expectedPass) ? { username: expectedUser, accessRole: "owner" as const } : null;
}

export async function isValidAdminCredentials(username: string, password: string) {
  return Boolean(await authenticateAdminCredentials(username, password));
}

export const adminCookie = COOKIE;
