"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BookingEditor, { EditableBooking } from "@/components/admin/BookingEditor";

type Booking = EditableBooking & { confirmationCode: string; source?: "web" | "admin" };
const labels: Record<string, string> = { confirmed: "დადასტურებული", completed: "დასრულებული", cancelled: "გაუქმებული", no_show: "არ გამოცხადდა" };
function tbilisiToday() { const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tbilisi", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()); const get = (t: string) => parts.find(x => x.type === t)?.value || ""; return `${get("year")}-${get("month")}-${get("day")}`; }
function addDays(date: string, days: number) { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); }
function csvCell(value: unknown) { return `"${String(value ?? "").replace(/"/g, '""')}"`; }

export default function AdminDashboard() {
  const router = useRouter();
  const [items, setItems] = useState<Booking[]>([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);

  async function load() {
    setLoading(true); setError("");
    const res = await fetch("/api/admin/bookings", { cache: "no-store" });
    if (res.status === 401) { router.replace("/admin/login"); return; }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError("ჯავშნების ჩატვირთვა ვერ მოხერხდა."); else setItems(data.items || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function changeStatus(id: string, status: "cancelled" | "completed" | "no_show") {
    if (status === "cancelled" && !confirm("ნამდვილად გსურთ ჯავშნის გაუქმება? დრო კვლავ თავისუფალი გახდება და GoSMS-ის ჩართვის შემთხვევაში პაციენტიც მიიღებს შეტყობინებას.")) return;
    const res = await fetch(`/api/admin/bookings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setItems(current => current.map(x => x._id === id ? { ...x, ...(data.item || {}), status } : x)); else setError(data.message || "სტატუსის განახლება ვერ მოხერხდა.");
  }

  const today = tbilisiToday();
  const weekEnd = addDays(today, 6);
  const stats = useMemo(() => {
    const finished = items.filter(x => x.status === "completed" || x.status === "no_show");
    const noShows = items.filter(x => x.status === "no_show").length;
    return {
      today: items.filter(x => x.date === today && x.status === "confirmed").length,
      week: items.filter(x => x.date >= today && x.date <= weekEnd && x.status === "confirmed").length,
      confirmed: items.filter(x => x.status === "confirmed").length,
      noShowRate: finished.length ? Math.round(noShows / finished.length * 100) : 0,
    };
  }, [items, today, weekEnd]);

  const visible = useMemo(() => items.filter(x => {
    if (filter !== "all" && x.status !== filter) return false;
    if (date && x.date !== date) return false;
    const q = query.trim().toLowerCase();
    if (q && !`${x.patientName} ${x.patientPhone} ${x.confirmationCode} ${x.serviceId?.name || ""} ${x.specialistId?.name || ""}`.toLowerCase().includes(q)) return false;
    return true;
  }), [items, filter, date, query]);

  function openCreate() { setEditing(null); setEditorOpen(true); }
  function openEdit(item: Booking) { setEditing(item); setEditorOpen(true); }

  function exportCsv() {
    const header = ["პაციენტი", "ტელეფონი", "თარიღი", "დრო", "სერვისი", "სპეციალისტი", "კოდი", "სტატუსი", "წყარო", "შენიშვნა"];
    const rows = visible.map(x => [x.patientName, x.patientPhone, x.date, x.time, x.serviceId?.name || "", x.specialistId?.name || "", x.confirmationCode, labels[x.status] || x.status, x.source === "admin" ? "Admin" : "Web", x.notes || ""]);
    const csv = "\uFEFF" + [header, ...rows].map(row => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `bookings-${today}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  function printToday() {
    const rows = items.filter(x => x.date === today && x.status === "confirmed").sort((a, b) => a.time.localeCompare(b.time));
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`<html><head><title>დღის სია ${today}</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#173d42}h1{margin:0 0 6px}p{color:#667;margin:0 0 22px}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left}th{background:#eef6f3}@media print{button{display:none}}</style></head><body><h1>დღევანდელი ვიზიტები</h1><p>${today} • ${rows.length} ვიზიტი</p><table><thead><tr><th>დრო</th><th>პაციენტი</th><th>ტელეფონი</th><th>სერვისი</th><th>სპეციალისტი</th></tr></thead><tbody>${rows.map(x => `<tr><td>${x.time}</td><td>${x.patientName}</td><td>${x.patientPhone}</td><td>${x.serviceId?.name || "—"}</td><td>${x.specialistId?.name || "—"}</td></tr>`).join("")}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  }

  return <>
    <div className="adm-page-head">
      <div><h1>ჯავშნების მართვა</h1><p>ჯავშნები, სტატუსები, პაციენტები, export და დღევანდელი დატვირთვა ერთ სივრცეში.</p></div>
      <div className="adm-page-actions"><button className="adm-btn primary" onClick={openCreate}>+ ახალი ჯავშანი</button><button className="adm-btn" onClick={printToday}>დღის სია</button><button className="adm-btn" onClick={exportCsv}>CSV Export</button><a className="adm-btn" href="/admin/calendar">კალენდარი</a></div>
    </div>

    <div className="adm-grid four">
      <div className="adm-card adm-stat-v2"><small>დღეს დაგეგმილი</small><b>{stats.today}</b><span>{today}</span></div>
      <div className="adm-card adm-stat-v2"><small>შემდეგი 7 დღე</small><b>{stats.week}</b><span>დადასტურებული ვიზიტები</span></div>
      <div className="adm-card adm-stat-v2"><small>აქტიური ჯავშნები</small><b>{stats.confirmed}</b><span>მომავალი და დაგეგმილი</span></div>
      <div className="adm-card adm-stat-v2"><small>No-show მაჩვენებელი</small><b>{stats.noShowRate}%</b><span>დასრულებულ/არ მოსულ ვიზიტებზე</span></div>
    </div>

    <section className="adm-card" style={{ marginTop: 18 }}>
      <div className="adm-toolbar-v2"><div className="adm-search"><input placeholder="პაციენტი, ტელეფონი, კოდი, სერვისი..." value={query} onChange={e => setQuery(e.target.value)} /></div><input className="adm-btn" style={{ minWidth: 145 }} type="date" value={date} onChange={e => setDate(e.target.value)} />{date && <button className="adm-btn" onClick={() => setDate("")}>თარიღის გასუფთავება</button>}<button className="adm-btn" onClick={load}>განახლება</button></div>
      <div className="adm-toolbar-v2" style={{ borderTop: "1px solid var(--adm-border)" }}><div className="admin-filter">{[["all", "ყველა"], ["confirmed", "დადასტურებული"], ["completed", "დასრულებული"], ["cancelled", "გაუქმებული"], ["no_show", "არ გამოცხადდა"]].map(([key, label]) => <button key={key} className={filter === key ? "active" : ""} onClick={() => setFilter(key)}>{label}</button>)}</div><span className="adm-count">ნაპოვნია: {visible.length}</span></div>
      {error && <div className="adm-notice error" style={{ margin: 14 }}>{error}</div>}
      {loading ? <div className="adm-empty-v2">იტვირთება...</div> : visible.length === 0 ? <div className="adm-empty-v2">ჯავშნები ვერ მოიძებნა.</div> : <>
        <div className="adm-table-wrap adm-bookings-desktop"><table className="adm-table-v2"><thead><tr><th>პაციენტი</th><th>თარიღი / დრო</th><th>მომსახურება</th><th>სპეციალისტი</th><th>კოდი</th><th>სტატუსი</th><th>მოქმედება</th></tr></thead><tbody>{visible.map(x => <tr key={x._id}><td><strong>{x.patientName}</strong><small>{x.patientPhone}{x.source === "admin" ? " • Admin" : " • Web"}</small></td><td><strong>{x.date}</strong><small>{x.time}</small></td><td>{x.serviceId?.name || "—"}</td><td>{x.specialistId?.name || "—"}</td><td><strong>{x.confirmationCode}</strong></td><td><span className={`adm-badge ${x.status === "cancelled" ? "danger" : x.status === "no_show" ? "warn" : ""}`}>{labels[x.status] || x.status}</span></td><td><div className="adm-list-actions"><button className="adm-btn" onClick={() => openEdit(x)}>რედაქტირება</button>{x.status === "confirmed" && <><button className="adm-btn" onClick={() => changeStatus(x._id, "completed")}>დასრულდა</button><button className="adm-btn" onClick={() => changeStatus(x._id, "no_show")}>არ მოვიდა</button><button className="adm-btn danger" onClick={() => changeStatus(x._id, "cancelled")}>გაუქმება</button></>}</div></td></tr>)}</tbody></table></div>

        <div className="adm-bookings-mobile">{visible.map(x => <article className="adm-booking-card" key={x._id}><div className="adm-booking-card-head"><div><h3>{x.patientName}</h3><p>{x.patientPhone}</p></div><span className={`adm-badge ${x.status === "cancelled" ? "danger" : x.status === "no_show" ? "warn" : ""}`}>{labels[x.status] || x.status}</span></div><div className="adm-booking-meta"><div><small>თარიღი</small><b>{x.date} • {x.time}</b></div><div><small>სერვისი</small><b>{x.serviceId?.name || "—"}</b></div><div><small>სპეციალისტი</small><b>{x.specialistId?.name || "—"}</b></div><div><small>კოდი</small><b>{x.confirmationCode}</b></div></div>{x.notes && <p className="adm-booking-note">{x.notes}</p>}<div className="adm-booking-actions"><button className="adm-btn" onClick={() => openEdit(x)}>რედაქტირება</button>{x.status === "confirmed" && <><button className="adm-btn" onClick={() => changeStatus(x._id, "completed")}>დასრულდა</button><button className="adm-btn" onClick={() => changeStatus(x._id, "no_show")}>არ მოვიდა</button><button className="adm-btn danger" onClick={() => changeStatus(x._id, "cancelled")}>გაუქმება</button></>}</div></article>)}</div>
      </>}
    </section>

    <BookingEditor open={editorOpen} booking={editing} onClose={() => setEditorOpen(false)} onSaved={load} />
  </>;
}
