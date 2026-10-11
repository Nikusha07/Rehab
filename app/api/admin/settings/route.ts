import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminCookie, hasAdminPermission, verifyAdminToken } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { dbConnect } from "@/lib/db";
import { SITE } from "@/lib/config";
import { getGoSmsBalance, isGoSmsConfigured } from "@/lib/sms";
import SiteSetting from "@/models/SiteSetting";

export const dynamic = "force-dynamic";

const schema = z.object({
  centerName: z.string().trim().min(2).max(120),
  tagline: z.string().trim().min(2).max(300),
  phone: z.string().transform((v) => v.replace(/\D/g, "")).refine((v) => /^5\d{8}$/.test(v), "ტელეფონი უნდა იყოს 9 ციფრი და იწყებოდეს 5-ით"),
  address: z.string().trim().min(2).max(300),
  mapQuery: z.string().trim().min(2).max(300),
  hours: z.string().trim().min(2).max(120),
  facebook: z.string().trim().max(500).optional().default(""),
  instagram: z.string().trim().max(500).optional().default(""),
  whatsapp: z.string().trim().max(60).optional().default(""),
});

async function auth(request: NextRequest) {
  return verifyAdminToken(request.cookies.get(adminCookie)?.value);
}

export async function GET(request: NextRequest) {
  const a = await auth(request);
  if (!a) return NextResponse.json({ ok: false }, { status: 401 });
  if (!hasAdminPermission(a, "settings.write")) return NextResponse.json({ ok: false }, { status: 403 });

  await dbConnect();
  const doc = await SiteSetting.findOne({ key: "main" }).lean();
  const smsBalance: any = isGoSmsConfigured()
    ? await Promise.race([
        getGoSmsBalance(),
        new Promise((resolve) => setTimeout(() => resolve({ success: false, timedOut: true }), 2500)),
      ])
    : { success: false, skipped: true as const };

  const rawItem: any = doc || {
    key: "main",
    centerName: SITE.name,
    tagline: SITE.tagline,
    phone: SITE.phone,
    address: SITE.address,
    mapQuery: SITE.mapQuery,
    hours: SITE.hours,
    facebook: "",
    instagram: "",
    whatsapp: "",
  };

  const savedMapQuery = String(rawItem.mapQuery || "").trim();
  const compactMapQuery = savedMapQuery.split(" ").join("");
  const mapQuery = !savedMapQuery || ["42.33825,43.40750", "42.3382498,43.4075005"].includes(compactMapQuery) ? SITE.mapQuery : savedMapQuery;

  const configVersion = Number(rawItem.configVersion || 0);
  const savedPhone = String(rawItem.phone || "").replace(/\D/g, "");
  const phone = configVersion < 1 || !savedPhone || savedPhone === "599000000" ? SITE.phone : savedPhone;

  const savedHours = String(rawItem.hours || "").trim();
  const compactHours = savedHours.replace(/\s/g, "");
  const hours = configVersion < 1 || !savedHours || ["10:00–18:00", "10:00-18:00", "10:00—18:00"].includes(compactHours) ? SITE.hours : savedHours;

  const item = { ...rawItem, mapQuery, phone, hours, configVersion: 1 };

  if (doc && (configVersion < 1 || phone !== savedPhone || hours !== savedHours || mapQuery !== savedMapQuery)) {
    await SiteSetting.updateOne(
      { key: "main" },
      { $set: { phone, hours, mapQuery, configVersion: 1 } }
    ).catch(() => undefined);
  }

  return NextResponse.json({
    ok: true,
    item,
    integrations: {
      mongo: Boolean(process.env.MONGODB_URI),
      auth: Boolean(process.env.AUTH_SECRET),
      gosms: isGoSmsConfigured(),
    },
    gosms: {
      configured: isGoSmsConfigured(),
      sender: process.env.GOSMS_SENDER?.trim() || "",
      balanceOk: smsBalance.success === true,
      balance: "balance" in smsBalance ? smsBalance.balance : null,
    },
  });
}

export async function PUT(request: NextRequest) {
  const a = await auth(request);
  if (!a) return NextResponse.json({ ok: false }, { status: 401 });
  if (!hasAdminPermission(a, "settings.write")) return NextResponse.json({ ok: false }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message || "შეამოწმეთ მონაცემები." }, { status: 400 });
  }

  await dbConnect();
  const item = await SiteSetting.findOneAndUpdate(
    { key: "main" },
    { $set: { ...parsed.data, key: "main", configVersion: 1 } },
    { returnDocument: "after", upsert: true, runValidators: true }
  );

  await writeAudit({
    actor: String(a.username || "admin"),
    action: "settings.update",
    entity: "settings",
    entityId: "main",
    summary: "ცენტრის პარამეტრები განახლდა",
  });

  return NextResponse.json({ ok: true, item });
}
