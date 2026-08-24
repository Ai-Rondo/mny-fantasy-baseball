"use client";

import { useMemo, useState } from "react";
import trades from "./trades.json";

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

  return <main id="top">
    <header className="site-header"><div><h1>Trade Ledger</h1><p>{trades.length} recorded trades</p></div></header>
    <section className="ledger">
      <div className="filters">
        <label>Team<select value={team} onChange={e=>setTeam(e.target.value)}>{teamFilters.map((item,i)=><option value={i} key={item.label}>{item.label}</option>)}</select></label>
        <label>Year<select value={year} onChange={e=>setYear(e.target.value)}><option value="all">All years</option><option value="2025">2025</option><option value="2026">2026</option></select></label>
        <label>Month<select value={month} onChange={e=>setMonth(e.target.value)}>{months.map((name,i)=><option value={i===0?"all":i} key={name}>{name}</option>)}</select></label>
        <label className="search">Player or asset<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search…"/></label>
        <div className="pills" aria-label="Trade type">{quickFilters.map(item=><button key={item.id} className={quick===item.id?"active":""} onClick={()=>setQuick(item.id)}>{item.label}</button>)}</div>
      </div>
      <div className="results"><p><strong>{filtered.length}</strong> trades</p>{(year!=="all"||month!=="all"||team!=="0"||quick!=="all"||query)&&<button onClick={clear}>Clear filters</button>}</div>
      <div className="trade-grid">{filtered.map(trade=><article className="trade-card" key={trade.id}>
        <div className="trade-meta"><time dateTime={trade.date}>{new Date(`${trade.date}T12:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</time><span>{trade.august?"August":trade.cash?"Cash":trade.picks?"Picks":"Players"}</span></div>
        <div className="side"><h2>{trade.partyA}</h2><div className="assets"><AssetList text={trade.sendsA}/></div></div>
        <div className="divider"><span>⇅</span></div>
        <div className="side"><h2>{trade.partyB}</h2><div className="assets"><AssetList text={trade.sendsB}/></div></div>
      </article>)}
      {!filtered.length&&<div className="empty"><strong>No trades found</strong><button onClick={clear}>Clear filters</button></div>}</div>
    </section>
  </main>;
}
