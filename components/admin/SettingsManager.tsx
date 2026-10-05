"use client";

import { useEffect,useState } from "react";

type Integrations={mongo:boolean;auth:boolean;gosms:boolean};
const empty={centerName:"",tagline:"",phone:"",address:"",mapQuery:"",hours:"",facebook:"",instagram:"",whatsapp:""};
export default function SettingsManager(){
 const [form,setForm]=useState<any>(empty);const [integrations,setIntegrations]=useState<Integrations>({mongo:false,auth:false,gosms:false});const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 async function load(){const r=await fetch("/api/admin/settings",{cache:"no-store"});const d=await r.json();if(r.ok){setForm({...empty,...d.item});setIntegrations(d.integrations||integrations)}}
 useEffect(()=>{load()},[]);
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage("");const r=await fetch("/api/admin/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const d=await r.json().catch(()=>({}));setBusy(false);if(!r.ok){setMessage(d.message||"შენახვა ვერ მოხერხდა.");return}setForm({...empty,...d.item});setMessage("პარამეტრები შენახულია. მთავარ საიტზე ცვლილება ავტომატურად გამოჩნდება.")}
 return <>
  <div className="adm-page-head"><div><h1>პარამეტრები</h1><p>ცენტრის საჯარო ინფორმაცია, ლოკაცია, სოციალური ბმულები და სისტემის ინტეგრაციების სტატუსი.</p></div></div>
  <div className="adm-settings-layout">
   <section className="adm-card adm-card-pad"><div className="adm-card-title adm-card-title-flat"><div><h2>ცენტრის ინფორმაცია</h2><p>ეს მონაცემები გამოჩნდება მთავარ საიტზე.</p></div></div><form className="adm-form" onSubmit={save}>
    <div className="adm-form-row"><div className="adm-field"><span>ცენტრის სახელი</span><input required value={form.centerName} onChange={e=>setForm({...form,centerName:e.target.value})}/></div><div className="adm-field"><span>ტელეფონი</span><input required inputMode="numeric" maxLength={9} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value.replace(/\D/g,"").slice(0,9)})}/></div></div>
    <div className="adm-field"><span>მოკლე აღწერა / tagline</span><input required value={form.tagline} onChange={e=>setForm({...form,tagline:e.target.value})}/></div>
    <div className="adm-form-row"><div className="adm-field"><span>მისამართის ტექსტი</span><input required value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></div><div className="adm-field"><span>Google Maps query / კოორდინატები</span><input required placeholder="42.33825, 43.40750" value={form.mapQuery} onChange={e=>setForm({...form,mapQuery:e.target.value})}/></div></div>
    <div className="adm-field"><span>სამუშაო საათების ტექსტი</span><input required value={form.hours} onChange={e=>setForm({...form,hours:e.target.value})}/></div>
    <div className="adm-form-row"><div className="adm-field"><span>Facebook URL</span><input value={form.facebook} onChange={e=>setForm({...form,facebook:e.target.value})}/></div><div className="adm-field"><span>Instagram URL</span><input value={form.instagram} onChange={e=>setForm({...form,instagram:e.target.value})}/></div></div>
    <div className="adm-field"><span>WhatsApp ნომერი ან URL</span><input value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})}/></div>
    {message&&<div className={`adm-notice ${message.includes("ვერ")?"error":""}`}>{message}</div>}
    <button className="adm-btn primary" disabled={busy}>{busy?"ინახება...":"პარამეტრების შენახვა"}</button>
   </form></section>
   <div className="adm-grid adm-settings-side">
    <section className="adm-card adm-card-pad"><h3 className="adm-section-title">ინტეგრაციები</h3><div className="adm-list"><div className="adm-list-item"><div><h3>MongoDB Atlas</h3><p>პაციენტები, ჯავშნები და ადმინისტრაციული მონაცემები</p></div><span className={`adm-badge ${integrations.mongo?"":"danger"}`}>{integrations.mongo?"აქტიური":"არ არის"}</span></div><div className="adm-list-item"><div><h3>Admin Auth</h3><p>JWT ხელმოწერა და დაცული admin session</p></div><span className={`adm-badge ${integrations.auth?"":"danger"}`}>{integrations.auth?"აქტიური":"არ არის"}</span></div><div className="adm-list-item"><div><h3>GoSMS</h3><p>ჯავშნის SMS დადასტურებები</p></div><span className={`adm-badge ${integrations.gosms?"":"warn"}`}>{integrations.gosms?"აქტიური":"არ არის"}</span></div></div></section>
    <section className="adm-card adm-card-pad"><h3 className="adm-section-title">უსაფრთხოება</h3><p className="adm-muted-copy">MongoDB პაროლი, AUTH_SECRET და Admin password მხოლოდ Vercel Environment Variables-ში ინახება. ისინი ამ გვერდზე შეგნებულად არ ჩანს და MongoDB-ში არ ინახება.</p></section>
   </div>
  </div>
 </>
}
