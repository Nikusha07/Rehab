"use client";

import { useEffect, useState } from "react";

type Integrations = { mongo: boolean; auth: boolean; gosms: boolean };
type GoSmsInfo = { configured: boolean; sender: string; balanceOk: boolean; balance: number | string | null };

const empty = {
  centerName: "",
  tagline: "",
  phone: "",
  address: "",
  mapQuery: "",
  hours: "",
  facebook: "",
  instagram: "",
  whatsapp: "",
};

export default function SettingsManager() {
  const [form, setForm] = useState<any>(empty);
  const [integrations, setIntegrations] = useState<Integrations>({ mongo: false, auth: false, gosms: false });
  const [gosms, setGoSms] = useState<GoSmsInfo>({ configured: false, sender: "", balanceOk: false, balance: null });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testingSms, setTestingSms] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");

  async function load() {
    const r = await fetch("/api/admin/settings", { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      setForm({ ...empty, ...d.item });
      setIntegrations(d.integrations || integrations);
      setGoSms(d.gosms || gosms);
    }
  }

  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const r = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) {
      setMessage(d.message || "შენახვა ვერ მოხერხდა.");
      return;
    }
    setForm({ ...empty, ...d.item });
    setMessage("პარამეტრები შენახულია. მთავარ საიტზე ცვლილება ავტომატურად გამოჩნდება.");
  }

  async function sendTestSms() {
    const phone = testPhone.replace(/\D/g, "");
    if (!/^5\d{8}$/.test(phone)) {
      setSmsMessage("შეიყვანეთ 9-ციფრიანი ქართული მობილურის ნომერი.");
      return;
    }

    setTestingSms(true);
    setSmsMessage("");
    const r = await fetch("/api/admin/sms/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const d = await r.json().catch(() => ({}));
    setTestingSms(false);

    if (!r.ok) {
      setSmsMessage(d.message || "სატესტო SMS ვერ გაიგზავნა.");
      return;
    }

    setSmsMessage(`SMS გაიგზავნა წარმატებით${d.balance !== null && d.balance !== undefined ? ` • დარჩენილი ბალანსი: ${d.balance}` : ""}`);
    await load();
  }

  return <>
    <div className="adm-page-head">
      <div><h1>პარამეტრები</h1><p>ცენტრის საჯარო ინფორმაცია, ლოკაცია, სოციალური ბმულები, backup და ინტეგრაციების სტატუსი.</p></div>
      <div className="adm-page-actions"><a className="adm-btn" href="/api/admin/backup">JSON Backup</a></div>
    </div>

    <div className="adm-settings-layout">
      <section className="adm-card adm-card-pad">
        <div className="adm-card-title adm-card-title-flat"><div><h2>ცენტრის ინფორმაცია</h2><p>ეს მონაცემები გამოჩნდება მთავარ საიტზე.</p></div></div>
        <form className="adm-form" onSubmit={save}>
          <div className="adm-form-row">
            <div className="adm-field"><span>ცენტრის სახელი</span><input required value={form.centerName} onChange={e => setForm({ ...form, centerName: e.target.value })} /></div>
            <div className="adm-field"><span>ტელეფონი</span><input required inputMode="numeric" maxLength={9} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 9) })} /></div>
          </div>
          <div className="adm-field"><span>მოკლე აღწერა / tagline</span><input required value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} /></div>
          <div className="adm-form-row">
            <div className="adm-field"><span>მისამართის ტექსტი</span><input required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div className="adm-field"><span>Google Maps query / კოორდინატები</span><input required placeholder="42.33825, 43.40750" value={form.mapQuery} onChange={e => setForm({ ...form, mapQuery: e.target.value })} /></div>
          </div>
          <div className="adm-field"><span>სამუშაო საათების ტექსტი</span><input required value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} /></div>
          <div className="adm-form-row">
            <div className="adm-field"><span>Facebook URL</span><input value={form.facebook} onChange={e => setForm({ ...form, facebook: e.target.value })} /></div>
            <div className="adm-field"><span>Instagram URL</span><input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} /></div>
          </div>
          <div className="adm-field"><span>WhatsApp ნომერი ან URL</span><input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} /></div>
          {message && <div className={`adm-notice ${message.includes("ვერ") ? "error" : ""}`}>{message}</div>}
          <button className="adm-btn primary" disabled={busy}>{busy ? "ინახება..." : "პარამეტრების შენახვა"}</button>
        </form>
      </section>

      <div className="adm-grid adm-settings-side">
        <section className="adm-card adm-card-pad">
          <h3 className="adm-section-title">ინტეგრაციები</h3>
          <div className="adm-list">
            <div className="adm-list-item"><div><h3>MongoDB Atlas</h3><p>პაციენტები, ჯავშნები და ადმინისტრაციული მონაცემები</p></div><span className={`adm-badge ${integrations.mongo ? "" : "danger"}`}>{integrations.mongo ? "აქტიური" : "არ არის"}</span></div>
            <div className="adm-list-item"><div><h3>Admin Auth</h3><p>JWT ხელმოწერა და დაცული admin session</p></div><span className={`adm-badge ${integrations.auth ? "" : "danger"}`}>{integrations.auth ? "აქტიური" : "არ არის"}</span></div>
            <div className="adm-list-item"><div><h3>GoSMS</h3><p>დადასტურება, ცვლილება, გაუქმება და reminder</p></div><span className={`adm-badge ${gosms.configured && gosms.balanceOk ? "" : "warn"}`}>{gosms.configured && gosms.balanceOk ? "აქტიური" : gosms.configured ? "შემოწმება" : "არ არის"}</span></div>
          </div>

          <div className="adm-notice" style={{ marginTop: 14 }}>
            <b>Sender:</b> {gosms.sender || "—"}<br />
            <b>ბალანსი:</b> {gosms.balanceOk ? (gosms.balance ?? "0") : "ვერ შემოწმდა"}
          </div>

          <div className="adm-field" style={{ marginTop: 14 }}>
            <span>სატესტო SMS ნომერი</span>
            <input inputMode="numeric" placeholder="5XXXXXXXX" maxLength={9} value={testPhone} onChange={e => setTestPhone(e.target.value.replace(/\D/g, "").slice(0, 9))} />
          </div>
          <button type="button" className="adm-btn primary" disabled={testingSms || !gosms.configured} onClick={sendTestSms}>{testingSms ? "იგზავნება..." : "სატესტო SMS-ის გაგზავნა"}</button>
          {smsMessage && <div className={`adm-notice ${smsMessage.includes("ვერ") || smsMessage.includes("შეიყვანეთ") || smsMessage.includes("შეცდომა") ? "error" : ""}`} style={{ marginTop: 10 }}>{smsMessage}</div>}
        </section>

        <section className="adm-card adm-card-pad">
          <h3 className="adm-section-title">Backup & PWA</h3>
          <p className="adm-muted-copy">JSON Backup ინახავს ჯავშნებს, პაციენტებს, სერვისებს, სპეციალისტებს, გრაფიკს, SMS და Audit log-ს ერთ ფაილში.</p>
          <a className="adm-btn" href="/api/admin/backup" style={{ marginTop: 12 }}>Backup-ის ჩამოტვირთვა</a>
          <p className="adm-muted-copy" style={{ marginTop: 14 }}>საიტი უკვე PWA-ა. iPhone-ზე Safari → Share → Add to Home Screen და Admin თითქმის აპივით გაიხსნება.</p>
        </section>

        <section className="adm-card adm-card-pad">
          <h3 className="adm-section-title">უსაფრთხოება</h3>
          <p className="adm-muted-copy">MongoDB პაროლი, AUTH_SECRET, Admin password და GoSMS API Key მხოლოდ Vercel Environment Variables-ში ინახება. ისინი ამ გვერდზე შეგნებულად არ ჩანს.</p>
        </section>
      </div>
    </div>
  </>;
}
