"use client";

import { useEffect,useMemo,useState } from "react";

type Booking={_id:string;patientName:string;patientPhone:string;date:string;time:string;status:string;confirmationCode:string;serviceId?:{name?:string};specialistId?:{name?:string;title?:string}};
const labels:Record<string,string>={confirmed:"დადასტურებული",completed:"დასრულებული",cancelled:"გაუქმებული",no_show:"არ გამოცხადდა"};
const weekdays=["ორშ","სამ","ოთხ","ხუთ","პარ","შაბ","კვი"];
function pad(n:number){return String(n).padStart(2,"0")}
function ymd(y:number,m:number,d:number){return `${y}-${pad(m+1)}-${pad(d)}`}
function monthLabel(date:Date){return new Intl.DateTimeFormat("ka-GE",{month:"long",year:"numeric"}).format(date)}
function shortWeekday(date:string){const d=new Date(`${date}T12:00:00`);return new Intl.DateTimeFormat("ka-GE",{weekday:"short"}).format(d)}

export default function CalendarManager(){
 const now=new Date();const [month,setMonth]=useState(new Date(now.getFullYear(),now.getMonth(),1));const [items,setItems]=useState<Booking[]>([]);const [selected,setSelected]=useState(ymd(now.getFullYear(),now.getMonth(),now.getDate()));const [loading,setLoading]=useState(false);
 const start=useMemo(()=>ymd(month.getFullYear(),month.getMonth(),1),[month]);
 const end=useMemo(()=>ymd(month.getFullYear(),month.getMonth()+1,0),[month]);
 async function load(){setLoading(true);const r=await fetch(`/api/admin/bookings?from=${start}&to=${end}`,{cache:"no-store"});const d=await r.json();if(r.ok)setItems(d.items||[]);setLoading(false)}
 useEffect(()=>{load()},[start,end]);
 const cells=useMemo(()=>{const first=new Date(month.getFullYear(),month.getMonth(),1);const last=new Date(month.getFullYear(),month.getMonth()+1,0);const mondayIndex=(first.getDay()+6)%7;const arr:{date:string;day:number;current:boolean}[]=[];for(let i=mondayIndex;i>0;i--){const d=new Date(month.getFullYear(),month.getMonth(),1-i);arr.push({date:ymd(d.getFullYear(),d.getMonth(),d.getDate()),day:d.getDate(),current:false})}for(let d=1;d<=last.getDate();d++)arr.push({date:ymd(month.getFullYear(),month.getMonth(),d),day:d,current:true});while(arr.length%7!==0){const d=new Date(month.getFullYear(),month.getMonth()+1,arr.length-mondayIndex-last.getDate()+1);arr.push({date:ymd(d.getFullYear(),d.getMonth(),d.getDate()),day:d.getDate(),current:false})}return arr},[month]);
 const monthDays=useMemo(()=>cells.filter(c=>c.current),[cells]);
 const selectedItems=items.filter(x=>x.date===selected).sort((a,b)=>a.time.localeCompare(b.time));
 function shift(delta:number){const d=new Date(month.getFullYear(),month.getMonth()+delta,1);setMonth(d);setSelected(ymd(d.getFullYear(),d.getMonth(),1))}
 return <>
  <div className="adm-page-head"><div><h1>კალენდარი</h1><p>ჯავშნების თვიური ხედვა — სწრაფად ნახეთ რომელ დღეს რამდენი ვიზიტია დაგეგმილი.</p></div><div className="adm-page-actions"><button className="adm-btn" onClick={()=>shift(-1)}>← წინა</button><button className="adm-btn" onClick={()=>{const d=new Date();setMonth(new Date(d.getFullYear(),d.getMonth(),1));setSelected(ymd(d.getFullYear(),d.getMonth(),d.getDate()))}}>დღეს</button><button className="adm-btn" onClick={()=>shift(1)}>შემდეგი →</button></div></div>
  <div className="adm-grid adm-calendar-layout">
   <section className="adm-card adm-calendar-desktop"><div className="adm-card-title"><div><h2>{monthLabel(month)}</h2><p>{loading?"იტვირთება...":`${items.length} ჯავშანი ამ თვეში`}</p></div></div><div className="adm-calendar-scroll"><div className="adm-calendar">{weekdays.map(w=><div className="adm-calendar-head" key={w}>{w}</div>)}{cells.map(c=>{const dayItems=items.filter(x=>x.date===c.date);return <button key={c.date} className={`adm-day ${c.current?"":"muted"}`} style={{textAlign:"left",borderTop:0,borderLeft:0,cursor:"pointer",outline:selected===c.date?"2px solid var(--adm-accent)":"none",outlineOffset:"-2px"}} onClick={()=>setSelected(c.date)}><span className="adm-day-number">{c.day}</span><div className="adm-day-events">{dayItems.slice(0,3).map(x=><span key={x._id} className={`adm-event ${x.status}`}>{x.time} • {x.patientName}</span>)}{dayItems.length>3&&<span className="adm-event">+{dayItems.length-3} სხვა</span>}</div></button>})}</div></div></section>

   <section className="adm-card adm-calendar-mobile"><div className="adm-card-title"><div><h2>{monthLabel(month)}</h2><p>{loading?"იტვირთება...":`${items.length} ჯავშანი ამ თვეში`}</p></div></div><div className="adm-mobile-days">{monthDays.map(c=>{const count=items.filter(x=>x.date===c.date).length;return <button key={c.date} className={`adm-mobile-day ${selected===c.date?"active":""}`} onClick={()=>setSelected(c.date)}><span>{shortWeekday(c.date)}</span><b>{c.day}</b>{count>0&&<small>{count}</small>}</button>})}</div></section>

   <section className="adm-card adm-selected-day"><div className="adm-card-title"><div><h2>{selected}</h2><p>{selectedItems.length} ვიზიტი</p></div></div><div className="adm-list" style={{padding:14}}>{selectedItems.length===0?<div className="adm-empty-v2">ამ დღეს ჯავშნები არ არის.</div>:selectedItems.map(x=><div className="adm-list-item" key={x._id}><div><h3>{x.time} • {x.patientName}</h3><p>{x.patientPhone}<br/>{x.serviceId?.name||"—"} • {x.specialistId?.name||"—"}</p></div><span className={`adm-badge ${x.status==="cancelled"?"danger":x.status==="no_show"?"warn":""}`}>{labels[x.status]||x.status}</span></div>)}</div></section>
  </div>
 </>
}
