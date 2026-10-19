"use client";
import { useEffect, useState } from "react";
import { centerDefaults, InvoiceInput, invoiceSchema, invoiceTotal, lineTotal, money } from "@/lib/invoice";
import { nowInTbilisi } from "@/lib/time";
import "./patient-invoices.css";

type Patient = { _id: string; name: string; personalId?: string; phone: string; address?: string };
type Saved = InvoiceInput & { _id: string; revision: number; patient: Patient; totalCents: number };
type Service = { _id: string; name: string; price?: number };
const fresh = (): InvoiceInput => ({ number: "", date: nowInTbilisi().date, center: { ...centerDefaults }, items: [{ description: "", unitPrice: 0, quantity: 1 }] });

export default function PatientInvoices({ patient, canWrite }: { patient: Patient; canWrite: boolean }) {
  const [invoices, setInvoices] = useState<Saved[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState<InvoiceInput>(fresh);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [dirty, setDirty] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);
  const hasUnsavedChanges = dirty && Boolean(form.number || form.items.some(item => item.description));
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasUnsavedChanges]);
  const endpoint = `/api/admin/patients/${patient._id}/invoices`;
  useEffect(() => {
    const controller = new AbortController();
    fetch(endpoint, { cache: "no-store", signal: controller.signal }).then(async r => { if (!r.ok) throw new Error(); return r.json(); }).then(d => { setInvoices(d.items); setLoaded(true); }).catch(e => { if (e.name !== 'AbortError') setMessage('ანგარიშების ჩატვირთვა ვერ მოხერხდა. ხელახლა აირჩიეთ პაციენტი.'); });
    fetch('/api/services', { signal: controller.signal }).then(r => r.json()).then(d => setServices(d.items || [])).catch(() => undefined);
    return () => controller.abort();
  }, [endpoint]);
  function change(next: InvoiceInput) { setForm(next); setDirty(true); setMessage(""); }
  function open(invoice: Saved | null) {
    if (dirty && (form.number || form.items.some(i => i.description)) && !window.confirm('შეუნახავი ცვლილებები დაიკარგება. გაგრძელდეს?')) return;
    setSaved(invoice); setForm(invoice || fresh()); setDirty(!invoice); setMessage("");
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!invoiceSchema.safeParse(form).success) { setMessage('შეამოწმეთ ყველა ველი, ფასი და რაოდენობა.'); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch(endpoint, { method: saved ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, ...(saved ? { _id: saved._id, revision: saved.revision } : {}) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || 'შენახვა ვერ მოხერხდა.');
      setSaved(data.invoice); setForm(data.invoice); setDirty(false);
      setInvoices(current => [data.invoice, ...current.filter(i => i._id !== data.invoice._id)]);
      setMessage('ანგარიში შენახულია. შეგიძლიათ დაბეჭდოთ ან შეინახოთ PDF.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'კავშირის შეცდომა.'); }
    finally { setBusy(false); }
  }
  const printedPatient = saved?.patient || patient;
  return <section className="patient-invoices">
    <div className="adm-card-title invoice-controls"><h3>ანგარიშ-ფაქტურები / კალკულაცია</h3></div>
    <div className="adm-card-pad invoice-controls">
      <label className="adm-field"><span>შენახული ანგარიშები</span><select disabled={busy || !loaded} value={saved?._id || ''} onChange={e => open(invoices.find(i => i._id === e.target.value) || null)}><option value="">ახალი ანგარიში</option>{invoices.map(i => <option key={i._id} value={i._id}>N{i.number} — {i.date} — {money(i.totalCents)} ₾</option>)}</select></label>
      <form className="adm-form" onSubmit={save}>
        <fieldset disabled={!canWrite || busy || !loaded} className="invoice-fields">
          <div className="adm-form-row"><label className="adm-field"><span>ანგარიშის ნომერი</span><input required maxLength={40} value={form.number} onChange={e => change({ ...form, number: e.target.value })}/></label><label className="adm-field"><span>თარიღი</span><input required type="date" value={form.date} onChange={e => change({ ...form, date: e.target.value })}/></label></div>
          <details><summary>ცენტრისა და ბანკის რეკვიზიტები</summary><div className="adm-form-row">{(Object.keys(centerDefaults) as (keyof typeof centerDefaults)[]).map(key => <label className="adm-field" key={key}><span>{{name:'ცენტრის დასახელება',taxId:'საიდენტიფიკაციო კოდი',address:'ცენტრის მისამართი',bank:'ბანკი',bankCode:'ბანკის კოდი',account:'ანგარიშის ნომერი',director:'დირექტორი'}[key]}</span><input required maxLength={300} value={form.center[key]} onChange={e => change({ ...form, center: { ...form.center, [key]: e.target.value } })}/></label>)}</div></details>
          {form.items.map((item, index) => <div className="invoice-procedure" key={index}>
            <label className="adm-field"><span>დანიშნულება {index + 1}</span><input required maxLength={300} list={`procedures-${patient._id}`} value={item.description} onChange={e => { const service = services.find(s => s.name === e.target.value); change({ ...form, items: form.items.map((row, i) => i === index ? { ...row, description: e.target.value, unitPrice: service?.price ?? row.unitPrice } : row) }); }}/></label>
            <label className="adm-field"><span>ფასი (₾)</span><input required type="number" min="0" max="1000000" step="0.01" value={Number.isNaN(item.unitPrice) ? '' : item.unitPrice} onChange={e => change({ ...form, items: form.items.map((row,i) => i === index ? { ...row, unitPrice: e.target.valueAsNumber } : row) })}/></label>
            <label className="adm-field"><span>რაოდენობა</span><input required type="number" min="1" max="10000" step="1" value={Number.isNaN(item.quantity) ? '' : item.quantity} onChange={e => change({ ...form, items: form.items.map((row,i) => i === index ? { ...row, quantity: e.target.valueAsNumber } : row) })}/></label>
            <strong>{Number.isFinite(lineTotal(item)) ? money(lineTotal(item)) : '—'} ₾</strong><button className="adm-btn" type="button" aria-label={`დანიშნულება ${index + 1} წაშლა`} disabled={form.items.length === 1} onClick={() => change({ ...form, items: form.items.filter((_,i) => i !== index) })}>წაშლა</button>
          </div>)}
          <datalist id={`procedures-${patient._id}`}>{services.map(s => <option key={s._id} value={s.name}/>)}</datalist>
          <button className="adm-btn" type="button" disabled={form.items.length >= 100} onClick={() => change({ ...form, items: [...form.items, { description: '', unitPrice: 0, quantity: 1 }] })}>+ დანიშნულების დამატება</button>
          <p><strong>სულ: {Number.isFinite(invoiceTotal(form.items)) ? money(invoiceTotal(form.items)) : '—'} ₾</strong></p>
          <button className="adm-btn primary" disabled={!dirty}>{busy ? 'ინახება...' : 'ანგარიშის შენახვა'}</button>
        </fieldset>
      </form>
      {message && <p role="status">{message}</p>}
      <button className="adm-btn" disabled={!saved || dirty || busy} onClick={() => window.print()}>ბეჭდვა / PDF</button>
      <p className="invoice-help">ბეჭდვამდე შეინახეთ ანგარიში. PDF-ისთვის ბეჭდვის ფანჯარაში აირჩიეთ „Save as PDF“, A4 და გამორთეთ გვერდის სათაურები/ბოლოსართები.</p>
    </div>
    <div className="invoice-preview-scroll"><article className="invoice-paper">
      <header><h1>ანგარიშ-ფაქტურა N{form.number || '—'}</h1><h2>{form.center.name}</h2></header>
      <div className="invoice-parties"><div><b>მომწოდებელი:</b><br/>ს/კ: {form.center.taxId}<br/>მისამართი: {form.center.address}<br/>თარიღი: {form.date.split('-').reverse().join('/')}</div><div><b>მიმღები (პაციენტი):</b><br/>სახელი, გვარი: {printedPatient.name}<br/>პირადი ნომერი: {printedPatient.personalId || '________________'}{printedPatient.address && <><br/>მისამართი: {printedPatient.address}</>}</div></div>
      <table><thead><tr><th>დანიშნულება</th><th>ერთეულის ღირებულება (ლარი)</th><th>რაოდენობა</th><th>სულ (ლარი)</th></tr></thead><tbody>{form.items.map((item,index) => <tr key={index}><td>{item.description || '—'}</td><td>{Number.isFinite(item.unitPrice) ? money(Math.round(item.unitPrice * 100)) : '—'}</td><td>{Number.isFinite(item.quantity) ? item.quantity : '—'}</td><td>{Number.isFinite(lineTotal(item)) ? money(lineTotal(item)) : '—'}</td></tr>)}</tbody></table>
      <div className="invoice-total"><b>სულ ჯამი:</b><strong>{Number.isFinite(invoiceTotal(form.items)) ? money(invoiceTotal(form.items)) : '—'} ₾</strong></div>
      <section className="invoice-bank"><h2>საბანკო რეკვიზიტები:</h2><div>ბანკი: {form.center.bank}</div><div>ბანკის კოდი: {form.center.bankCode}</div><div>ანგარიშის ნომერი: {form.center.account}</div><div>საიდენტიფიკაციო კოდი (ს/კ): {form.center.taxId}</div></section>
      <footer><div><b>დირექტორი:</b> <span className="invoice-signature"/> / {form.center.director} /</div><div className="invoice-stamp">ბეჭდის ადგილი</div></footer>
    </article></div>
  </section>;
}
