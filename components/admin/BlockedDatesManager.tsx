"use client";

import { useEffect,useState } from "react";

type Specialist={_id:string;name:string;title?:string;isActive:boolean};
type Blocked={_id:string;date:string;title:string;reason:string;specialistId?:{_id:string;name:string;title?:string}|null};
const empty={date:"",specialistId:"",title:"",reason:""};

export default function BlockedDatesManager(){
 const [items,setItems]=useState<Blocked[]>([]);const [specialists,setSpecialists]=useState<Specialist[]>([]);const [form,setForm]=useState(empty);const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 async function load(){const r=await fetch("/api/admin/blocked-dates",{cache:"no-store"});const d=await r.json();if(r.ok){setItems(d.items||[]);setSpecialists(d.specialists||[])}}
 useEffect(()=>{load()},[]);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage("");const r=await fetch("/api/admin/blocked-dates",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,specialistId:form.specialistId||null})});const d=await r.json().catch(()=>({}));setBusy(false);if(!r.ok){setMessage(d.message||"დამატება ვერ მოხერხდა.");return}setForm(empty);setMessage("დღე დაიბლოკა.");await load()}
 async function remove(x:Blocked){if(!confirm(`მოვხსნათ შეზღუდვა ${x.date}-ზე?`))return;await fetch(`/api/admin/blocked-dates/${x._id}`,{method:"DELETE"});await load()}
 return <>
  <div className="adm-page-head"><div><h1>დაბლოკილი დღეები</h1><p>დახურეთ მთელი ცენტრი ან კონკრეტული სპეციალისტის გრაფიკი შვებულების, დღესასწაულის ან სხვა მიზეზის გამო.</p></div></div>
  <div className="adm-grid two">
   <section className="adm-card adm-card-pad"><div className="adm-card-title" style={{padding:0,paddingBottom:16,marginBottom:18}}><div><h2>ახალი შეზღუდვა</h2><p>შეზღუდულ დღეზე ონლაინ სლოტები აღარ გამოჩნდება.</p></div></div><form className="adm-form" onSubmit={submit}>
    <div className="adm-form-row"><div className="adm-field"><span>თარიღი</span><input required type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div><div className="adm-field"><span>ვის ეხება</span><select value={form.specialistId} onChange={e=>setForm({...form,specialistId:e.target.value})}><option value="">მთელი ცენტრი</option>{specialists.map(x=><option key={x._id} value={x._id}>{x.name}{x.isActive?"":" (გამორთული)"}</option>)}</select></div></div>
    <div className="adm-field"><span>სათაური</span><input required placeholder="მაგ. დასვენების დღე" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
    <div className="adm-field"><span>შენიშვნა / მიზეზი</span><textarea value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/></div>
    {message&&<div className={`adm-notice ${message.includes("ვერ")||message.includes("უკვე")?"error":""}`}>{message}</div>}
    <button className="adm-btn primary" disabled={busy}>{busy?"ემატება...":"დღის დაბლოკვა"}</button>
   </form></section>
   <section className="adm-card"><div className="adm-card-title"><div><h2>შეზღუდვების სია</h2><p>{items.length} ჩანაწერი</p></div></div><div className="adm-list" style={{padding:16}}>{items.length===0?<div className="adm-empty-v2">დაბლოკილი დღეები არ არის.</div>:items.map(x=><div className="adm-list-item" key={x._id}><div><h3>{x.date} — {x.title}</h3><p>{x.specialistId?`${x.specialistId.name}${x.specialistId.title?` • ${x.specialistId.title}`:""}`:"მთელი ცენტრი"}{x.reason?<><br/>{x.reason}</>:null}</p></div><span className="adm-badge warn">დაბლოკილი</span><div className="adm-list-actions"><button className="adm-btn danger" onClick={()=>remove(x)}>მოხსნა</button></div></div>)}</div></section>
  </div>
 </>
}
