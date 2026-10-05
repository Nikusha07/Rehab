import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminCookie, hasAdminPermission, hashAdminPassword, verifyAdminToken } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { dbConnect } from "@/lib/db";
import AdminUser from "@/models/AdminUser";

const schema = z.object({
  username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(8).max(128),
  role: z.enum(["owner", "reception", "doctor"]),
});

export async function GET(request: NextRequest) {
  const auth = await verifyAdminToken(request.cookies.get(adminCookie)?.value);
  if (!auth || !hasAdminPermission(auth, "users.write")) return NextResponse.json({ ok: false }, { status: auth ? 403 : 401 });
  await dbConnect();
  const items = await AdminUser.find({}).select("username role isActive lastLoginAt createdAt updatedAt").sort({ createdAt: 1 }).lean();
  return NextResponse.json({ ok: true, items, primaryUsername: (process.env.ADMIN_USERNAME || "admin").toLowerCase() });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminToken(request.cookies.get(adminCookie)?.value);
  if (!auth || !hasAdminPermission(auth, "users.write")) return NextResponse.json({ ok: false }, { status: auth ? 403 : 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "შეამოწმეთ მომხმარებლის მონაცემები." }, { status: 400 });
  await dbConnect();
  const username = parsed.data.username.toLowerCase();
  if (username === (process.env.ADMIN_USERNAME || "admin").toLowerCase()) return NextResponse.json({ ok: false, message: "ეს username მთავარ Vercel admin ანგარიშს ეკუთვნის." }, { status: 409 });
  const { salt, passwordHash } = hashAdminPassword(parsed.data.password);
  try {
    const item = await AdminUser.create({ username, salt, passwordHash, role: parsed.data.role, isActive: true });
    await writeAudit({ actor: String(auth.username || "admin"), action: "admin-user.create", entity: "admin-user", entityId: String(item._id), summary: `Admin მომხმარებელი შეიქმნა: ${username} (${parsed.data.role})` });
    return NextResponse.json({ ok: true, item: { _id: item._id, username: item.username, role: item.role, isActive: item.isActive, createdAt: item.createdAt } }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 11000) return NextResponse.json({ ok: false, message: "ასეთი username უკვე არსებობს." }, { status: 409 });
    return NextResponse.json({ ok: false, message: "მომხმარებლის შექმნა ვერ მოხერხდა." }, { status: 500 });
  }
}
