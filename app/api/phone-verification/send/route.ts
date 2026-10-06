import { randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { hashPhoneVerificationCode, normalizePatientPhone } from "@/lib/phone-verification";
import { sendBookingSms } from "@/lib/sms";
import PhoneVerification from "@/models/PhoneVerification";
import SmsLog from "@/models/SmsLog";

const schema = z.object({
  phone: z.string().transform(normalizePatientPhone).refine((v) => /^5\d{8}$/.test(v), "არასწორი ტელეფონის ნომერი"),
});

const CODE_TTL_MS = 5 * 60 * 1000;
const RESEND_SECONDS = 60;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 5;

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "შეიყვანეთ სწორი 9-ციფრიანი ნომერი." }, { status: 400 });

  const phone = parsed.data.phone;
  await dbConnect();
  const now = new Date();
  const existing: any = await PhoneVerification.findOne({ phone }).lean();

  if (existing?.lastSentAt) {
    const secondsPassed = Math.floor((now.getTime() - new Date(existing.lastSentAt).getTime()) / 1000);
    if (secondsPassed < RESEND_SECONDS) {
      const retryAfter = RESEND_SECONDS - secondsPassed;
      return NextResponse.json({ ok: false, message: `კოდის ხელახლა გამოგზავნას შეძლებთ ${retryAfter} წამში.`, retryAfter }, { status: 429 });
    }
  }

  const windowFresh = existing?.windowStartedAt && now.getTime() - new Date(existing.windowStartedAt).getTime() < WINDOW_MS;
  const sendsInWindow = windowFresh ? Number(existing?.sendsInWindow || 0) : 0;
  if (sendsInWindow >= MAX_SENDS_PER_WINDOW) {
    return NextResponse.json({ ok: false, message: "ამ ნომერზე ძალიან ბევრი კოდი გაიგზავნა. სცადეთ დაახლოებით ერთ საათში." }, { status: 429 });
  }

  const code = String(randomInt(100000, 1000000));
  const codeHash = hashPhoneVerificationCode(phone, code);
  const windowStartedAt = windowFresh ? new Date(existing.windowStartedAt) : now;
  const nextCount = windowFresh ? sendsInWindow + 1 : 1;
  const codeExpiresAt = new Date(now.getTime() + CODE_TTL_MS);
  const cleanupAt = new Date(now.getTime() + WINDOW_MS + 10 * 60 * 1000);

  await PhoneVerification.findOneAndUpdate(
    { phone },
    {
      $set: {
        phone,
        codeHash,
        codeExpiresAt,
        attempts: 0,
        lastSentAt: now,
        windowStartedAt,
        sendsInWindow: nextCount,
        verifiedAt: null,
        tokenHash: "",
        tokenExpiresAt: null,
        consumedAt: null,
        cleanupAt,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const text = `Rehab Center: ნომრის დადასტურების კოდია ${code}. კოდი მოქმედებს 5 წუთი.`;
  try {
    const sms = await sendBookingSms(phone, text);
    const status = sms.success ? "sent" : ("skipped" in sms && sms.skipped ? "skipped" : "failed");
    await SmsLog.create({ bookingId: null, phone, message: text, status, payload: { ...sms, kind: "phone_verification" } });
    if (!sms.success) {
      return NextResponse.json({ ok: false, message: "SMS-ის გაგზავნა ვერ მოხერხდა. სცადეთ ცოტა ხანში." }, { status: 502 });
    }
  } catch (error) {
    console.error("phone verification SMS failed", error);
    return NextResponse.json({ ok: false, message: "SMS-ის გაგზავნა ვერ მოხერხდა. სცადეთ ცოტა ხანში." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, expiresIn: 300, retryAfter: RESEND_SECONDS });
}
