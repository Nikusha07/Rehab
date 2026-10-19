"use client";
import { useState } from "react";

export default function PatientRegistration({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", personalId: "", address: "", email: "", notes: "" });
  async function register(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/patients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "რეგისტრაცია ვერ მოხერხდა.");
      setForm({ name: "", phone: "", personalId: "", address: "", email: "", notes: "" });
      setOpen(false); setMessage("პაციენტი დარეგისტრირდა. აირჩიეთ სიიდან ანგარიშის შესაქმნელად."); onCreated();
    } catch (error) { setMessage(error instanceof Error ? error.message : "კავშირის შეცდომა."); }
    finally { setBusy(false); }
  }
  return <section className="adm-card adm-card-pad" style={{ marginBottom: 20 }}>
    <button className="adm-btn primary" onClick={() => setOpen(!open)} aria-expanded={open}>პაციენტის რეგისტრაცია</button>
    {message && <p role="status">{message}</p>}
    {open && <form className="adm-form" onSubmit={register} style={{ marginTop: 16 }}>
      <div className="adm-form-row">{([['name','სახელი და გვარი'],['phone','ტელეფონი'],['personalId','პირადი ნომერი'],['address','მისამართი'],['email','ელფოსტა']] as const).map(([key,label]) => <label className="adm-field" key={key}><span>{label}</span><input value={form[key]} required={key === 'name' || key === 'phone'} type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'} maxLength={key === 'personalId' ? 11 : 300} pattern={key === 'personalId' ? '[0-9]{11}' : undefined} onChange={e => setForm({ ...form, [key]: e.target.value })}/></label>)}</div>
      <label className="adm-field"><span>შენიშვნა</span><textarea maxLength={3000} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}/></label>
      <div><button className="adm-btn primary" disabled={busy}>{busy ? 'ინახება...' : 'რეგისტრაცია'}</button></div>
    </form>}
  </section>;
}
