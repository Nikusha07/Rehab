"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Booking={_id:string;patientName:string;patientPhone:string;date:string;time:string;status:string;confirmationCode:string;notes?:string;serviceId?:{name?:string};specialistId?:{name?:string;title?:string}};
const labels:Record<string,string>={confirmed:"დადასტურებული",completed:"დასრულებული",cancelled:"გაუქმებული",no_show:"არ გამოცხადდა"};
function tbilisiToday(){const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Tbilisi",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());const get=(t:string)=>parts.find(x=>x.type===t)?.value||"";return `${get("year")}-${get("month")}-${get("day")}`}

export default function AdminDashboard(){
 const router=useRouter();const [items,setItems]=useState<Booking[]>([]);const [filter,setFilter]=useState("all");const [query,setQuery]=useState("");const [date,setDate]=useState("");const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 async function load(){setLoading(true);setError("");const res=await fetch("/api/admin/bookings",{cache:"no-store"});if(res.status===401){router.replace("/admin/login");return}const data=await res.json().catch(()=>({}));if(!res.ok)setError("ჯავშნების ჩატვირთვა ვერ მოხერხდა.");else setItems(data.items||[]);setLoading(false)}
 useEffect(()=>{load()},[]);
 async function changeStatus(id:string,status:"cancelled"|"completed"|"no_show"){if(status==="cancelled"&&!confirm("ნამდვილად გსურთ ჯავშნის გაუქმება? დრო კვლავ თავისუფალი გახდება."))return;const res=await fetch(`/api/admin/bookings/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});if(res.ok)setItems(current=>current.map(x=>x._id===id?{...x,status}:x));else setError("სტატუსის განახლება ვერ მოხერხდა.")}
 const today=tbilisiToday();
 const stats=useMemo(()=>({today:items.filter(x=>x.date===today&&x.status==="confirmed").length,confirmed:items.filter(x=>x.status==="confirmed").length,completed:items.filter(x=>x.status==="completed").length,cancelled:items.filter(x=>x.status==="cancelled").length}),[items,today]);
 const visible=useMemo(()=>items.filter(x=>{if(filter!=="all"&&x.status!==filter)return false;if(date&&x.date!==date)return false;const q=query.trim().toLowerCase();if(q&&!`${x.patientName} ${x.patientPhone} ${x.confirmationCode} ${x.serviceId?.name||""} ${x.specialistId?.name||""}`.toLowerCase().includes(q))return false;return true}),[items,filter,date,query]);
 return <>
  <div className="adm-page-head"><div><h1>ჯავშნების მართვა</h1><p>ბოლო 250 ვიზიტი, სტატუსები, პაციენტები და დღევანდელი დატვირთვა.</p></div><div className="adm-page-actions"><button className="adm-btn" onClick={load}>განახლება</button><a className="adm-btn primary" href="/admin/calendar">კალენდარი</a></div></div>
  <div className="adm-grid four"><div className="adm-card adm-stat-v2"><small>დღეს დაგეგმილი</small><b>{stats.today}</b><span>{today}</span></div><div className="adm-card adm-stat-v2"><small>დადასტურებული</small><b>{stats.confirmed}</b><span>აქტიური ჯავშნები</span></div><div className="adm-card adm-stat-v2"><small>დასრულებული</small><b>{stats.completed}</b><span>ყველა დრო</span></div><div className="adm-card adm-stat-v2"><small>გაუქმებული</small><b>{stats.cancelled}</b><span>ყველა დრო</span></div></div>
  <section className="adm-card" style={{marginTop:18}}>
   <div className="adm-toolbar-v2"><div className="adm-search"><input placeholder="პაციენტი, ტელეფონი, კოდი, სერვისი..." value={query} onChange={e=>setQuery(e.target.value)}/></div><input className="adm-btn" style={{minWidth:145}} type="date" value={date} onChange={e=>setDate(e.target.value)}/>{date&&<button className="adm-btn" onClick={()=>setDate("")}>თარიღის გასუფთავება</button>}</div>
   <div className="adm-toolbar-v2" style={{borderTop:"1px solid var(--adm-border)"}}><div className="admin-filter">{[["all","ყველა"],["confirmed","დადასტურებული"],["completed","დასრულებული"],["cancelled","გაუქმებული"],["no_show","არ გამოცხადდა"]].map(([key,label])=><button key={key} className={filter===key?"active":""} onClick={()=>setFilter(key)}>{label}</button>)}</div><span style={{marginLeft:"auto",fontSize:10,color:"var(--adm-muted)"}}>ნაპოვნია: {visible.length}</span></div>
   {error&&<div className="adm-notice error" style={{margin:14}}>{error}</div>}
   {loading?<div className="adm-empty-v2">იტვირთება...</div>:visible.length===0?<div className="adm-empty-v2">ჯავშნები ვერ მოიძებნა.</div>:<>
    <div className="adm-table-wrap"><table className="adm-table-v2"><thead><tr><th>პაციენტი</th><th>თარიღი / დრო</th><th>მომსახურება</th><th>სპეციალისტი</th><th>კოდი</th><th>სტატუსი</th><th>მოქმედება</th></tr></thead><tbody>{visible.map(x=><tr key={x._id}><td><strong>{x.patientName}</strong><small>{x.patientPhone}{x.notes?` • ${x.notes}`:""}</small></td><td><strong>{x.date}</strong><small>{x.time}</small></td><td>{x.serviceId?.name||"—"}</td><td>{x.specialistId?.name||"—"}</td><td><strong>{x.confirmationCode}</strong></td><td><span className={`adm-badge ${x.status==="cancelled"?"danger":x.status==="no_show"?"warn":""}`}>{labels[x.status]||x.status}</span></td><td><div className="adm-list-actions">{x.status==="confirmed"&&<><button className="adm-btn" onClick={()=>changeStatus(x._id,"completed")}>დასრულდა</button><button className="adm-btn" onClick={()=>changeStatus(x._id,"no_show")}>არ მოვიდა</button><button className="adm-btn danger" onClick={()=>changeStatus(x._id,"cancelled")}>გაუქმება</button></>}</div></td></tr>)}</tbody></table></div>
   </>}
  </section>
 </>
}
