"use client";

import { useMemo, useState } from "react";
import trades from "./trades.json";

const months = ["All months","January","February","March","April","May","June","July","August","September","October","November","December"];
const quickFilters = [{id:"all",label:"All trades"},{id:"cash",label:"Cash involved"},{id:"picks",label:"Draft picks"},{id:"august",label:"August deadline"}];
const currentOwners = [
  ["Vandelay Industries","Kyle Gilkey"],["Benge Drinker","Jon Benge"],["Honey Nut Churios","Benjamin Sorace"],["Cin City 69ers","Jeff Cleek"],
  ["Tanner Houck Tuah","Austin Gretencord"],["The Voey Jottos","Ryan Penrod"],["The Injured List","Jason Penrod"],["I Schlitt my pants","Ron Cipriano"],
  ["VIPBenchWarm…","Jose Perez"],["Preller's Pentho…","Michael Alvarado"],["Way She Goes","Matt Witmer"],["Show Me Your Tatis","Juan Barrera"],
];

function AssetList({text}:{text:string}) { return <>{text.split(";").map(item=><span className="asset" key={item}>{item.trim()}</span>)}</>; }

export default function Home() {
  const [year,setYear]=useState("all"), [month,setMonth]=useState("all"), [quick,setQuick]=useState("all"), [query,setQuery]=useState(""), [ownersOpen,setOwnersOpen]=useState(false);
  const filtered=useMemo(()=>trades.filter(trade=>{
    const haystack=`${trade.partyA} ${trade.sendsA} ${trade.partyB} ${trade.sendsB}`.toLowerCase();
    return (year==="all"||trade.year===Number(year))&&(month==="all"||trade.month===Number(month))
      &&(quick==="all"||(quick==="cash"&&trade.cash)||(quick==="picks"&&trade.picks)||(quick==="august"&&trade.august))
      &&(!query||haystack.includes(query.toLowerCase()));
  }),[year,month,quick,query]);
  const clear=()=>{setYear("all");setMonth("all");setQuick("all");setQuery("");};
  return <main>
    <header className="hero"><nav><a className="mark" href="#top" aria-label="MNY Fantasy Baseball home">MNY<span>FB</span></a><button onClick={()=>setOwnersOpen(!ownersOpen)}>2026 owners <span aria-hidden="true">↗</span></button></nav>
      <div className="hero-copy" id="top"><p className="eyebrow">THE LEAGUE ARCHIVE · EST. 2024</p><h1>Every deal.<br/><em>One ledger.</em></h1><p className="dek">A searchable history of the trades that shaped Maybe Next Year Fantasy Baseball.</p>
        <div className="scoreboard"><div><strong>{trades.length}</strong><span>Trades logged</span></div><div><strong>{trades.filter(t=>t.cash).length}</strong><span>Cash deals</span></div><div><strong>{trades.filter(t=>t.august).length}</strong><span>August deals</span></div></div></div><div className="baseball" aria-hidden="true"><span>TRADE</span></div></header>
    {ownersOpen&&<section className="owners" aria-label="Current owner directory"><div className="section-head"><div><p className="eyebrow">CURRENT ALIGNMENT</p><h2>2026 owner directory</h2></div><button onClick={()=>setOwnersOpen(false)}>Close</button></div><div className="owner-grid">{currentOwners.map(([team,owner])=><div className="owner" key={team}><strong>{team}</strong><span>{owner}</span></div>)}</div><p className="owner-note">Team names change often. Historical trades retain the name used when the deal was posted.</p></section>}
    <section className="explorer"><div className="section-head"><div><p className="eyebrow">TRANSACTION WIRE</p><h2>Trade explorer</h2></div><p className="result-count"><strong>{filtered.length}</strong> of {trades.length} deals</p></div>
      <div className="filter-panel"><div className="search-wrap"><label htmlFor="search">Search owners, teams or players</label><input id="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Try Elly, Austin, 1st round…"/><span aria-hidden="true">⌕</span></div>
        <div className="selects"><label>Season<select value={year} onChange={e=>setYear(e.target.value)}><option value="all">All years</option><option value="2025">2025</option><option value="2026">2026</option></select></label><label>Month<select value={month} onChange={e=>setMonth(e.target.value)}>{months.map((name,i)=><option value={i===0?"all":i} key={name}>{name}</option>)}</select></label></div>
        <div className="pills" aria-label="Quick filters">{quickFilters.map(item=><button key={item.id} className={quick===item.id?"active":""} onClick={()=>setQuick(item.id)}>{item.label}</button>)}</div></div>
      <div className="trade-list">{filtered.map(trade=><article className="trade-card" key={trade.id}><div className="trade-meta"><time dateTime={trade.date}>{new Date(`${trade.date}T12:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</time><span>{trade.august?"Deadline deal":trade.cash?"Cash deal":trade.picks?"Draft capital":"Player swap"}</span><b>{trade.id}</b></div>
        <div className="matchup"><div className="side"><p>SENDS</p><h3>{trade.partyA}</h3><div className="assets"><AssetList text={trade.sendsA}/></div></div><div className="swap" aria-label="traded with">⇄</div><div className="side"><p>SENDS</p><h3>{trade.partyB}</h3><div className="assets"><AssetList text={trade.sendsB}/></div></div></div></article>)}
        {!filtered.length&&<div className="empty"><strong>No deals found.</strong><p>Try clearing a filter or searching a different player.</p><button onClick={clear}>Reset filters</button></div>}</div></section>
    <footer><div className="mark">MNY<span>FB</span></div><p>Built from league chat records. Team names and ownership can change year to year.</p><a href="#top">Back to top ↑</a></footer>
  </main>;
}
