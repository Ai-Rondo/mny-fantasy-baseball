"use client";

import { useMemo, useState } from "react";
import drafts from "./drafts.json";

type Row = Record<string, string | number | null>;
export type RosterData = { season:number; rosterSize:number; salaryCap:number; rules:Row[]; decisions:Row[]; teams:Array<{team:string;owner:string;summary:Row;committed:Row[];projected:Row[];expiring:Row[];prospects:Row[]}> };

const money = (value:unknown) => `$${Number(value ?? 0)}`;
const playerUrl = (name:unknown) => `https://www.baseball-reference.com/search/search.fcgi?search=${encodeURIComponent(String(name ?? ""))}`;

function Timeline({row}:{row:Row}) {
  const contract=String(row["2027 Contract"]??row.Contract??"");
  const salary=Number(row["2027 $"]??0);
  let years:Array<{year:number;salary:number}>=[];
  if(/^\d+$/.test(contract)) years=Array.from({length:Number(contract)},(_,i)=>({year:2027+i,salary}));
  else if(contract==="3mL") years=[{year:2027,salary:0},{year:2028,salary:5},{year:2029,salary:15}];
  else if(contract==="2mL") years=[{year:2027,salary:5},{year:2028,salary:15}];
  else if(contract==="1mL"||contract==="1FA") years=[{year:2027,salary}];
  return <div className="contract-timeline">{years.length?years.map(item=><span key={item.year}><small>{item.year}</small><b>{money(item.salary)}</b></span>):<em>No 2027 commitment</em>}</div>;
}

function PlayerTable({title,subtitle,rows,kind}:{title:string;subtitle:string;rows:Row[];kind:string}) {
  return <section className="roster-section"><div className="roster-section-head"><div><h3>{title}</h3><p>{subtitle}</p></div><span>{rows.length}</span></div>{rows.length?<div className="roster-player-list">{rows.map((row,index)=>{
    const name=String(row.Player??"");
    const draft=drafts.flatMap(d=>d.picks.map(p=>({...p,year:d.year}))).find(p=>p.player.toLowerCase()===name.toLowerCase());
    return <article className={`roster-player ${kind}`} key={`${name}-${index}`}><div className="player-identity"><a href={playerUrl(name)} target="_blank" rel="noreferrer">{name}</a><span>{row.Pos||"—"} · {row.MLB||row["MLB Org"]||"—"}</span>{draft&&<small>Drafted {draft.year} · #{draft.overall} overall</small>}</div><div className="player-status"><small>{row["2026 Status"]||row["2027 Projection"]||row.Type||"Status"}</small><b>{row["2027 Contract"]||row.Contract||"—"}</b></div><Timeline row={row}/><div className="player-points"><small>2026 FPTS</small><b>{Number(row["2026 FPTS"]??0).toLocaleString("en-US",{maximumFractionDigits:2})}</b></div>{(row.Basis||row.Comment)&&<p className="player-note">{row.Basis||row.Comment}</p>}</article>})}</div>:<p className="roster-empty">None currently projected.</p>}</section>;
}

export function RosterPortal({data,onLock}:{data:RosterData;onLock:()=>void}) {
  const [selected,setSelected]=useState(data.teams[0].team);
  const [view,setView]=useState<"team"|"league"|"rules">("team");
  const team=useMemo(()=>data.teams.find(item=>item.team===selected)??data.teams[0],[data,selected]);
  const summary=team.summary;
  const projectedLeft=Number(summary["Projected $ Left"]??0);
  return <section className="ledger roster-portal">
    <div className="roster-command"><div><span>2027 FRONT OFFICE</span><h2>Pre-Draft Roster Room</h2><p>Contracts, cap position, projected graduations and farm systems.</p></div><div className="roster-command-actions"><div className="roster-view-tabs"><button className={view==="team"?"active":""} onClick={()=>setView("team")}>Team room</button><button className={view==="league"?"active":""} onClick={()=>setView("league")}>League map</button><button className={view==="rules"?"active":""} onClick={()=>setView("rules")}>Rules</button></div><button className="lock-rosters" onClick={onLock}>Lock</button></div></div>
    {view==="league"?<div className="league-cap-grid">{data.teams.map(item=><button key={item.team} onClick={()=>{setSelected(item.team);setView("team")}}><span>{item.owner}</span><strong>{item.team}</strong><div><i style={{width:`${Math.min(100,Number(item.summary["Projected $"]??0)/data.salaryCap*100)}%`}}/></div><small>{money(item.summary["Projected $ Left"])} available · {item.summary["Projected Spots Left"]} spots</small></button>)}</div>:view==="rules"?<div className="roster-rules"><section><h3>Contract projection rules</h3>{data.rules.map((rule,i)=><article key={i}><strong>{rule.Rule}</strong><span>{rule["2027 Treatment"]}</span><p>{rule.Reason}</p></article>)}</section><section><h3>Current projection decisions</h3>{data.decisions.map((decision,i)=><article key={i}><strong>{decision.Player}</strong><span>{decision.Team} · {decision.Decision}</span><p>{decision.Basis}</p></article>)}</section></div>:<>
      <div className="team-selector"><label>Club<select value={selected} onChange={e=>setSelected(e.target.value)}>{data.teams.map(item=><option key={item.team}>{item.team}</option>)}</select></label><div><span>{team.owner}</span><h2>{team.team}</h2></div></div>
      <div className="budget-dashboard"><article><small>Projected payroll</small><strong>{money(summary["Projected $"])}</strong><span>of {money(data.salaryCap)}</span></article><article className="budget-available"><small>Draft budget</small><strong>{money(projectedLeft)}</strong><span>{summary["Projected Spots Left"]} open roster spots</span></article><article><small>Buying power</small><strong>{money(summary["Projected $/Spot"])}</strong><span>available per open spot</span></article><article><small>Committed core</small><strong>{summary["Committed Players"]}</strong><span>{money(summary["Committed $"])} locked in</span></article><div className="cap-meter"><i style={{width:`${Math.min(100,Number(summary["Projected $"]??0)/data.salaryCap*100)}%`}}/><span>{Math.round(Number(summary["Projected $"]??0)/data.salaryCap*100)}% of cap committed/projected</span></div></div>
      <PlayerTable title="Contracted Core" subtitle="Hard commitments entering the 2027 draft" rows={team.committed} kind="committed"/>
      <PlayerTable title="Projected Additions" subtitle="Minor graduations and possible free-agent options" rows={team.projected} kind="projected"/>
      <PlayerTable title="Auction Returns" subtitle="Expiring contracts currently returning to the player pool" rows={team.expiring} kind="expiring"/>
      <PlayerTable title="Farm System" subtitle="0mL prospects whose contract clock has not started" rows={team.prospects} kind="prospect"/>
    </>}
  </section>;
}
