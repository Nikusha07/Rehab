"use client";

import { useEffect, useMemo, useState } from "react";

type Specialist={_id:string;name:string;title?:string;isActive:boolean};
type Hour={_id?:string;specialistId:string;weekday:number;openTime:string;closeTime:string;isDayOff:boolean};
const dayNames=["კვირა","ორშაბათი","სამშაბათი","ოთხშაბათი","ხუთშაბათი","პარასკევი","შაბათი"];
const defaultRows=()=>dayNames.map((_,weekday)=>({weekday,openTime:"10:00",closeTime:"18:00",isDayOff:weekday===0}));

export default function ScheduleManager(){
 const [specialists,setSpecialists]=useState<Specialist[]>([]);const [hours,setHours]=useState<Hour[]>([]);const [selected,setSelected]=useState("");const [rows,setRows]=useState(defaultRows());const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 async function load(){const r=await fetch("/api/admin/schedule",{cache:"no-store"});const d=await r.json();if(r.ok){setSpecialists(d.specialists||[]);setHours(d.hours||[]);if(!selected&&d.specialists?.[0]?._id)setSelected(d.specialists[0]._id)}}
 useEffect(()=>{load()},[]);
 const selectedSpecialist=useMemo(()=>specialists.find(x=>x._id===selected),[specialists,selected]);
 useEffect(()=>{if(!selected)return;const own=hours.filter(x=>String(x.specialistId)===selected);setRows(defaultRows().map(base=>{const f=own.find(x=>x.weekday===base.weekday);return f?{weekday:f.weekday,openTime:f.openTime,closeTime:f.closeTime,isDayOff:f.isDayOff}:base}))},[selected,hours]);
 function patch(i:number,key:string,value:any){setRows(r=>r.map((x,idx)=>idx===i?{...x,[key]:value}:x))}
 async function save(){if(!selected)return;setBusy(true);setMessage("");const r=await fetch("/api/admin/schedule",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({specialistId:selected,rows})});const d=await r.json().catch(()=>({}));setBusy(false);if(!r.ok){setMessage(d.message||"შენახვა ვერ მოხერხდა.");return}setMessage("გრაფიკი შენახულია.");await load()}
 return <>
  <div className="adm-page-head"><div><h1>სამუშაო გრაფიკი</h1><p>ყოველი სპეციალისტისთვის განსაზღვრეთ სამუშაო დღეები და საათები. თავისუფალი სლოტები ამ გრაფიკის მიხედვით ითვლება.</p></div><div className="adm-page-actions"><button className="adm-btn primary" onClick={save} disabled={!selected||busy}>{busy?"ინახება...":"გრაფიკის შენახვა"}</button></div></div>
  <div className="adm-grid two">
   <section className="adm-card adm-card-pad">
    <div className="adm-field"><span>სპეციალისტი</span><select value={selected} onChange={e=>{setMessage("");setSelected(e.target.value)}}>{specialists.map(x=><option key={x._id} value={x._id}>{x.name}{x.title?` — ${x.title}`:""}{x.isActive?"":" (გამორთული)"}</option>)}</select></div>
    {selectedSpecialist&&<div className="adm-notice" style={{marginTop:14}}>არჩეულია: {selectedSpecialist.name}. ცვლილებები შეეხება მხოლოდ მის ხელმისაწვდომ დროს.</div>}
   </section>
   <section className="adm-card adm-card-pad"><h3 style={{marginTop:0}}>როგორ მუშაობს</h3><p style={{fontSize:11,lineHeight:1.7,color:"var(--adm-muted)",marginBottom:0}}>თუ დღე მონიშნულია როგორც დასვენება, იმ დღეს ონლაინ ჩაწერა სრულად დაიხურება. დანარჩენ დღეებში სისტემა 30-წუთიან სლოტებს შექმნის მითითებულ დიაპაზონში.</p></section>
  </div>
  <section className="adm-card" style={{marginTop:18}}><div className="adm-card-title"><div><h2>კვირის განრიგი</h2><p>დრო გამოიყენება თბილისის დროის ზონით</p></div></div><div style={{padding:"4px 20px 16px"}}>{rows.map((row,i)=><div className="adm-schedule-row" key={row.weekday}><div className="adm-day-name">{dayNames[row.weekday]}</div><div className="adm-field"><span>დაწყება</span><input type="time" value={row.openTime} disabled={row.isDayOff} onChange={e=>patch(i,"openTime",e.target.value)}/></div><div className="adm-field"><span>დასრულება</span><input type="time" value={row.closeTime} disabled={row.isDayOff} onChange={e=>patch(i,"closeTime",e.target.value)}/></div><label className="adm-check" style={{paddingBottom:12}}><input type="checkbox" checked={row.isDayOff} onChange={e=>patch(i,"isDayOff",e.target.checked)}/> დასვენება</label></div>)}</div></section>
  {message&&<div className={`adm-notice ${message.includes("ვერ")?"error":""}`} style={{marginTop:14}}>{message}</div>}
 </>
}
