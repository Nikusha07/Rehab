"use client";

import { FormEvent, useEffect, useState } from "react";

type User = { _id: string; username: string; role: "owner" | "reception" | "doctor"; isActive: boolean; lastLoginAt?: string | null; createdAt?: string };
const roleLabel: Record<string,string> = { owner: "Owner", reception: "Reception", doctor: "Doctor" };

export default function AdminUsersManager() {
  const [items, setItems] = useState<User[]>([]);
  const [primaryUsername, setPrimaryUsername] = useState("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<User["role"]>("reception");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch("/api/admin/users", { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { setItems(d.items || []); setPrimaryUsername(d.primaryUsername || "admin"); }
  }
  useEffect(() => { load(); }, []);

  async function create(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    const r = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password, role }) });
    const d = await r.json().catch(() => ({})); setBusy(false);
    if (!r.ok) return setMessage(d.message || "შექმნა ვერ მოხერხდა.");
    setUsername(""); setPassword(""); setRole("reception"); setMessage("მომხმარებელი შეიქმნა."); await load();
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setMessage("");
    const r = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMessage(d.message || "განახლება ვერ მოხერხდა.");
    await load();
  }

  async function resetPassword(user: User) {
    const value = prompt(`${user.username}-ის ახალი პაროლი (მინ. 8 სიმბოლო):`);
    if (!value) return;
    await patch(user._id, { password: value });
    setMessage("პაროლი განახლდა.");
  }

  async function remove(user: User) {
    if (!confirm(`წავშალოთ ${user.username}?`)) return;
    const r = await fetch(`/api/admin/users/${user._id}`, { method: "DELETE" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMessage(d.message || "წაშლა ვერ მოხერხდა.");
    await load();
  }

  return <>
    <div className="adm-page-head"><div><h1>Admin მომხმარებლები</h1><p>ცალკე ანგარიშები Reception-ისა და Doctor-ისთვის — პაროლები hash-ით ინახება.</p></div></div>
    <div className="adm-grid two">
      <section className="adm-card adm-card-pad">
        <h3 className="adm-section-title">ახალი მომხმარებელი</h3>
        <form className="adm-form" onSubmit={create}>
          <label className="adm-field"><span>Username</span><input value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={40} placeholder="reception1" required /></label>
          <label className="adm-field"><span>პაროლი</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} maxLength={128} required /></label>
          <label className="adm-field"><span>როლი</span><select value={role} onChange={(e) => setRole(e.target.value as User["role"])}><option value="reception">Reception — ჯავშნები და პაციენტები</option><option value="doctor">Doctor — ნახვა</option><option value="owner">Owner — სრული წვდომა</option></select></label>
          {message && <div className={`adm-notice ${message.includes("ვერ") ? "error" : ""}`}>{message}</div>}
          <button className="adm-btn primary" disabled={busy}>{busy ? "იქმნება..." : "მომხმარებლის შექმნა"}</button>
        </form>
      </section>
      <section className="adm-card adm-card-pad">
        <h3 className="adm-section-title">მთავარი Owner ანგარიში</h3>
        <div className="adm-list-item"><div><h3>{primaryUsername}</h3><p>Vercel Environment Variables-ით დაცული ძირითადი ანგარიში. მისი პაროლი აქ არ ჩანს.</p></div><span className="adm-badge">Owner</span></div>
        <p className="adm-muted-copy" style={{marginTop:12}}>Owner-ს აქვს სრული წვდომა. Reception მართავს ჯავშნებსა და პაციენტებს. Doctor-ს აქვს მხოლოდ სანახავი წვდომა კალენდარზე, პაციენტებსა და ანალიტიკაზე.</p>
      </section>
    </div>

    <section className="adm-card" style={{marginTop:18}}>
      <div className="adm-card-title"><div><h2>დამატებითი ანგარიშები</h2><p>{items.length} მომხმარებელი</p></div></div>
      {items.length === 0 ? <div className="adm-empty-v2">დამატებითი ანგარიში ჯერ არ შექმნილა.</div> : <div className="adm-list" style={{padding:14}}>{items.map((user) => <div className="adm-list-item" key={user._id}>
        <div><h3>{user.username}</h3><p>{roleLabel[user.role]} • {user.isActive ? "აქტიური" : "გამორთული"}{user.lastLoginAt ? ` • ბოლო შესვლა: ${new Date(user.lastLoginAt).toLocaleString("ka-GE")}` : " • ჯერ არ შესულა"}</p></div>
        <div className="adm-list-actions"><select className="adm-btn" value={user.role} onChange={(e) => patch(user._id, { role: e.target.value })}><option value="owner">Owner</option><option value="reception">Reception</option><option value="doctor">Doctor</option></select><button className="adm-btn" onClick={() => patch(user._id, { isActive: !user.isActive })}>{user.isActive ? "გამორთვა" : "ჩართვა"}</button><button className="adm-btn" onClick={() => resetPassword(user)}>პაროლი</button><button className="adm-btn danger" onClick={() => remove(user)}>წაშლა</button></div>
      </div>)}</div>}
    </section>
  </>;
}
