"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Service = { _id: string; name: string; durationMinutes: number; price?: number | null };
type Specialist = { _id: string; name: string; title?: string };
type Slot = { time: string; available: boolean; reason?: string };
export type EditableBooking = {
  _id: string;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  notes?: string;
  status: string;
  serviceId?: { _id?: string; name?: string };
  specialistId?: { _id?: string; name?: string; title?: string };
};

function todayInput() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export default function BookingEditor({
  open,
  booking,
  onClose,
  onSaved,
}: {
  open: boolean;
  booking: EditableBooking | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [services, setServices] = useState<Service[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [specialistId, setSpecialistId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotMessage, setSlotMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetch("/api/services", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/specialists", { cache: "no-store" }).then((r) => r.json()),
    ]).then(([a, b]) => {
      setServices(a.items || []);
      setSpecialists(b.items || []);
    }).catch(() => setError("სერვისების ან სპეციალისტების ჩატვირთვა ვერ მოხერხდა."));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setPatientName(booking?.patientName || "");
    setPatientPhone(booking?.patientPhone || "");
    setServiceId(booking?.serviceId?._id || "");
    setSpecialistId(booking?.specialistId?._id || "");
    setDate(booking?.date || "");
    setTime(booking?.time || "");
    setNotes(booking?.notes || "");
    setError("");
  }, [open, booking]);

  useEffect(() => {
    if (!open || !serviceId || !specialistId || !date) {
      setSlots([]);
      setSlotMessage("");
      return;
    }
    const controller = new AbortController();
    setSlotMessage("იტვირთება...");
    fetch(`/api/availability?date=${encodeURIComponent(date)}&specialistId=${serviceId ? encodeURIComponent(specialistId) : ""}&serviceId=${encodeURIComponent(serviceId)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (r) => ({ ok: r.ok, data: await r.json() }))
      .then(({ data }) => {
        setSlots(data.slots || []);
        setSlotMessage(data.message || (data.availableCount ? `თავისუფალია ${data.availableCount} დრო` : "თავისუფალი დრო არ არის"));
      })
      .catch((e) => { if (e.name !== "AbortError") setSlotMessage("დროების ჩატვირთვა ვერ მოხერხდა."); });
    return () => controller.abort();
  }, [open, serviceId, specialistId, date]);

  const currentTimeAllowed = Boolean(booking && booking.date === date && booking.time === time && booking.serviceId?._id === serviceId && booking.specialistId?._id === specialistId);
  const availableSlots = useMemo(() => slots.filter((x) => x.available), [slots]);

  if (!open) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!time) return setError("აირჩიეთ ვიზიტის დრო.");
    setBusy(true);
    const payload = { patientName, patientPhone, serviceId, specialistId, date, time, notes };
    const response = await fetch(booking ? `/api/admin/bookings/${booking._id}` : "/api/admin/bookings", {
      method: booking ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setError(data.message || "შენახვა ვერ მოხერხდა.");
    onSaved();
    onClose();
  }

  return <div className="adm-modal-overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="adm-modal" role="dialog" aria-modal="true" aria-labelledby="booking-editor-title">
      <div className="adm-modal-head">
        <div><h2 id="booking-editor-title">{booking ? "ჯავშნის რედაქტირება" : "ახალი ჯავშანი"}</h2><p>{booking ? "შეცვალეთ დრო, პაციენტი ან ვიზიტის დეტალები." : "ტელეფონით მიღებული ვიზიტი დაამატეთ კალენდარში."}</p></div>
        <button className="adm-icon-btn" type="button" onClick={onClose} aria-label="დახურვა">×</button>
      </div>
      <form className="adm-modal-body adm-form" onSubmit={submit}>
        <div className="adm-form-row">
          <label className="adm-field"><span>სახელი და გვარი</span><input value={patientName} onChange={(e) => setPatientName(e.target.value)} minLength={2} maxLength={120} required /></label>
          <label className="adm-field"><span>ტელეფონი</span><input value={patientPhone} onChange={(e) => setPatientPhone(e.target.value.replace(/\D/g, "").slice(0, 9))} inputMode="numeric" pattern="5[0-9]{8}" maxLength={9} required /></label>
        </div>
        <div className="adm-form-row">
          <label className="adm-field"><span>სერვისი</span><select value={serviceId} onChange={(e) => { setServiceId(e.target.value); setTime(""); }} required><option value="">აირჩიეთ</option>{services.map((x) => <option key={x._id} value={x._id}>{x.name}{x.price != null ? ` — ${x.price} ₾` : ""}</option>)}</select></label>
          <label className="adm-field"><span>სპეციალისტი</span><select value={specialistId} onChange={(e) => { setSpecialistId(e.target.value); setTime(""); }} required><option value="">აირჩიეთ</option>{specialists.map((x) => <option key={x._id} value={x._id}>{x.name}{x.title ? ` — ${x.title}` : ""}</option>)}</select></label>
        </div>
        <label className="adm-field"><span>თარიღი</span><input type="date" min={todayInput()} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} required /></label>

        <div className="adm-slot-box">
          <div className="adm-slot-box-head"><b>დრო</b><small>{slotMessage}</small></div>
          {!serviceId || !specialistId || !date ? <p className="adm-help">ჯერ აირჩიეთ სერვისი, სპეციალისტი და თარიღი.</p> :
            <div className="adm-slot-grid">
              {booking && currentTimeAllowed && !availableSlots.some((x) => x.time === booking.time) && <button type="button" className={`adm-slot ${time === booking.time ? "selected" : ""}`} onClick={() => setTime(booking.time)}>{booking.time}<small>მიმდინარე</small></button>}
              {availableSlots.map((slot) => <button type="button" key={slot.time} className={`adm-slot ${time === slot.time ? "selected" : ""}`} onClick={() => setTime(slot.time)}>{slot.time}</button>)}
            </div>
          }
        </div>

        <label className="adm-field"><span>შენიშვნა</span><textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} placeholder="არასავალდებულო ინფორმაცია" /></label>
        {error && <div className="adm-notice error">{error}</div>}
        <div className="adm-modal-actions"><button type="button" className="adm-btn" onClick={onClose}>გაუქმება</button><button className="adm-btn primary" disabled={busy}>{busy ? "ინახება..." : booking ? "ცვლილებების შენახვა" : "ჯავშნის შექმნა"}</button></div>
      </form>
    </section>
  </div>;
}
