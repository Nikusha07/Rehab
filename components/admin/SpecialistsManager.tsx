"use client";

import { useEffect, useState } from "react";

type Specialist={_id:string;name:string;title:string;bio:string;image:string;isActive:boolean;sortOrder:number};
const empty={name:"",title:"",bio:"",image:"",isActive:true,sortOrder:0};

export default function SpecialistsManager(){
 const [items,setItems]=useState<Specialist[]>([]); const [form,setForm]=useState<any>(empty); const [editing,setEditing]=useState<string|null>(null); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
 async function load(){const r=await fetch("/api/admin/specialists",{cache:"no-store"});const d=await r.json();if(r.ok)setItems(d.items||[])}
 useEffect(()=>{load()},[]);
 function reset(){setEditing(null);setForm(empty);setMessage("")}
 function edit(x:Specialist){setEditing(x._id);setForm(x);window.scrollTo({top:0,behavior:"smooth"})}
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage("");const r=await fetch(editing?`/api/admin/specialists/${editing}`:"/api/admin/specialists",{method:editing?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,sortOrder:Number(form.sortOrder)})});const d=await r.json().catch(()=>({}));setBusy(false);if(!r.ok){setMessage(d.message||"შენახვა ვერ მოხერხდა.");return}reset();await load()}
 async function toggle(x:Specialist){await fetch(`/api/admin/specialists/${x._id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({isActive:!x.isActive})});await load()}
 async function remove(x:Specialist){if(!confirm(`წავშალოთ ${x.name}?`))return;await fetch(`/api/admin/specialists/${x._id}`,{method:"DELETE"});await load()}
 return <>
  <div className="adm-page-head"><div><h1>სპეციალისტები</h1><p>ექიმებისა და თერაპევტების პროფილები, თანამდებობა, აღწერა და აქტიური სტატუსი.</p></div></div>
  <div className="adm-grid two">
   <section className="adm-card adm-card-pad"><div className="adm-card-title" style={{padding:0,paddingBottom:16,marginBottom:18}}><div><h2>{editing?"პროფილის რედაქტირება":"ახალი სპეციალისტი"}</h2><p>აქტიური სპეციალისტები ჩანს ონლაინ ჩაწერაში.</p></div></div>
    <form className="adm-form" onSubmit={submit}>
     <div className="adm-form-row"><div className="adm-field"><span>სახელი და გვარი</span><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div><div className="adm-field"><span>თანამდებობა / სპეციალობა</span><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div></div>
     <div className="adm-field"><span>პროფილის აღწერა</span><textarea value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})}/></div>
     <div className="adm-form-row"><div className="adm-field"><span>ფოტოს URL (არასავალდებულო)</span><input value={form.image} onChange={e=>setForm({...form,image:e.target.value})}/></div><div className="adm-field"><span>რიგითობა</span><input type="number" min="0" value={form.sortOrder} onChange={e=>setForm({...form,sortOrder:e.target.value})}/></div></div>
     <label className="adm-check"><input type="checkbox" checked={form.isActive} onChange={e=>setForm({...form,isActive:e.target.checked})}/> აქტიურია</label>
     {message&&<div className="adm-notice error">{message}</div>}
     <div className="adm-page-actions"><button className="adm-btn primary" disabled={busy}>{busy?"ინახება...":editing?"ცვლილების შენახვა":"სპეციალისტის დამატება"}</button>{editing&&<button type="button" className="adm-btn" onClick={reset}>გაუქმება</button>}</div>
    </form>
   </section>
   <section className="adm-card"><div className="adm-card-title"><div><h2>გუნდი</h2><p>{items.length} სპეციალისტი</p></div></div><div className="adm-list" style={{padding:16}}>{items.length===0?<div className="adm-empty-v2">სპეციალისტები არ არის.</div>:items.map(x=><div className="adm-list-item" key={x._id}><div><h3>{x.name}</h3><p>{x.title||"სპეციალობა არ არის მითითებული"}{x.bio?<><br/>{x.bio}</>:null}</p></div><span className={`adm-badge ${x.isActive?"":"off"}`}>{x.isActive?"აქტიური":"გამორთული"}</span><div className="adm-list-actions"><button className="adm-btn" onClick={()=>edit(x)}>რედაქტირება</button><button className="adm-btn" onClick={()=>toggle(x)}>{x.isActive?"გამორთვა":"ჩართვა"}</button><button className="adm-btn danger" onClick={()=>remove(x)}>წაშლა</button></div></div>)}</div></section>
  </div>
 </>
}
