"use client";

import { useState } from "react";

export type VoteSummary = Record<string,{average:number;votes:number}>;

export function TradeVote({id,left,right,summary,onSaved}:{id:string;left:string;right:string;summary?:{average:number;votes:number};onSaved:(data:unknown)=>void}) {
  const [value,setValue]=useState(0); const [saving,setSaving]=useState(false); const [locked,setLocked]=useState(false);
  const label=value===0?"Even trade":value<0?`${left} won by ${Math.abs(value)}%`:`${right} won by ${value}%`;
  const save=async()=>{setSaving(true);try{const r=await fetch("/api/votes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"trade",id,value})});if(!r.ok)throw new Error();onSaved(await r.json());setLocked(true);}catch{alert("Vote did not save. Try again.");}finally{setSaving(false)}};
  return <div className="vote-box"><div className="vote-title"><strong>Who won?</strong>{summary&&<span>{summary.average===0?"Even":summary.average<0?`${left} ${Math.abs(summary.average)}%`:`${right} ${summary.average}%`} · {summary.votes} vote{summary.votes===1?"":"s"}</span>}</div><input aria-label={`Rate trade ${id}`} type="range" min="-100" max="100" step="5" value={value} onChange={e=>{setValue(Number(e.target.value));setLocked(false)}}/><div className="range-labels"><span>{left}</span><b>{label}</b><span>{right}</span></div><button onClick={save} disabled={saving}>{saving?"Locking…":locked?"Locked ✓":"Lock choice"}</button></div>;
}

export function RoastVote({id,summary,onSaved}:{id:string;summary?:{average:number;votes:number};onSaved:(data:unknown)=>void}) {
  const [value,setValue]=useState(0); const [saving,setSaving]=useState(false); const [locked,setLocked]=useState(false);
  const save=async()=>{if(!value)return;setSaving(true);try{const r=await fetch("/api/votes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"roast",id,value})});if(!r.ok)throw new Error();onSaved(await r.json());setLocked(true);}catch{alert("Rating did not save. Try again.");}finally{setSaving(false)}};
  return <div className="star-vote"><div><strong>Rate this roast</strong>{summary&&<span>{summary.average.toFixed(1)} ★ · {summary.votes} rating{summary.votes===1?"":"s"}</span>}</div><div className="stars" role="radiogroup" aria-label={`Rate roast ${id}`}>{[1,2,3,4,5].map(star=><button type="button" role="radio" aria-checked={value===star} aria-label={`${star} star${star===1?"":"s"}`} className={star<=value?"chosen":""} key={star} onClick={()=>{setValue(star);setLocked(false)}}>★</button>)}</div><button className="lock-rating" onClick={save} disabled={!value||saving}>{saving?"Locking…":locked?"Locked ✓":"Lock rating"}</button></div>;
}
