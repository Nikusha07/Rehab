export async function sendBookingSms(phone: string, text: string) {
  const apiKey = process.env.GOSMS_API_KEY?.trim();
  const sender = process.env.GOSMS_SENDER?.trim();
  if (!apiKey || !sender) return { success: false, skipped: true };
  const digits = phone.replace(/\D/g, "");
  const to = /^5\d{8}$/.test(digits) ? `995${digits}` : digits;
  const body = new URLSearchParams({ api_key: apiKey, from: sender, to, text, urgent: "false" });
  try {
    const res = await fetch("https://api.gosms.ge/api/sendsms", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json().catch(() => ({}));
    return { success: res.ok && data?.success === true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "SMS failed" };
  }
}
