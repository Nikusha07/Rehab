import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminCookie, hasAdminPermission, verifyAdminToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { sendBookingSms } from "@/lib/sms";
import SmsLog from "@/models/SmsLog";

const schema = z.object({
  phone: z.string().transform((v) => v.replace(/\D/g, "")).refine((v) => /^5\d{8}$/.test(v), "ტელეფონი უნდა იყოს 9 ციფრი და იწყებოდეს 5-ით"),
});

export async function POST(request: NextRequest) {
  const auth = await verifyAdminToken(request.cookies.get(adminCookie)?.value);
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });
  if (!hasAdminPermission(auth, "settings.write")) {
    return NextResponse.json({ ok: false, message: "ამ მოქმედებისთვის Owner უფლებაა საჭირო." }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message || "შეამოწმეთ ნომერი." }, { status: 400 });
  }

  await dbConnect();
  const text = "Rehab Center: GoSMS ინტეგრაცია წარმატებით მუშაობს. ეს არის სატესტო შეტყობინება.";
  const sms = await sendBookingSms(parsed.data.phone, text);
  const status = sms.success ? "sent" : ("skipped" in sms && sms.skipped ? "skipped" : "failed");

  await SmsLog.create({
    phone: parsed.data.phone,
    message: text,
    status,
    payload: { ...sms, kind: "integration-test", actor: String(auth.username || "admin") },
  });

  if (!sms.success) {
    const errorCode = "errorCode" in sms ? sms.errorCode : null;
    return NextResponse.json({ ok: false, message: errorCode ? `GoSMS შეცდომა: ${errorCode}` : "SMS ვერ გაიგზავნა. შეამოწმეთ API Key, sender და ბალანსი.", errorCode }, { status: 502 });
  }

  return NextResponse.json({ ok: true, message: "სატესტო SMS გაიგზავნა.", balance: "balance" in sms ? sms.balance : null, messageId: "messageId" in sms ? sms.messageId : null });
}
