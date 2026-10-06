import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { hashPhoneVerificationCode, hashPhoneVerificationToken, normalizePatientPhone, safeHashEqual } from "@/lib/phone-verification";
import PhoneVerification from "@/models/PhoneVerification";

const schema = z.object({
  phone: z.string().transform(normalizePatientPhone).refine((v) => /^5\d{8}$/.test(v)),
  code: z.string().transform((v) => v.replace(/\D/g, "")).refine((v) => /^\d{6}$/.test(v)),
});

const MAX_ATTEMPTS = 5;
const TOKEN_TTL_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "შეამოწმეთ ნომერი და 6-ნიშნა კოდი." }, { status: 400 });

  const { phone, code } = parsed.data;
  await dbConnect();
  const now = new Date();
  const doc: any = await PhoneVerification.findOne({ phone }).lean();

  if (!doc || !doc.codeExpiresAt || new Date(doc.codeExpiresAt) <= now) {
    return NextResponse.json({ ok: false, message: "კოდს ვადა გაუვიდა. გამოაგზავნეთ ახალი კოდი." }, { status: 400 });
  }
  if (Number(doc.attempts || 0) >= MAX_ATTEMPTS) {
    return NextResponse.json({ ok: false, message: "მცდელობების ლიმიტი ამოიწურა. გამოაგზავნეთ ახალი კოდი." }, { status: 429 });
  }

  const incomingHash = hashPhoneVerificationCode(phone, code);
  if (!safeHashEqual(incomingHash, String(doc.codeHash || ""))) {
    const updated: any = await PhoneVerification.findOneAndUpdate({ phone }, { $inc: { attempts: 1 } }, { new: true }).lean();
    const attemptsLeft = Math.max(0, MAX_ATTEMPTS - Number(updated?.attempts || 0));
    return NextResponse.json({ ok: false, message: attemptsLeft ? `კოდი არასწორია. დარჩა ${attemptsLeft} მცდელობა.` : "მცდელობების ლიმიტი ამოიწურა. გამოაგზავნეთ ახალი კოდი." }, { status: attemptsLeft ? 400 : 429 });
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashPhoneVerificationToken(phone, token);
  const tokenExpiresAt = new Date(now.getTime() + TOKEN_TTL_MS);
  const cleanupAt = new Date(tokenExpiresAt.getTime() + 10 * 60 * 1000);

  await PhoneVerification.findOneAndUpdate(
    { phone },
    {
      $set: {
        verifiedAt: now,
        tokenHash,
        tokenExpiresAt,
        consumedAt: null,
        cleanupAt,
      },
    },
    { new: true }
  );

  return NextResponse.json({ ok: true, token, expiresIn: 900 });
}
