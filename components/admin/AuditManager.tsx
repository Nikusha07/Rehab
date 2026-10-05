"use client";

import { useEffect, useMemo, useState } from "react";

type AuditItem = {
  _id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  metadata?: unknown;
  createdAt: string;
};

function label(action: string) {
  if (action === "booking.create") return "ჯავშანი შეიქმნა";
  if (action === "booking.edit") return "ჯავშანი შეიცვალა";
  if (action.includes("cancelled")) return "ჯავშანი გაუქმდა";
  if (action.includes("completed")) return "ვიზიტი დასრულდა";
  if (action.includes("no_show")) return "პაციენტი არ გამოცხადდა";
  return action;
}

export default function AuditManager() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/audit", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (response.ok) setItems(data.items || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => `${item.actor} ${item.action} ${item.entity} ${item.summary}`.toLowerCase().includes(q));
  }, [items, query]);

  return <>
    <div className="adm-page-head">
      <div><h1>Audit log</h1><p>ადმინისტრაციაში შესრულებული მნიშვნელოვანი მოქმედებების ისტორია.</p></div>
      <div className="adm-page-actions"><button className="adm-btn" onClick={load}>განახლება</button></div>
    </div>

    <section className="adm-card">
      <div className="adm-toolbar-v2">
        <div className="adm-search"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ძებნა მოქმედებით ან ადმინისტრატორით" /></div>
        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--adm-muted)" }}>ჩანაწერი: {visible.length}</span>
      </div>
      {loading ? <div className="adm-empty-v2">იტვირთება...</div> : visible.length === 0 ? <div className="adm-empty-v2">ჩანაწერები ჯერ არ არის.</div> :
        <div className="adm-list" style={{ padding: 14 }}>
          {visible.map((item) => <div className="adm-list-item" key={item._id}>
            <div>
              <h3>{label(item.action)}</h3>
              <p>{item.summary}<br />{new Date(item.createdAt).toLocaleString("ka-GE")} • {item.actor}</p>
            </div>
            <span className="adm-badge">{item.entity}</span>
          </div>)}
        </div>
      }
    </section>
  </>;
}
