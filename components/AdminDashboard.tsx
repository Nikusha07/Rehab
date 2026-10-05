"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Booking = {
  _id: string; patientName: string; patientPhone: string; date: string; time: string; status: string; confirmationCode: string;
  serviceId?: { name?: string }; specialistId?: { name?: string; title?: string };
};

const labels: Record<string,string> = { confirmed: "დადასტურებული", completed: "დასრულებული", cancelled: "გაუქმებული", no_show: "არ გამოცხადდა" };

export default function AdminDashboard() {
  const router = useRouter();
  const [items, setItems] = useState<Booking[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/bookings", { cache: "no-store" });
    if (res.status === 401) { router.replace("/admin/login"); return; }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError("ჯავშნების ჩატვირთვა ვერ მოხერხდა."); else setItems(data.items || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function changeStatus(id: string, status: "cancelled" | "completed" | "no_show") {
    if (status === "cancelled" && !confirm("ნამდვილად გსურთ ჯავშნის გაუქმება? დრო კვლავ თავისუფალი გახდება.")) return;
    const res = await fetch(`/api/admin/bookings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (res.ok) setItems((current) => current.map((x) => x._id === id ? { ...x, status } : x));
    else setError("სტატუსის განახლება ვერ მოხერხდა.");
  }

  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); router.replace("/admin/login"); router.refresh(); }

  const today = new Date().toISOString().slice(0,10);
  const stats = useMemo(() => ({
    today: items.filter((x) => x.date === today && x.status === "confirmed").length,
    confirmed: items.filter((x) => x.status === "confirmed").length,
    completed: items.filter((x) => x.status === "completed").length,
    cancelled: items.filter((x) => x.status === "cancelled").length,
  }), [items, today]);
  const visible = filter === "all" ? items : items.filter((x) => x.status === filter);

  return (
    <>
      <div className="admin-heading"><div><h1>ჯავშნების მართვა</h1><p>ბოლო 250 ვიზიტი, სტატუსები და დღევანდელი დატვირთვა.</p></div><div className="admin-actions"><button onClick={load}>განახლება</button><button onClick={logout}>გასვლა</button></div></div>
      <div className="admin-stats">
        <div className="admin-stat"><small>დღეს დაგეგმილი</small><b>{stats.today}</b></div>
        <div className="admin-stat"><small>დადასტურებული</small><b>{stats.confirmed}</b></div>
        <div className="admin-stat"><small>დასრულებული</small><b>{stats.completed}</b></div>
        <div className="admin-stat"><small>გაუქმებული</small><b>{stats.cancelled}</b></div>
      </div>
      <section className="admin-panel">
        <div className="admin-toolbar">
          <div className="admin-filter">{[["all","ყველა"],["confirmed","დადასტურებული"],["completed","დასრულებული"],["cancelled","გაუქმებული"],["no_show","არ გამოცხადდა"]].map(([key,label]) => <button key={key} className={filter===key?"active":""} onClick={() => setFilter(key)}>{label}</button>)}</div>
        </div>
        {error && <div className="form-error" style={{margin:12}}>{error}</div>}
        {loading ? <div className="admin-empty">იტვირთება...</div> : visible.length === 0 ? <div className="admin-empty">ჯავშნები ვერ მოიძებნა.</div> : <>
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>პაციენტი</th><th>თარიღი / დრო</th><th>მომსახურება</th><th>სპეციალისტი</th><th>კოდი</th><th>სტატუსი</th><th>მოქმედება</th></tr></thead><tbody>{visible.map((x) => <tr key={x._id}><td><b>{x.patientName}</b><small>{x.patientPhone}</small></td><td><b>{x.date}</b><small>{x.time}</small></td><td>{x.serviceId?.name || "—"}</td><td>{x.specialistId?.name || "—"}</td><td><b>{x.confirmationCode}</b></td><td><span className={`status-badge status-${x.status}`}>{labels[x.status] || x.status}</span></td><td><div className="row-actions">{x.status === "confirmed" && <><button onClick={() => changeStatus(x._id,"completed")}>დასრულდა</button><button onClick={() => changeStatus(x._id,"no_show")}>არ მოვიდა</button><button className="danger" onClick={() => changeStatus(x._id,"cancelled")}>გაუქმება</button></>}</div></td></tr>)}</tbody></table></div>
          <div className="admin-mobile-list">{visible.map((x) => <article className="admin-mobile-card" key={x._id}><div className="admin-mobile-card-top"><div><h3>{x.patientName}</h3><p>{x.patientPhone}<br/>{x.date} • {x.time}<br/>{x.serviceId?.name || "—"} • {x.specialistId?.name || "—"}</p></div><span className={`status-badge status-${x.status}`}>{labels[x.status] || x.status}</span></div>{x.status === "confirmed" && <div className="row-actions"><button onClick={() => changeStatus(x._id,"completed")}>დასრულდა</button><button onClick={() => changeStatus(x._id,"no_show")}>არ მოვიდა</button><button className="danger" onClick={() => changeStatus(x._id,"cancelled")}>გაუქმება</button></div>}</article>)}</div>
        </>}
      </section>
    </>
  );
}
