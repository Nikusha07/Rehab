"use client";

import { useEffect, useState } from "react";

type Service = { _id:string; name:string; description:string; durationMinutes:number; price:number|null; isActive:boolean; sortOrder:number };
const empty = { name:"", description:"", durationMinutes:30, price:"", isActive:true, sortOrder:0 };

export default function ServicesManager() {
  const [items,setItems] = useState<Service[]>([]);
  const [form,setForm] = useState<any>(empty);
  const [editing,setEditing] = useState<string|null>(null);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");

  async function load(){ const r=await fetch("/api/admin/services",{cache:"no-store"}); const d=await r.json(); if(r.ok)setItems(d.items||[]); }
  useEffect(()=>{load();},[]);

  function edit(x:Service){ setEditing(x._id); setForm({ ...x, price:x.price ?? "" }); window.scrollTo({top:0,behavior:"smooth"}); }
  function reset(){ setEditing(null); setForm(empty); setMessage(""); }

  async function submit(e:React.FormEvent){
    e.preventDefault(); setBusy(true); setMessage("");
    const payload={...form, durationMinutes:Number(form.durationMinutes), sortOrder:Number(form.sortOrder), price:form.price===""?null:Number(form.price)};
    const r=await fetch(editing?`/api/admin/services/${editing}`:"/api/admin/services",{method:editing?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const d=await r.json().catch(()=>({})); setBusy(false);
    if(!r.ok){setMessage(d.message||"შენახვა ვერ მოხერხდა.");return;} setMessage("შენახულია."); reset(); await load();
  }

  async function toggle(x:Service){ await fetch(`/api/admin/services/${x._id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({isActive:!x.isActive})}); await load(); }
  async function remove(x:Service){ if(!confirm(`წავშალოთ „${x.name}“?`))return; await fetch(`/api/admin/services/${x._id}`,{method:"DELETE"}); await load(); }

  return <>
    <div className="adm-page-head"><div><h1>სერვისები</h1><p>მართეთ მომსახურებები, ვიზიტის ხანგრძლივობა, ფასი და ონლაინ ჩაწერაში ხილვადობა.</p></div></div>
    <div className="adm-grid two">
      <section className="adm-card adm-card-pad">
        <div className="adm-card-title" style={{padding:0,paddingBottom:16,marginBottom:18}}><div><h2>{editing?"სერვისის რედაქტირება":"ახალი სერვისი"}</h2><p>ცვლილება ავტომატურად აისახება booking ფორმაში.</p></div></div>
        <form className="adm-form" onSubmit={submit}>
          <div className="adm-field"><span>დასახელება</span><input required minLength={2} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div className="adm-field"><span>აღწერა</span><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
          <div className="adm-form-row three">
            <div className="adm-field"><span>ხანგრძლივობა (წთ)</span><select value={form.durationMinutes} onChange={e=>setForm({...form,durationMinutes:e.target.value})}><option>30</option><option>60</option><option>90</option><option>120</option></select></div>
            <div className="adm-field"><span>ფასი (₾)</span><input type="number" min="0" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></div>
            <div className="adm-field"><span>რიგითობა</span><input type="number" min="0" value={form.sortOrder} onChange={e=>setForm({...form,sortOrder:e.target.value})}/></div>
          </div>
          <label className="adm-check"><input type="checkbox" checked={form.isActive} onChange={e=>setForm({...form,isActive:e.target.checked})}/> აქტიურია და ჩანს ონლაინ ჩაწერაში</label>
          {message&&<div className={`adm-notice ${message.includes("ვერ")?"error":""}`}>{message}</div>}
          <div className="adm-page-actions"><button className="adm-btn primary" disabled={busy}>{busy?"ინახება...":editing?"ცვლილების შენახვა":"სერვისის დამატება"}</button>{editing&&<button type="button" className="adm-btn" onClick={reset}>გაუქმება</button>}</div>
        </form>
      </section>
      <section className="adm-card">
        <div className="adm-card-title"><div><h2>სერვისების სია</h2><p>{items.length} ჩანაწერი</p></div></div>
        <div className="adm-list" style={{padding:16}}>{items.length===0?<div className="adm-empty-v2">სერვისები არ არის.</div>:items.map(x=><div className="adm-list-item" key={x._id}><div><h3>{x.name}</h3><p>{x.durationMinutes} წთ{x.price!=null?` • ${x.price} ₾`:""}<br/>{x.description||"აღწერის გარეშე"}</p></div><span className={`adm-badge ${x.isActive?"":"off"}`}>{x.isActive?"აქტიური":"გამორთული"}</span><div className="adm-list-actions"><button className="adm-btn" onClick={()=>edit(x)}>რედაქტირება</button><button className="adm-btn" onClick={()=>toggle(x)}>{x.isActive?"გამორთვა":"ჩართვა"}</button><button className="adm-btn danger" onClick={()=>remove(x)}>წაშლა</button></div></div>)}</div>
      </section>
    </div>
  </>;
}
