"use client";

import { minutesToTime, nowInTbilisi, timeToMinutes } from "@/lib/time";
import { FormEvent, useEffect, useState } from "react";

type Service = { _id: string; name: string; durationMinutes: number; price?: number | null };
type Specialist = { _id: string; name: string; title?: string };
type PatientMatch = { _id: string; name: string; phone: string; personalId?: string };
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

export type BookingDefaults = { date: string; time: string; serviceId?: string; specialistId?: string; patient?: PatientMatch };

export default function BookingEditor({
  open,
  booking,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  booking: EditableBooking | null;
  initial?: BookingDefaults;
  onClose: () => void;
  onSaved: (date: string) => void;
}) {
  const [services, setServices] = useState<Service[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientMatch | null>(null);
  const [patientMatches, setPatientMatches] = useState<PatientMatch[]>([]);
  const [patientSearchStatus, setPatientSearchStatus] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [specialistId, setSpecialistId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [endOverride, setEndOverride] = useState<string | null>(null);
  const [searchByPhone, setSearchByPhone] = useState(false);
  const [notes, setNotes] = useState("");
  const [availability, setAvailability] = useState<{ key: string; times: string[]; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const normalizedStart = normalizeTime(time);
  const startMinutes = /^([01]\d|2[0-3]):[0-5]\d$/.test(normalizedStart) ? timeToMinutes(normalizedStart) : NaN;
  const duration = services.find((item) => item._id === serviceId)?.durationMinutes;
  const suggestedEnd = startMinutes + (duration ?? NaN);
  const endTime = endOverride ?? (suggestedEnd < 1440 ? minutesToTime(suggestedEnd) : "");
  const selectedSpecialistId = specialistId || (!booking && specialists.length === 1 ? specialists[0]._id : "");

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
    setPatientName(booking?.patientName || initial?.patient?.name || "");
    setPatientPhone(booking?.patientPhone || initial?.patient?.phone || "");
    setSelectedPatient(initial?.patient || null);
    setPatientMatches([]);
    setPatientSearchStatus("");
    setServiceId(booking?.serviceId?._id || initial?.serviceId || "");
    setSpecialistId(booking?.specialistId?._id || initial?.specialistId || "");
    setDate(booking?.date || initial?.date || "");
    setTime(booking?.time || initial?.time || "");
    setEndOverride(booking ? minutesToTime(timeToMinutes(booking.time) + (booking.durationMinutes || 30)) : null);
    setSearchByPhone(false);
    setAvailability(null);
    setNotes(booking?.notes || "");
    setError("");
  }, [open, booking, initial]);

  useEffect(() => {
    const query = (searchByPhone ? patientPhone : patientName).trim();
    if (!open || booking || selectedPatient || query.length < (searchByPhone ? 3 : 2)) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ mode: "booking", q: query });
        const response = await fetch(`/api/admin/patients?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Patient lookup failed");
        const { items }: { items: PatientMatch[] } = await response.json();
        if (controller.signal.aborted) return;
        setPatientMatches(items);
        setPatientSearchStatus(items.length ? "" : "პაციენტი ვერ მოიძებნა. შეგიძლიათ მონაცემები ხელით შეავსოთ.");
      } catch {
        if (!controller.signal.aborted) setPatientSearchStatus("პაციენტების ძებნა ვერ მოხერხდა.");
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, booking, patientName, patientPhone, searchByPhone, selectedPatient]);

  const availabilityKey = date && serviceId && selectedSpecialistId
    ? new URLSearchParams({ date, serviceId, specialistId: selectedSpecialistId }).toString()
    : "";
  useEffect(() => {
    if (!open || booking || !availabilityKey) return;
    const controller = new AbortController();
    async function loadTimes() {
      try {
        const response = await fetch(`/api/availability?${availabilityKey}`, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (controller.signal.aborted) return;
        const times = (data.slots ?? []).filter((slot: { available: boolean }) => slot.available).map((slot: { time: string }) => slot.time);
        setAvailability({ key: availabilityKey, times, message: data.message || "თავისუფალი დროები ვერ მოიძებნა." });
      } catch {
        if (!controller.signal.aborted) setAvailability({ key: availabilityKey, times: [], message: "თავისუფალი დროების ჩატვირთვა ვერ მოხერხდა." });
      }
    }
    void loadTimes();
    return () => controller.abort();
  }, [open, booking, availabilityKey]);

  if (!open) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    const startValue = normalizeTime(time);
    const endValue = normalizeTime(endTime);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startValue) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endValue)) return setError("ჩაწერეთ დრო 24-საათიანი ფორმატით, მაგალითად 10:10.");
    if (!endValue || endValue <= startValue) return setError("მიუთითეთ დასრულების დრო დაწყების შემდეგ.");
    if (!time) return setError("აირჩიეთ ვიზიტის დრო.");
    setBusy(true);
    const payload = { patientName, patientPhone, patientId: selectedPatient?._id, serviceId, specialistId: selectedSpecialistId, date, time: startValue, endTime: endValue, notes };
    try {
      const response = await fetch(booking ? `/api/admin/bookings/${booking._id}` : "/api/admin/bookings", {
        method: booking ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return setError(data.message || "შენახვა ვერ მოხერხდა.");
      onSaved(date);
      onClose();
    } catch {
      setError("კავშირი შეწყდა. ხელახლა ცდამდე გადაამოწმეთ კალენდარი.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="adm-modal-overlay" role="presentation" onMouseDown={(e) => { if (!busy && e.target === e.currentTarget) onClose(); }}>
    <section className="adm-modal" role="dialog" aria-modal="true" aria-labelledby="booking-editor-title">
      <div className="adm-modal-head">
        <div><h2 id="booking-editor-title">{booking ? "ჯავშნის რედაქტირება" : initial?.patient ? "შემდეგი ვიზიტი" : "ახალი ჯავშანი"}</h2><p>{booking ? "შეცვალეთ დრო, პაციენტი ან ვიზიტის დეტალები." : "ტელეფონით მიღებული ვიზიტი დაამატეთ კალენდარში."}</p></div>
        <button className="adm-icon-btn" type="button" onClick={onClose} disabled={busy} aria-label="დახურვა">×</button>
      </div>
      <form className="adm-modal-body adm-form" onSubmit={submit}>
        <div className="adm-form-row">
          <label className="adm-field"><span>სახელი და გვარი</span><input value={patientName} onChange={(e) => {
            if (selectedPatient) setPatientPhone("");
            setSelectedPatient(null);
            setPatientMatches([]);
            setPatientSearchStatus("");
            setSearchByPhone(false);
            setPatientName(e.target.value);
          }} minLength={2} maxLength={120} required /></label>
          <label className="adm-field"><span>ტელეფონი</span><input value={patientPhone} onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            setPatientPhone((digits.length > 9 && digits.startsWith("995") ? digits.slice(3) : digits).slice(0, 9));
            setSearchByPhone(true);
            setPatientMatches([]);
            setPatientSearchStatus("");
          }} readOnly={Boolean(selectedPatient)} inputMode="numeric" pattern="5[0-9]{8}" required /></label>
        </div>
        {!booking && patientMatches.length > 0 && (
          <div className="adm-field" role="group" aria-label="ნაპოვნი პაციენტები">
            {patientMatches.map((patient) => (
              <button className="adm-btn" key={patient._id} type="button" onClick={() => {
                setSelectedPatient(patient);
                setPatientName(patient.name);
                setPatientPhone(patient.phone);
                setPatientMatches([]);
                setPatientSearchStatus("");
              }}>{patient.name} · {patient.phone}</button>
            ))}
          </div>
        )}
        {!booking && patientSearchStatus && <p className="adm-help" role="status">{patientSearchStatus}</p>}
        {selectedPatient && !initial?.patient && <label className="adm-field"><span>პირადი ნომერი</span><input value={selectedPatient.personalId || ""} placeholder="მიუთითებელია" readOnly /></label>}
        <div className="adm-form-row">
          <label className="adm-field"><span>სერვისი</span><select value={serviceId} onChange={(e) => { setServiceId(e.target.value); }} required><option value="">აირჩიეთ</option>{services.map((x) => <option key={x._id} value={x._id}>{x.name}{x.price != null ? ` — ${x.price} ₾` : ""}</option>)}</select></label>
          <label className="adm-field"><span>სპეციალისტი</span><select value={selectedSpecialistId} onChange={(e) => { setSpecialistId(e.target.value); }} required><option value="">აირჩიეთ</option>{specialists.map((x) => <option key={x._id} value={x._id}>{x.name}{x.title ? ` — ${x.title}` : ""}</option>)}</select></label>
        </div>
        <label className="adm-field"><span>თარიღი</span><input type="date" min={booking && booking.date < nowInTbilisi().date ? booking.date : nowInTbilisi().date} value={date} onChange={(e) => { setDate(e.target.value); }} required /></label>

        <fieldset className="adm-slot-box" style={{ margin: 0, minWidth: 0 }}>
          <legend style={{ padding: "0 6px", fontWeight: 700 }}>ვიზიტის დრო</legend>
          {!booking && availabilityKey && (
            availability?.key === availabilityKey && availability.times.length
              ? <div role="group" aria-label="თავისუფალი დროები" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {availability.times.map((slot) => <button key={slot} type="button" className={`adm-btn ${time === slot ? "primary" : ""}`} aria-pressed={time === slot} onClick={() => setTime(slot)}>{slot}</button>)}
              </div>
              : <p className="adm-help" role="status">{availability?.key === availabilityKey ? availability.message : "თავისუფალი დროები იტვირთება…"}</p>
          )}
          <div className="adm-form-row">
            <label className="adm-field"><span>საიდან</span><input type="text" inputMode="numeric" placeholder="10:10" maxLength={5} value={time} onChange={(e) => setTime(e.target.value.replace(/[^0-9:]/g, ""))} onBlur={() => setTime(normalizeTime(time))} aria-describedby="booking-time-help" autoComplete="off" required /></label>
            <label className="adm-field"><span>სადამდე</span><input type="text" inputMode="numeric" placeholder="11:25" maxLength={5} value={endTime} onChange={(e) => setEndOverride(e.target.value.replace(/[^0-9:]/g, ""))} onBlur={() => { if (endOverride !== null) setEndOverride(endOverride ? normalizeTime(endOverride) : null); }} aria-describedby="booking-time-help" autoComplete="off" required /></label>
          </div>
          <p id="booking-time-help" className="adm-help">აკრიფეთ 24-საათიანი დრო: 10:10 ან 1010. დასრულების დრო შეგიძლიათ შეცვალოთ.</p>
          {/^([01]\d|2[0-3]):[0-5]\d$/.test(normalizeTime(time)) && /^([01]\d|2[0-3]):[0-5]\d$/.test(normalizeTime(endTime)) && normalizeTime(endTime) > normalizeTime(time) && <p role="status" style={{ marginBottom: 0 }}><strong>{normalizeTime(time)} – {normalizeTime(endTime)}</strong> · {timeToMinutes(normalizeTime(endTime)) - timeToMinutes(normalizeTime(time))} წუთი</p>}
        </fieldset>

        <label className="adm-field"><span>შენიშვნა</span><textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} placeholder="არასავალდებულო ინფორმაცია" /></label>
        {error && <div className="adm-notice error">{error}</div>}
        <div className="adm-modal-actions"><button type="button" className="adm-btn" onClick={onClose} disabled={busy}>გაუქმება</button><button className="adm-btn primary" disabled={busy}>{busy ? "ინახება..." : booking ? "ცვლილებების შენახვა" : "ჯავშნის შექმნა"}</button></div>
      </form>
    </section>
  </div>;
}

