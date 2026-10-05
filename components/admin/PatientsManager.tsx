"use client";

import { useEffect,useState } from "react";

type Patient={_id:string;name:string;phone:string;email:string;notes:string;createdAt?:string;stats:{visits:number;confirmed:number;completed:number;lastDate:string|null}};
type Booking={_id:string;date:string;time:string;status:string;confirmationCode:string;notes?:string;serviceId?:{name?:string};specialistId?:{name?:string;title?:string}};
const labels:Record<string,string>={confirmed:"დადასტურებული",completed:"დასრულებული",cancelled:"გაუქმებული",no_show:"არ გამოცხადდა"};

export default function PatientsManager(){
 const [items,setItems]=useState<Patient[]>([]);const [q,setQ]=useState("");const [selected,setSelected]=useState<Patient|null>(null);const [bookings,setBookings]=useState<Booking[]>([]);const [form,setForm]=useState({name:"",email:"",notes:""});const [loading,setLoading]=useState(false);const [message,setMessage]=useState("");
 async function load(search=""){setLoading(true);const r=await fetch(`/api/admin/patients${search?`?q=${encodeURIComponent(search)}`:""}`,{cache:"no-store"});const d=await r.json();if(r.ok)setItems(d.items||[]);setLoading(false)}
 useEffect(()=>{load()},[]);
 async function openPatient(x:Patient){setMessage("");const r=await fetch(`/api/admin/patients/${x._id}`,{cache:"no-store"});const d=await r.json();if(r.ok){setSelected({...x,...d.patient});setBookings(d.bookings||[]);setForm({name:d.patient.name||"",email:d.patient.email||"",notes:d.patient.notes||""})}}
 async function save(){if(!selected)return;const r=await fetch(`/api/admin/patients/${selected._id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const d=await r.json().catch(()=>({}));if(r.ok){setMessage("პაციენტის ჩანაწერი განახლდა.");setSelected({...selected,...d.patient});await load(q)}else setMessage(d.message||"შენახვა ვერ მოხერხდა.")}
 return <>
  <div className="adm-page-head"><div><h1>პაციენტები</h1><p>პაციენტის საკონტაქტო მონაცემები, ვიზიტების ისტორია და ადმინისტრაციული შენიშვნები ერთ სივრცეში.</p></div></div>
  <div className="adm-grid" style={{gridTemplateColumns:"minmax(340px,.82fr) minmax(0,1.18fr)"}}>
   <section className="adm-card">
    <div className="adm-toolbar-v2"><div className="adm-search"><input placeholder="ძებნა სახელით ან ტელეფონით" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")load(q)}}/></div><button className="adm-btn" onClick={()=>load(q)}>ძებნა</button></div>
    <div className="adm-list" style={{padding:14,maxHeight:"70vh",overflow:"auto"}}>{loading?<div className="adm-empty-v2">იტვირთება...</div>:items.length===0?<div className="adm-empty-v2">პაციენტები ვერ მოიძებნა.</div>:items.map(x=><button key={x._id} onClick={()=>openPatient(x)} className="adm-list-item" style={{width:"100%",textAlign:"left",cursor:"pointer",font:"inherit",borderColor:selected?._id===x._id?"var(--adm-accent)":"#e0e9e5"}}><div><h3>{x.name}</h3><p>{x.phone}{x.stats.lastDate?<><br/>ბოლო ვიზიტი: {x.stats.lastDate}</>:null}</p></div><span className="adm-badge">{x.stats.visits} ვიზიტი</span></button>)}</div>
   </section>
   <section className="adm-card">{!selected?<div className="adm-empty-v2">აირჩიეთ პაციენტი დეტალების სანახავად.</div>:<>
    <div className="adm-card-title"><div><h2>{selected.name}</h2><p>{selected.phone} • სულ {selected.stats?.visits||bookings.length} ვიზიტი</p></div><span className="adm-badge">პაციენტი</span></div>
    <div className="adm-card-pad"><div className="adm-form"><div className="adm-form-row"><div className="adm-field"><span>სახელი და გვარი</span><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div><div className="adm-field"><span>ელფოსტა</span><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div></div><div className="adm-field"><span>ადმინისტრაციული შენიშვნა</span><textarea placeholder="მაგ. კომუნიკაციისთვის საჭირო მოკლე ინფორმაცია" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>{message&&<div className={`adm-notice ${message.includes("ვერ")?"error":""}`}>{message}</div>}<div><button className="adm-btn primary" onClick={save}>ჩანაწერის შენახვა</button></div></div></div>
    <div className="adm-card-title"><div><h3>ვიზიტების ისტორია</h3><p>ბოლო 100 ჩანაწერი</p></div></div>
    <div className="adm-table-wrap"><table className="adm-table-v2"><thead><tr><th>თარიღი</th><th>სერვისი</th><th>სპეციალისტი</th><th>კოდი</th><th>სტატუსი</th></tr></thead><tbody>{bookings.map(b=><tr key={b._id}><td><strong>{b.date}</strong><small>{b.time}</small></td><td>{b.serviceId?.name||"—"}</td><td>{b.specialistId?.name||"—"}</td><td>{b.confirmationCode}</td><td><span className={`adm-badge ${b.status==="cancelled"?"danger":b.status==="no_show"?"warn":""}`}>{labels[b.status]||b.status}</span></td></tr>)}</tbody></table>{bookings.length===0&&<div className="adm-empty-v2">ვიზიტების ისტორია ცარიელია.</div>}</div>
   </>}</section>
  </div>
 </>
}
