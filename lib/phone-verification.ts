import { createHmac, timingSafeEqual } from "node:crypto";

function verificationSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) throw new Error("VERIFICATION_SECRET_MISSING");
  return secret;
}

export function normalizePatientPhone(value: string) {
  return value.replace(/\D/g, "");
}

export function hashPhoneVerificationCode(phone: string, code: string) {
  return createHmac("sha256", verificationSecret())
    .update(`phone-otp:${phone}:${code}`)
    .digest("hex");
}

export function hashPhoneVerificationToken(phone: string, token: string) {
  return createHmac("sha256", verificationSecret())
    .update(`phone-token:${phone}:${token}`)
    .digest("hex");
}

export function safeHashEqual(left: string, right: string) {
  if (!left || !right || left.length !== right.length) return false;
  return timingSafeEqual(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}
