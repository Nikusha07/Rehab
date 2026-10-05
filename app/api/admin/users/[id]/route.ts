import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { adminCookie, hasAdminPermission, hashAdminPassword, verifyAdminToken } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { dbConnect } from "@/lib/db";
import AdminUser from "@/models/AdminUser";

const schema = z.object({
  role: z.enum(["owner", "reception", "doctor"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).max(128).optional(),
}).refine((value) => Object.keys(value).length > 0);

async function authorize(request: NextRequest) {
  const auth = await verifyAdminToken(request.cookies.get(adminCookie)?.value);
  if (!auth || !hasAdminPermission(auth, "users.write")) return { auth, error: NextResponse.json({ ok: false }, { status: auth ? 403 : 401 }) };
  return { auth, error: null };
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { auth, error } = await authorize(request); if (error) return error;
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ ok: false }, { status: 400 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "შეამოწმეთ მონაცემები." }, { status: 400 });
  await dbConnect();
  const user = await AdminUser.findById(id);
  if (!user) return NextResponse.json({ ok: false }, { status: 404 });
  if (parsed.data.role) user.role = parsed.data.role;
  if (typeof parsed.data.isActive === "boolean") user.isActive = parsed.data.isActive;
  if (parsed.data.password) {
    const { salt, passwordHash } = hashAdminPassword(parsed.data.password);
    user.salt = salt; user.passwordHash = passwordHash;
  }
  await user.save();
  await writeAudit({ actor: String(auth?.username || "admin"), action: "admin-user.update", entity: "admin-user", entityId: id, summary: `Admin მომხმარებელი განახლდა: ${user.username}`, metadata: { role: user.role, isActive: user.isActive, passwordChanged: Boolean(parsed.data.password) } });
  return NextResponse.json({ ok: true, item: { _id: user._id, username: user.username, role: user.role, isActive: user.isActive, lastLoginAt: user.lastLoginAt } });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { auth, error } = await authorize(request); if (error) return error;
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ ok: false }, { status: 400 });
  await dbConnect();
  const user = await AdminUser.findById(id);
  if (!user) return NextResponse.json({ ok: false }, { status: 404 });
  if (String(user.username) === String(auth?.username || "").toLowerCase()) return NextResponse.json({ ok: false, message: "საკუთარი აქტიური ანგარიშის წაშლა არ შეიძლება." }, { status: 400 });
  const username = user.username;
  await user.deleteOne();
  await writeAudit({ actor: String(auth?.username || "admin"), action: "admin-user.delete", entity: "admin-user", entityId: id, summary: `Admin მომხმარებელი წაიშალა: ${username}` });
  return NextResponse.json({ ok: true });
}
