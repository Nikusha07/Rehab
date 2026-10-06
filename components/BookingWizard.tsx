"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

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
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("idle");
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const successRef = useRef<HTMLDivElement | null>(null);

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

  const selectedService = useMemo(() => services.find((s) => s._id === serviceId), [services, serviceId]);
  const availableSlots = slots.filter((s) => s.available);

  function changePhone(value: string) {
    const next = value.replace(/\D/g, "").slice(0, 9);
    setPhone(next);
    setVerificationCode("");
    setVerificationToken("");
    setVerificationStatus("idle");
    setVerificationMessage("");
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
      setVerificationCode("");
      setVerificationStatus("sent");
      setCooldown(Number(data.retryAfter || 60));
      setVerificationMessage("6-ნიშნა კოდი გამოგზავნილია SMS-ით. კოდი მოქმედებს 5 წუთი.");
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
        if (res.status === 403) {
          setVerificationToken("");
          setVerificationStatus("idle");
          setVerificationCode("");
        }
        throw new Error(data.message || "ჩაწერა ვერ შესრულდა.");
      }
      setConfirmation(data);
    } catch (e) { setError(e instanceof Error ? e.message : "ჩაწერა ვერ შესრულდა."); }
    finally { setSubmitting(false); }
  }

  if (confirmation) return (
    <div className="booking-success" role="status" ref={successRef} tabIndex={-1} aria-live="polite">
      <div className="success-check">✓</div>
      <span className="eyebrow green">ჩაწერა დასრულებულია</span>
      <h3>გელოდებით ვიზიტზე</h3>
      <p>{confirmation.service} — {confirmation.specialist}</p>
      <div className="confirmation-grid"><strong>{confirmation.date}</strong><strong>{confirmation.time}</strong></div>
      <div className="code-box"><small>ჯავშნის კოდი</small><b>{confirmation.confirmationCode}</b></div>
      <p className="verification-success-copy">ვიზიტის დეტალები SMS-ითაც გამოგეგზავნათ დადასტურებულ ნომერზე.</p>
      <button className="button button-soft" onClick={() => {
        setConfirmation(null); setTime(""); setDate(""); setPhone(""); setVerificationCode(""); setVerificationToken(""); setVerificationStatus("idle"); setVerificationMessage(""); setCooldown(0);
      }}>ახალი ჩაწერა</button>
    </div>
  );

  return (
    <form className="booking-form" onSubmit={submit}>
      <div className="booking-step"><span>1</span><div><b>აირჩიეთ ვიზიტი</b><small>მომსახურება, სპეციალისტი და თარიღი</small></div></div>
      <div className="field-grid">
        <label className="field"><span>მომსახურება</span><select value={serviceId} onChange={(e) => setServiceId(e.target.value)} required><option value="">აირჩიეთ მომსახურება</option>{services.map((s) => <option key={s._id} value={s._id}>{s.name}{s.price != null ? ` — ${s.price} ₾` : ""}</option>)}</select></label>
        <label className="field"><span>სპეციალისტი</span><select value={specialistId} onChange={(e) => setSpecialistId(e.target.value)} required><option value="">აირჩიეთ სპეციალისტი</option>{specialists.map((s) => <option key={s._id} value={s._id}>{s.name}{s.title ? ` — ${s.title}` : ""}</option>)}</select></label>
        <label className="field"><span>თარიღი</span><input type="date" value={date} min={todayInput()} onChange={(e) => setDate(e.target.value)} required /></label>
      </div>
      {selectedService && <p className="duration-note">ვიზიტის სავარაუდო ხანგრძლივობა: <b>{selectedService.durationMinutes} წუთი</b></p>}
      <div className="time-panel">
        <div className="time-panel-head"><b>თავისუფალი დრო</b><span className={availableSlots.length ? "status-ok" : ""}>{loadingSlots ? "იტვირთება..." : slotMessage}</span></div>
        {!serviceId || !specialistId || !date ? <p className="empty-slots">დროების სანახავად შეავსეთ ზემოთ მოცემული სამი ველი.</p> :
          <div className="slot-grid">{slots.map((slot) => <button type="button" key={slot.time} disabled={!slot.available} title={slot.reason} className={`slot ${time === slot.time ? "selected" : ""}`} onClick={() => setTime(slot.time)}>{slot.time}</button>)}</div>}
      </div>

      <div className="booking-step second"><span>2</span><div><b>თქვენი ინფორმაცია</b><small>ტელეფონის ნომერს SMS კოდით დაადასტურებთ</small></div></div>
      <div className="field-grid two patient-grid">
        <label className="field"><span>სახელი და გვარი</span><input name="patientName" type="text" minLength={2} maxLength={120} placeholder="მაგ. ნინო ბერიძე" required /></label>
        <label className="field"><span>ტელეფონი</span><input name="patientPhone" value={phone} onChange={(e) => changePhone(e.target.value)} type="tel" inputMode="numeric" pattern="5[0-9]{8}" maxLength={9} placeholder="5XX XX XX XX" autoComplete="tel" required /></label>
      </div>

      <div className={`phone-verification ${verificationStatus === "verified" ? "is-verified" : ""}`}>
        <div className="phone-verification-head">
          <div><b>ნომრის დადასტურება</b><small>SMS კოდი იცავს ჯავშანს არასწორი ან სხვისი ნომრის გამოყენებისგან.</small></div>
          {verificationStatus === "verified" && <span className="verified-badge">✓ დადასტურებულია</span>}
        </div>

        {verificationStatus !== "verified" && <div className="verification-actions">
          <button type="button" className="button button-soft verify-send-button" onClick={sendVerificationCode} disabled={verificationBusy || cooldown > 0 || !/^5\d{8}$/.test(phone)}>
            {verificationBusy && verificationStatus === "idle" ? "იგზავნება..." : cooldown > 0 ? `ხელახლა ${cooldown}წმ` : verificationStatus === "sent" ? "კოდის ხელახლა გაგზავნა" : "SMS კოდის მიღება"}
          </button>
          {verificationStatus === "sent" && <div className="verification-code-row">
            <input aria-label="SMS დადასტურების კოდი" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" />
            <button type="button" className="button button-primary" onClick={verifyPhone} disabled={verificationBusy || verificationCode.length !== 6}>{verificationBusy ? "მოწმდება..." : "კოდის დადასტურება"}</button>
          </div>}
        </div>}
        {verificationMessage && <p className={`verification-message ${verificationStatus === "verified" ? "success" : ""}`}>{verificationMessage}</p>}
      </div>

      <label className="field"><span>შენიშვნა <em>არასავალდებულო</em></span><textarea name="notes" rows={3} maxLength={1000} placeholder="მაგ. სასურველი დამატებითი ინფორმაცია"></textarea></label>
      <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {error && <div className="form-error">{error}</div>}
      <button className="button button-primary submit-button" disabled={submitting || !time || verificationStatus !== "verified"}>{submitting ? "მუშავდება..." : verificationStatus !== "verified" ? "ჯერ დაადასტურეთ ნომერი" : "ვიზიტის დადასტურება"}<span>→</span></button>
      <p className="privacy-note">ჩაწერით ადასტურებთ, რომ მითითებული ნომერი თქვენ გეკუთვნით და ეთანხმებით ვიზიტთან დაკავშირებული შეტყობინებების მიღებას.</p>
    </form>
  );
}
