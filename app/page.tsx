"use client";

import { useEffect, useMemo, useState } from "react";
import trades from "./trades.json";
import roasts from "./roasts.json";
import { exportExcel, exportJson } from "./exports";
import { RoastVote, TradeVote, type VoteSummary } from "./voting";

const months = ["All months","January","February","March","April","May","June","July","August","September","October","November","December"];
const quickFilters = [{id:"all",label:"All"},{id:"cash",label:"Cash"},{id:"picks",label:"Draft picks"},{id:"august",label:"August"}];
const teamFilters = [
  {label:"All teams",terms:[]},
  {label:"Kyle · Vandelay Industries",terms:["kyle gilkey","vandelay"]},
  {label:"Jon · Benge Drinker",terms:["jon benge","benge drinker","bengedrinker"]},
  {label:"Ben · Honey Nut Churios",terms:["ben sorace","benjamin sorace","honey nut"]},
  {label:"Jeff · Cin City 69ers",terms:["jeff cleek","cin city"]},
  {label:"Austin · Tanner Houck Tuah",terms:["austin gretencord","tanner houck"]},
  {label:"Ryan · The Voey Jottos",terms:["ryan penrod","voey jottos","voeyjottos"]},
  {label:"Jason · The Injured List",terms:["jason bradley","jason penrod","bryzzoforever","injured list"]},
  {label:"Ron · I Schlitt My Pants",terms:["ron cipriano","casas sucks"]},
  {label:"Jose · VIPBenchWarm…",terms:["jose perez","vipbench"]},
  {label:"Michael · Preller's Pentho…",terms:["michael alvarado","preller"]},
  {label:"Matt · Way She Goes",terms:["oandw redd","matt /","matt witmer","way she goes"]},
  {label:"Juan · Show Me Your Tatis",terms:["juan barrera","show me your tatis"]},
];

function AssetList({text}:{text:string}) {
  return <>{text.split(";").map(item=><span className="asset" key={item}>{item.trim()}</span>)}</>;
}

