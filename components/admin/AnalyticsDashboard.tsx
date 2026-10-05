"use client";

import { useEffect,useMemo,useState } from "react";
type Analytics={total:number;patients:number;upcoming:number;status:Record<string,number>;daily:{date:string;count:number;completed:number}[];byService:{_id:string;name:string;count:number;completed:number;estimatedRevenue:number|null}[];bySpecialist:{_id:string;name:string;title:string;count:number;completed:number}[];from:string;today:string};

export default function AnalyticsDashboard(){
 const [data,setData]=useState<Analytics|null>(null);const [loading,setLoading]=useState(true);
 async function load(){setLoading(true);const r=await fetch("/api/admin/analytics",{cache:"no-store"});const d=await r.json();if(r.ok)setData(d);setLoading(false)}
 useEffect(()=>{load()},[]);
 const maxDaily=useMemo(()=>Math.max(1,...(data?.daily.map(x=>x.count)||[1])),[data]);
 const revenue=useMemo(()=>data?.byService.reduce((s,x)=>s+(x.estimatedRevenue||0),0)||0,[data]);
 if(loading)return <div className="adm-empty-v2">ანალიტიკა იტვირთება...</div>;
 if(!data)return <div className="adm-notice error">ანალიტიკის ჩატვირთვა ვერ მოხერხდა.</div>;
 return <>
  <div className="adm-page-head"><div><h1>ანალიტიკა</h1><p>ჯავშნების, პაციენტებისა და სერვისების მოკლე ბიზნეს-სურათი.</p></div><div className="adm-page-actions"><button className="adm-btn" onClick={load}>განახლება</button></div></div>
  <div className="adm-grid four">
   <div className="adm-card adm-stat-v2"><small>სულ ჯავშნები</small><b>{data.total}</b><span>ყველა დრო</span></div>
   <div className="adm-card adm-stat-v2"><small>პაციენტები</small><b>{data.patients}</b><span>უნიკალური ჩანაწერები</span></div>
   <div className="adm-card adm-stat-v2"><small>მომავალი ვიზიტები</small><b>{data.upcoming}</b><span>დადასტურებული</span></div>
   <div className="adm-card adm-stat-v2"><small>შეფასებითი შემოსავალი</small><b>{revenue.toLocaleString("ka-GE")} ₾</b><span>დასრულებული ვიზიტები, მიმდინარე ფასებით</span></div>
  </div>
  <div className="adm-grid four" style={{marginTop:18}}>
   {[['დადასტურებული',data.status.confirmed||0],['დასრულებული',data.status.completed||0],['გაუქმებული',data.status.cancelled||0],['არ გამოცხადდა',data.status.no_show||0]].map(([label,value])=><div className="adm-card adm-stat-v2" key={String(label)}><small>{label}</small><b>{value}</b><span>{data.total?Math.round(Number(value)/data.total*100):0}% საერთო რაოდენობიდან</span></div>)}
  </div>
  <section className="adm-card" style={{marginTop:18}}><div className="adm-card-title"><div><h2>ბოლო 30 დღე</h2><p>{data.from} — {data.today}</p></div></div><div style={{padding:20,display:"grid",gridTemplateColumns:`repeat(${Math.max(data.daily.length,1)},minmax(18px,1fr))`,gap:6,alignItems:"end",height:230,overflowX:"auto"}}>{data.daily.length===0?<div className="adm-empty-v2" style={{gridColumn:"1/-1"}}>ამ პერიოდში მონაცემი არ არის.</div>:data.daily.map(x=><div key={x.date} title={`${x.date}: ${x.count}`} style={{minWidth:18,display:"grid",gap:6,alignItems:"end",height:"100%"}}><div style={{alignSelf:"end",height:`${Math.max(6,x.count/maxDaily*170)}px`,borderRadius:"7px 7px 3px 3px",background:"var(--adm-accent)"}}/><small style={{fontSize:7,color:"var(--adm-muted)",transform:"rotate(-55deg)",transformOrigin:"left top",whiteSpace:"nowrap"}}>{x.date.slice(5)}</small></div>)}</div></section>
  <div className="adm-grid two" style={{marginTop:18}}>
   <section className="adm-card"><div className="adm-card-title"><div><h2>სერვისები</h2><p>ყველაზე მოთხოვნადი მიმართულებები</p></div></div><div className="adm-table-wrap"><table className="adm-table-v2"><thead><tr><th>სერვისი</th><th>ჯავშანი</th><th>დასრულებული</th><th>შეფ. შემოსავალი</th></tr></thead><tbody>{data.byService.map(x=><tr key={x._id}><td><strong>{x.name}</strong></td><td>{x.count}</td><td>{x.completed}</td><td>{x.estimatedRevenue==null?"—":`${x.estimatedRevenue.toLocaleString("ka-GE")} ₾`}</td></tr>)}</tbody></table></div></section>
   <section className="adm-card"><div className="adm-card-title"><div><h2>სპეციალისტები</h2><p>ვიზიტების რაოდენობა</p></div></div><div className="adm-table-wrap"><table className="adm-table-v2"><thead><tr><th>სპეციალისტი</th><th>ჯავშანი</th><th>დასრულებული</th><th>შესრულება</th></tr></thead><tbody>{data.bySpecialist.map(x=><tr key={x._id}><td><strong>{x.name}</strong><small>{x.title}</small></td><td>{x.count}</td><td>{x.completed}</td><td><div className="adm-kpi-bar" style={{minWidth:100}}><span style={{width:`${x.count?Math.round(x.completed/x.count*100):0}%`}}/></div></td></tr>)}</tbody></table></div></section>
  </div>
 </>
}
