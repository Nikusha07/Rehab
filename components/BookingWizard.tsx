"use client";

import { ClipboardEvent, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

type Service = { _id: string; name: string; description?: string; durationMinutes: number; price?: number | null };
type Specialist = { _id: string; name: string; title?: string };
type Slot = { time: string; available: boolean; reason?: string };
type Confirmation = { confirmationCode: string; date: string; time: string; service: string; specialist: string };
type VerificationStatus = "idle" | "sent" | "verified";

function todayInput() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function formatCountdown(total: number) {
  const minutes = Math.floor(total / 60).toString().padStart(2, "0");
  const seconds = (total % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function BookingWizard() {
  const [services, setServices] = useState<Service[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [specialistId, setSpecialistId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotMessage, setSlotMessage] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [phone, setPhone] = useState("");
  const [verificationDigits, setVerificationDigits] = useState<string[]>(Array(6).fill(""));
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("idle");
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [codeExpiresIn, setCodeExpiresIn] = useState(0);
  const successRef = useRef<HTMLDivElement | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const verificationCode = verificationDigits.join("");

  useEffect(() => {
    Promise.all([fetch("/api/services").then((r) => r.json()), fetch("/api/specialists").then((r) => r.json())])
      .then(([a, b]) => { setServices(a.items || []); setSpecialists(b.items || []); })
      .catch(() => setError("მონაცემების ჩატვირთვა ვერ მოხერხდა."));
  }, []);

  useEffect(() => {
    setTime(""); setSlots([]); setSlotMessage("");
    if (!serviceId || !specialistId || !date) return;
    const controller = new AbortController();
    setLoadingSlots(true);
    fetch(`/api/availability?date=${encodeURIComponent(date)}&specialistId=${specialistId}&serviceId=${serviceId}`, { signal: controller.signal, cache: "no-store" })
      .then(async (r) => ({ ok: r.ok, data: await r.json() }))
      .then(({ data }) => {
        setSlots(data.slots || []);
        setSlotMessage(data.blocked ? data.message : data.availableCount ? `თავისუფალია ${data.availableCount} დრო` : "ამ დღეს თავისუფალი დრო აღარ არის");
      })
      .catch((e) => { if (e.name !== "AbortError") setSlotMessage("თავისუფალი დროების ჩატვირთვა ვერ მოხერხდა."); })
      .finally(() => setLoadingSlots(false));
    return () => controller.abort();
  }, [serviceId, specialistId, date]);

  useEffect(() => {
    if (!confirmation) return;
    const scrollToSuccess = () => {
      const node = successRef.current;
      if (!node) return;
      const top = node.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      node.focus({ preventScroll: true });
    };
    const frame = requestAnimationFrame(() => requestAnimationFrame(scrollToSuccess));
    const timer = window.setTimeout(scrollToSuccess, 220);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [confirmation]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (verificationStatus !== "sent" || codeExpiresIn <= 0) return;
    const timer = window.setTimeout(() => setCodeExpiresIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [verificationStatus, codeExpiresIn]);

  useEffect(() => {
    if (verificationStatus === "sent" && codeExpiresIn === 0) {
      setVerificationStatus("idle");
      setVerificationDigits(Array(6).fill(""));
      setVerificationMessage("კოდს ვადა გაუვიდა. მოითხოვეთ ახალი SMS კოდი.");
    }
  }, [verificationStatus, codeExpiresIn]);

  const selectedService = useMemo(() => services.find((s) => s._id === serviceId), [services, serviceId]);
  const availableSlots = slots.filter((s) => s.available);

  function resetVerification() {
    setVerificationDigits(Array(6).fill(""));
    setVerificationToken("");
    setVerificationStatus("idle");
    setVerificationMessage("");
    setCooldown(0);
    setCodeExpiresIn(0);
  }

  function changePhone(value: string) {
    const next = value.replace(/\D/g, "").slice(0, 9);
    setPhone(next);
    setVerificationDigits(Array(6).fill(""));
    setVerificationToken("");
    setVerificationStatus("idle");
    setVerificationMessage("");
    setCodeExpiresIn(0);
  }

  function changeOtpDigit(index: number, value: string) {
    const digits = value.replace(/\D/g, "");
    const next = [...verificationDigits];
    next[index] = digits.slice(-1);
    setVerificationDigits(next);
    if (digits && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !verificationDigits[index] && index > 0) otpRefs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpPaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    const next = Array.from({ length: 6 }, (_, index) => pasted[index] || "");
    setVerificationDigits(next);
    otpRefs.current[Math.min(pasted.length, 6) - 1]?.focus();
  }

  async function sendVerificationCode() {
    setError("");
    setVerificationMessage("");
    if (!/^5\d{8}$/.test(phone)) {
      setVerificationMessage("შეიყვანეთ სწორი 9-ციფრიანი ნომერი.");
      return;
    }
    setVerificationBusy(true);
    try {
      const res = await fetch("/api/phone-verification/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (typeof data.retryAfter === "number") setCooldown(data.retryAfter);
        throw new Error(data.message || "კოდის გამოგზავნა ვერ მოხერხდა.");
      }
      setVerificationToken("");
      setVerificationDigits(Array(6).fill(""));
      setVerificationStatus("sent");
      setCooldown(Number(data.retryAfter || 60));
      setCodeExpiresIn(300);
      setVerificationMessage("6-ნიშნა კოდი გამოგზავნილია SMS-ით.");
      window.setTimeout(() => otpRefs.current[0]?.focus(), 80);
    } catch (e) {
      setVerificationMessage(e instanceof Error ? e.message : "კოდის გამოგზავნა ვერ მოხერხდა.");
    } finally {
      setVerificationBusy(false);
    }
  }

  async function verifyPhone() {
    setError("");
    setVerificationMessage("");
    if (!/^\d{6}$/.test(verificationCode)) {
      setVerificationMessage("შეიყვანეთ SMS-ით მიღებული 6-ნიშნა კოდი.");
      return;
    }
    setVerificationBusy(true);
    try {
      const res = await fetch("/api/phone-verification/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: verificationCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "კოდის დადასტურება ვერ მოხერხდა.");
      setVerificationToken(data.token || "");
      setVerificationStatus("verified");
      setCodeExpiresIn(0);
      setVerificationMessage("ნომერი წარმატებით დადასტურდა.");
    } catch (e) {
      setVerificationMessage(e instanceof Error ? e.message : "კოდის დადასტურება ვერ მოხერხდა.");
    } finally {
      setVerificationBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (!time) return setError("აირჩიეთ თავისუფალი დრო.");
    if (verificationStatus !== "verified" || !verificationToken) return setError("ჯერ დაადასტურეთ ტელეფონის ნომერი SMS კოდით.");
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: form.get("patientName"), patientPhone: phone, phoneVerificationToken: verificationToken,
          serviceId, specialistId, date, time, notes: form.get("notes") || "", website: form.get("website") || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) resetVerification();
        throw new Error(data.message || "ჩაწერა ვერ შესრულდა.");
      }
      setConfirmation(data);
    } catch (e) { setError(e instanceof Error ? e.message : "ჩაწერა ვერ შესრულდა."); }
    finally { setSubmitting(false); }
  }

  if (confirmation) return (
    <div className="booking-success premium-booking-success" role="status" ref={successRef} tabIndex={-1} aria-live="polite">
      <div className="success-check">✓</div>
      <span className="eyebrow green">ჩაწერა დასრულებულია</span>
      <h3>ვიზიტი წარმატებით დაიჯავშნა</h3>
      <p>{confirmation.service} — {confirmation.specialist}</p>
      <div className="confirmation-grid"><strong>{confirmation.date}</strong><strong>{confirmation.time}</strong></div>
      <div className="code-box"><small>ჯავშნის კოდი</small><b>{confirmation.confirmationCode}</b></div>
      <p className="verification-success-copy">ვიზიტის დეტალები SMS-ითაც გამოგეგზავნათ დადასტურებულ ნომერზე.</p>
      <button className="button button-soft" onClick={() => {
        setConfirmation(null); setTime(""); setDate(""); setPhone(""); resetVerification();
      }}>ახალი ჩაწერა</button>
    </div>
  );

  return (
    <form className="booking-form booking-form-premium" onSubmit={submit}>
      <div className="premium-booking-head">
        <div className="premium-booking-head-icon" aria-hidden="true">✓</div>
        <div>
          <span className="premium-kicker">ონლაინ ჩაწერა</span>
          <h3>ვიზიტის დაჯავშნა</h3>
          <p>შეავსეთ მონაცემები და დაადასტურეთ თქვენი ნომერი SMS კოდით</p>
        </div>
        <div className="premium-calendar" aria-hidden="true"><span></span><b>▦</b></div>
      </div>

      <section className="premium-step-card">
        <div className="premium-step-head">
          <span className="premium-step-number">1</span>
          <div><b>აირჩიეთ ვიზიტი</b><small>მომსახურება, სპეციალისტი, თარიღი და თავისუფალი დრო</small></div>
        </div>

        <div className="premium-field-grid">
          <label className="premium-field">
            <span>მომსახურება</span>
            <div className="premium-control"><i aria-hidden="true">✚</i><select value={serviceId} onChange={(e) => setServiceId(e.target.value)} required><option value="">აირჩიეთ მომსახურება</option>{services.map((s) => <option key={s._id} value={s._id}>{s.name}{s.price != null ? ` — ${s.price} ₾` : ""}</option>)}</select></div>
          </label>
          <label className="premium-field">
            <span>სპეციალისტი</span>
            <div className="premium-control"><i aria-hidden="true">♙</i><select value={specialistId} onChange={(e) => setSpecialistId(e.target.value)} required><option value="">აირჩიეთ სპეციალისტი</option>{specialists.map((s) => <option key={s._id} value={s._id}>{s.name}{s.title ? ` — ${s.title}` : ""}</option>)}</select></div>
          </label>
          <label className="premium-field">
            <span>თარიღი</span>
            <div className="premium-control"><i aria-hidden="true">▣</i><input type="date" value={date} min={todayInput()} onChange={(e) => setDate(e.target.value)} required /></div>
          </label>
          <label className="premium-field">
            <span>თავისუფალი დრო</span>
            <div className="premium-control"><i aria-hidden="true">◷</i><select value={time} onChange={(e) => setTime(e.target.value)} disabled={!serviceId || !specialistId || !date || loadingSlots || availableSlots.length === 0} required>
              <option value="">{loadingSlots ? "იტვირთება..." : !serviceId || !specialistId || !date ? "ჯერ შეავსეთ წინა ველები" : availableSlots.length ? "აირჩიეთ დრო" : "თავისუფალი დრო არ არის"}</option>
              {availableSlots.map((slot) => <option key={slot.time} value={slot.time}>{slot.time}</option>)}
            </select></div>
          </label>
        </div>

        <div className="premium-slot-meta">
          <span className={availableSlots.length ? "is-ok" : ""}>{loadingSlots ? "თავისუფალი დროები იტვირთება..." : slotMessage || "აირჩიეთ მომსახურება, სპეციალისტი და თარიღი"}</span>
          {selectedService && <b>{selectedService.durationMinutes} წუთი</b>}
        </div>
      </section>

      <section className="premium-step-card">
        <div className="premium-step-head">
          <span className="premium-step-number">2</span>
          <div><b>თქვენი ინფორმაცია</b><small>დაჯავშნის დასადასტურებლად შეავსეთ ძირითადი მონაცემები</small></div>
        </div>

        <label className="premium-field premium-field-full">
          <span>სახელი და გვარი</span>
          <div className="premium-control"><i aria-hidden="true">♙</i><input name="patientName" type="text" minLength={2} maxLength={120} placeholder="მაგ. ნინო ბერიძე" autoComplete="name" required /></div>
        </label>
        <label className="premium-field premium-field-full">
          <span>შენიშვნა <em>არასავალდებულო</em></span>
          <div className="premium-control premium-textarea-control"><i aria-hidden="true">≡</i><textarea name="notes" rows={3} maxLength={1000} placeholder="მაგ. სასურველი დამატებითი ინფორმაცია"></textarea></div>
        </label>
      </section>

      <section className={`premium-verification-card ${verificationStatus === "verified" ? "is-verified" : ""}`}>
        <div className="premium-step-head verification-title-row">
          <span className="premium-shield" aria-hidden="true">✓</span>
          <div><b>ნომრის დადასტურება</b><small>შეიყვანეთ მობილურის ნომერი და მიიღეთ 6-ნიშნა SMS კოდი</small></div>
          {verificationStatus === "verified" && <span className="verified-badge">✓ დადასტურებულია</span>}
        </div>

        <div className="verification-phone-row">
          <label className="premium-field">
            <span>მობილურის ნომერი</span>
            <div className="premium-control"><i aria-hidden="true">▯</i><input value={phone} onChange={(e) => changePhone(e.target.value)} type="tel" inputMode="numeric" pattern="5[0-9]{8}" maxLength={9} placeholder="5XX XX XX XX" autoComplete="tel" required /></div>
          </label>
          <button type="button" className="premium-send-code" onClick={sendVerificationCode} disabled={verificationBusy || cooldown > 0 || !/^5\d{8}$/.test(phone) || verificationStatus === "verified"}>
            <span aria-hidden="true">➤</span>{verificationBusy && verificationStatus === "idle" ? "იგზავნება..." : cooldown > 0 ? `ხელახლა ${cooldown}წმ` : verificationStatus === "sent" ? "კოდის ხელახლა გაგზავნა" : verificationStatus === "verified" ? "ნომერი დადასტურებულია" : "კოდის მიღება"}
          </button>
        </div>

        {verificationStatus === "sent" && <div className="premium-otp-area">
          <div>
            <span className="otp-label">შეიყვანეთ მიღებული კოდი</span>
            <div className="otp-boxes">
              {verificationDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(node) => { otpRefs.current[index] = node; }}
                  value={digit}
                  onChange={(e) => changeOtpDigit(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  aria-label={`კოდის ${index + 1} ციფრი`}
                />
              ))}
            </div>
          </div>
          <div className="otp-timer"><span aria-hidden="true">◷</span><small>კოდი მოქმედებს</small><b>{formatCountdown(codeExpiresIn)}</b></div>
          <button type="button" className="premium-verify-code" onClick={verifyPhone} disabled={verificationBusy || verificationCode.length !== 6}>{verificationBusy ? "მოწმდება..." : "კოდის დადასტურება"}</button>
        </div>}

        {verificationMessage && <p className={`verification-message ${verificationStatus === "verified" ? "success" : ""}`}>{verificationMessage}</p>}
      </section>

      <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {error && <div className="form-error premium-form-error">{error}</div>}
      <button className="premium-submit" disabled={submitting || !time || verificationStatus !== "verified"}>{submitting ? "მუშავდება..." : verificationStatus !== "verified" ? "ჯერ დაადასტურეთ ნომერი" : "ვიზიტის დაჯავშნა"}<span>→</span></button>
      <p className="premium-privacy">დაჯავშნით ადასტურებთ, რომ მითითებული ნომერი თქვენ გეკუთვნით და ეთანხმებით ვიზიტთან დაკავშირებული SMS შეტყობინებების მიღებას.</p>
    </form>
  );
}
