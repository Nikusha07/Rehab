const GOSMS_BASE = "https://api.gosms.ge/api";

function credentials() {
  return {
    apiKey: process.env.GOSMS_API_KEY?.trim() || "",
    sender: process.env.GOSMS_SENDER?.trim() || "",
  };
}

export function isGoSmsConfigured() {
  const { apiKey, sender } = credentials();
  return Boolean(apiKey && sender);
}

export async function getGoSmsBalance() {
  const { apiKey } = credentials();
  if (!apiKey) return { success: false, skipped: true as const };
  try {
    const body = new URLSearchParams({ api_key: apiKey });
    const res = await fetch(`${GOSMS_BASE}/sms-balance`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json().catch(() => ({}));
    return { success: res.ok && data?.success === true, balance: data?.balance ?? null, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Balance check failed" };
  }
}

export async function sendBookingSms(phone: string, text: string) {
  const { apiKey, sender } = credentials();
  if (!apiKey || !sender) return { success: false, skipped: true as const };

  const digits = phone.replace(/\D/g, "");
  const to = /^5\d{8}$/.test(digits) ? `995${digits}` : digits;
  const body = new URLSearchParams({ api_key: apiKey, from: sender, to, text, urgent: "false" });

  try {
    const res = await fetch(`${GOSMS_BASE}/sendsms`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json().catch(() => ({}));
    return {
      success: res.ok && data?.success === true,
      messageId: data?.messageId ?? null,
      balance: data?.balance ?? null,
      errorCode: data?.errorCode ?? null,
      data,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "SMS failed" };
  }
}
