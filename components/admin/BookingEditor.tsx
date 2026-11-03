"use client";

import { minutesToTime, timeToMinutes } from "@/lib/time";
import { FormEvent, useEffect, useState } from "react";

type Service = { _id: string; name: string; durationMinutes: number; price?: number | null };
type Specialist = { _id: string; name: string; title?: string };
export type EditableBooking = {
  _id: string;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  durationMinutes?: number;
  notes?: string;
  status: string;
  serviceId?: { _id?: string; name?: string };
  specialistId?: { _id?: string; name?: string; title?: string };
};

function normalizeTime(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^\d{3,4}$/.test(digits)) {
    const padded = digits.padStart(4, "0");
    const result = padded.slice(0, 2) + ":" + padded.slice(2);
    if (/^([01]\d|2[0-3]):[0-5]\d$/.test(result)) return result;
  }
  return value;
}

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
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
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
    setEndTime(booking ? minutesToTime(timeToMinutes(booking.time) + (booking.durationMinutes || 30)) : "");
    setNotes(booking?.notes || "");
    setError("");
  }, [open, booking]);

  if (!open) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const startValue = normalizeTime(time);
    const endValue = normalizeTime(endTime);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startValue) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endValue)) return setError("ჩაწერეთ დრო 24-საათიანი ფორმატით, მაგალითად 10:10.");
    if (!endValue || endValue <= startValue) return setError("მიუთითეთ დასრულების დრო დაწყების შემდეგ.");
    if (!time) return setError("აირჩიეთ ვიზიტის დრო.");
    setBusy(true);
    const payload = { patientName, patientPhone, serviceId, specialistId, date, time: startValue, endTime: endValue, notes };
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
          <label className="adm-field"><span>სერვისი</span><select value={serviceId} onChange={(e) => { setServiceId(e.target.value); }} required><option value="">აირჩიეთ</option>{services.map((x) => <option key={x._id} value={x._id}>{x.name}{x.price != null ? ` — ${x.price} ₾` : ""}</option>)}</select></label>
          <label className="adm-field"><span>სპეციალისტი</span><select value={specialistId} onChange={(e) => { setSpecialistId(e.target.value); }} required><option value="">აირჩიეთ</option>{specialists.map((x) => <option key={x._id} value={x._id}>{x.name}{x.title ? ` — ${x.title}` : ""}</option>)}</select></label>
        </div>
        <label className="adm-field"><span>თარიღი</span><input type="date" min={todayInput()} value={date} onChange={(e) => { setDate(e.target.value); }} required /></label>

        <fieldset className="adm-slot-box" style={{ margin: 0, minWidth: 0 }}>
          <legend style={{ padding: "0 6px", fontWeight: 700 }}>ვიზიტის დრო</legend>
          <div className="adm-form-row">
            <label className="adm-field"><span>საიდან</span><input type="text" inputMode="numeric" placeholder="10:10" maxLength={5} value={time} onChange={(e) => setTime(e.target.value.replace(/[^0-9:]/g, ""))} onBlur={() => {
              const value = normalizeTime(time);
              setTime(value);
              if (!endTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
                const end = timeToMinutes(value) + (services.find((item) => item._id === serviceId)?.durationMinutes || 30);
                if (end < 1440) setEndTime(minutesToTime(end));
              }
            }} aria-describedby="booking-time-help" autoComplete="off" required /></label>
            <label className="adm-field"><span>სადამდე</span><input type="text" inputMode="numeric" placeholder="11:25" maxLength={5} value={endTime} onChange={(e) => setEndTime(e.target.value.replace(/[^0-9:]/g, ""))} onBlur={() => setEndTime(normalizeTime(endTime))} aria-describedby="booking-time-help" autoComplete="off" required /></label>
          </div>
          <p id="booking-time-help" className="adm-help">აკრიფეთ 24-საათიანი დრო: 10:10 ან 1010. დასრულების დრო შეგიძლიათ შეცვალოთ.</p>
          {/^([01]\d|2[0-3]):[0-5]\d$/.test(normalizeTime(time)) && /^([01]\d|2[0-3]):[0-5]\d$/.test(normalizeTime(endTime)) && normalizeTime(endTime) > normalizeTime(time) && <p role="status" style={{ marginBottom: 0 }}><strong>{normalizeTime(time)} – {normalizeTime(endTime)}</strong> · {timeToMinutes(normalizeTime(endTime)) - timeToMinutes(normalizeTime(time))} წუთი</p>}
        </fieldset>

        <label className="adm-field"><span>შენიშვნა</span><textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} placeholder="არასავალდებულო ინფორმაცია" /></label>
        {error && <div className="adm-notice error">{error}</div>}
        <div className="adm-modal-actions"><button type="button" className="adm-btn" onClick={onClose}>გაუქმება</button><button className="adm-btn primary" disabled={busy}>{busy ? "ინახება..." : booking ? "ცვლილებების შენახვა" : "ჯავშნის შექმნა"}</button></div>
      </form>
    </section>
  </div>;
}

