"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Service = { _id: string; name: string; description?: string; durationMinutes: number; price?: number | null };
type Specialist = { _id: string; name: string; title?: string };
type Slot = { time: string; available: boolean; reason?: string };
type Confirmation = { confirmationCode: string; date: string; time: string; service: string; specialist: string };

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

  const selectedService = useMemo(() => services.find((s) => s._id === serviceId), [services, serviceId]);
  const availableSlots = slots.filter((s) => s.available);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (!time) return setError("აირჩიეთ თავისუფალი დრო.");
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: form.get("patientName"), patientPhone: form.get("patientPhone"),
          serviceId, specialistId, date, time, notes: form.get("notes") || "", website: form.get("website") || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "ჩაწერა ვერ შესრულდა.");
      setConfirmation(data);
    } catch (e) { setError(e instanceof Error ? e.message : "ჩაწერა ვერ შესრულდა."); }
    finally { setSubmitting(false); }
  }

  if (confirmation) return (
    <div className="booking-success" role="status">
      <div className="success-check">✓</div>
      <span className="eyebrow green">ჩაწერა დასრულებულია</span>
      <h3>გელოდებით ვიზიტზე</h3>
      <p>{confirmation.service} — {confirmation.specialist}</p>
      <div className="confirmation-grid"><strong>{confirmation.date}</strong><strong>{confirmation.time}</strong></div>
      <div className="code-box"><small>დადასტურების კოდი</small><b>{confirmation.confirmationCode}</b></div>
      <button className="button button-soft" onClick={() => { setConfirmation(null); setTime(""); setDate(""); }}>ახალი ჩაწერა</button>
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
      <div className="booking-step second"><span>2</span><div><b>თქვენი ინფორმაცია</b><small>დადასტურებისთვის დაგვჭირდება მხოლოდ ძირითადი მონაცემები</small></div></div>
      <div className="field-grid two">
        <label className="field"><span>სახელი და გვარი</span><input name="patientName" type="text" minLength={2} maxLength={120} placeholder="მაგ. ნინო ბერიძე" required /></label>
        <label className="field"><span>ტელეფონი</span><input name="patientPhone" type="tel" inputMode="numeric" pattern="5[0-9]{8}" maxLength={9} placeholder="5XX XX XX XX" required /></label>
      </div>
      <label className="field"><span>შენიშვნა <em>არასავალდებულო</em></span><textarea name="notes" rows={3} maxLength={1000} placeholder="მაგ. სასურველი დამატებითი ინფორმაცია"></textarea></label>
      <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {error && <div className="form-error">{error}</div>}
      <button className="button button-primary submit-button" disabled={submitting || !time}>{submitting ? "მუშავდება..." : "ვიზიტის დადასტურება"}<span>→</span></button>
      <p className="privacy-note">ჩაწერით ადასტურებთ, რომ მითითებული ნომერი თქვენ გეკუთვნით და ეთანხმებით ვიზიტთან დაკავშირებული შეტყობინების მიღებას.</p>
    </form>
  );
}