export default function Home() {
  const [tradeVotes,setTradeVotes]=useState<VoteSummary>({});
  const [roastVotes,setRoastVotes]=useState<VoteSummary>({});
  const updateVotes=(data:unknown)=>{const payload=data as {trades?:Array<{id:string;average:number;votes:number}>;roasts?:Array<{id:string;average:number;votes:number}>};setTradeVotes(Object.fromEntries((payload.trades??[]).map(x=>[x.id,x])));setRoastVotes(Object.fromEntries((payload.roasts??[]).map(x=>[x.id,x])));};
  useEffect(()=>{fetch("/api/votes").then(r=>r.ok?r.json():Promise.reject()).then(updateVotes).catch(()=>{});},[]);
  const [tab,setTab]=useState<"trades"|"roasts">("trades");
  const [year,setYear]=useState("all");
  const [month,setMonth]=useState("all");
  const [team,setTeam]=useState("0");
  const [quick,setQuick]=useState("all");
  const [query,setQuery]=useState("");
  const filtered=useMemo(()=>trades.filter(trade=>{
    const haystack=`${trade.partyA} ${trade.sendsA} ${trade.partyB} ${trade.sendsB}`.toLowerCase();
    const selectedTeam=teamFilters[Number(team)];
    return (year==="all"||trade.year===Number(year))
      &&(month==="all"||trade.month===Number(month))
      &&(!selectedTeam.terms.length||selectedTeam.terms.some(term=>haystack.includes(term)))
      &&(quick==="all"||(quick==="cash"&&trade.cash)||(quick==="picks"&&trade.picks)||(quick==="august"&&trade.august))
      &&(!query||haystack.includes(query.toLowerCase()));
  }),[year,month,team,quick,query]);
  const clear=()=>{setYear("all");setMonth("all");setTeam("0");setQuick("all");setQuery("");};
  const people=useMemo(()=>Array.from(new Set(roasts.flatMap(item=>[item.roaster,item.roasted]))).sort(),[]);
  const [roaster,setRoaster]=useState("all");
  const [roasted,setRoasted]=useState("all");
  const filteredRoasts=useMemo(()=>roasts.filter(item=>(roaster==="all"||item.roaster===roaster)&&(roasted==="all"||item.roasted===roasted)),[roaster,roasted]);
  const tradeLeaders=useMemo(()=>{const scores=new Map<string,number[]>();for(const trade of trades){const vote=tradeVotes[trade.id];if(!vote)continue;for(const [name,score] of [[trade.partyA,-vote.average],[trade.partyB,vote.average]] as const)scores.set(name,[...(scores.get(name)??[]),score]);}return [...scores].map(([name,values])=>({name,average:values.reduce((a,b)=>a+b,0)/values.length,count:values.length})).sort((a,b)=>b.average-a.average).slice(0,5);},[tradeVotes]);
  const roastLeaders=useMemo(()=>{const scores=new Map<string,{points:number;votes:number}>();for(const roast of roasts){const vote=roastVotes[roast.code];if(!vote)continue;const old=scores.get(roast.roaster)??{points:0,votes:0};scores.set(roast.roaster,{points:old.points+vote.average*vote.votes,votes:old.votes+vote.votes});}return [...scores].map(([name,x])=>({name,average:x.points/x.votes,votes:x.votes})).sort((a,b)=>b.average-a.average).slice(0,5);},[roastVotes]);

  return <main id="top">
    <header className="site-header"><div><h1>{tab==="trades"?"Trade Ledger":"Roasts"}</h1><p>{tab==="trades"?`${trades.length} recorded trades`:`${roasts.length} all-timers`}</p><nav className="tabs" aria-label="Site sections"><button className={tab==="trades"?"active":""} onClick={()=>setTab("trades")}>Trades</button><button className={tab==="roasts"?"active":""} onClick={()=>setTab("roasts")}>Roasts</button></nav></div></header>
    {tab==="trades"?<section className="ledger">
      <div className="filters">
        <label>Team<select value={team} onChange={e=>setTeam(e.target.value)}>{teamFilters.map((item,i)=><option value={i} key={item.label}>{item.label}</option>)}</select></label>
        <label>Year<select value={year} onChange={e=>setYear(e.target.value)}><option value="all">All years</option><option value="2025">2025</option><option value="2026">2026</option></select></label>
        <label>Month<select value={month} onChange={e=>setMonth(e.target.value)}>{months.map((name,i)=><option value={i===0?"all":i} key={name}>{name}</option>)}</select></label>
        <label className="search">Player or asset<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search…"/></label>
        <div className="pills" aria-label="Trade type">{quickFilters.map(item=><button key={item.id} className={quick===item.id?"active":""} onClick={()=>setQuick(item.id)}>{item.label}</button>)}</div>
      </div>
      <div className="results"><p><strong>{filtered.length}</strong> trades</p><div className="result-actions">{(year!=="all"||month!=="all"||team!=="0"||quick!=="all"||query)&&<button onClick={clear}>Clear filters</button>}<button onClick={()=>exportExcel(filtered)}>Export Excel</button><button onClick={()=>exportJson(filtered)}>Export JSON</button></div></div>
      {!!tradeLeaders.length&&<div className="leaderboard"><strong>Community trade winners</strong>{tradeLeaders.map((x,i)=><span key={x.name}>{i+1}. {x.name} <b>{x.average>0?"+":""}{x.average.toFixed(1)}</b></span>)}</div>}
      <div className="trade-grid">{filtered.map(trade=><article className="trade-card" key={trade.id}>
        <div className="trade-meta"><time dateTime={trade.date}>{new Date(`${trade.date}T12:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</time><span>{trade.august?"August":trade.cash?"Cash":trade.picks?"Picks":"Players"}</span></div>
        <div className="side"><h2>{trade.partyA}</h2><div className="assets"><AssetList text={trade.sendsA}/></div></div>
        <div className="divider"><span>⇅</span></div>
        <div className="side"><h2>{trade.partyB}</h2><div className="assets"><AssetList text={trade.sendsB}/></div></div>
        <TradeVote id={trade.id} left={trade.partyA} right={trade.partyB} summary={tradeVotes[trade.id]} onSaved={updateVotes}/>
      </article>)}
      {!filtered.length&&<div className="empty"><strong>No trades found</strong><button onClick={clear}>Clear filters</button></div>}</div>
    </section>:<section className="ledger roasts">
      <div className="filters roast-filters">
        <label>Roaster<select value={roaster} onChange={e=>setRoaster(e.target.value)}><option value="all">All roasters</option>{people.map(person=><option key={person}>{person}</option>)}</select></label>
        <label>Roasted<select value={roasted} onChange={e=>setRoasted(e.target.value)}><option value="all">Everyone roasted</option>{people.map(person=><option key={person}>{person}</option>)}</select></label>
      </div>
      <div className="results"><p><strong>{filteredRoasts.length}</strong> roasts</p>{(roaster!=="all"||roasted!=="all")&&<button onClick={()=>{setRoaster("all");setRoasted("all")}}>Clear filters</button>}</div>
      {!!roastLeaders.length&&<div className="leaderboard"><strong>Top roasters</strong>{roastLeaders.map((x,i)=><span key={x.name}>{i+1}. {x.name} <b>{x.average.toFixed(1)} ★</b></span>)}</div>}
      <div className="roast-list">{filteredRoasts.map(item=><article className="roast-card" key={item.code}>
        <div className="roast-meta"><strong>{item.code}</strong><time dateTime={item.date}>{new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</time></div>
        <div className="roast-names"><span><small>Roaster</small>{item.roaster}</span><span className="roast-arrow">→</span><span><small>Roasted</small>{item.roasted}</span></div>
        <blockquote>“{item.roast}”</blockquote>
        <p className="roast-context">{item.context}</p>
        <div className="flags">{item.flags.map(flag=><span key={flag}>{flag}</span>)}</div>
        <RoastVote id={item.code} summary={roastVotes[item.code]} onSaved={updateVotes}/>
      </article>)}</div>
    </section>}
  </main>;
}
