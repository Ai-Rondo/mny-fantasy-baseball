"use client";

import { useEffect, useMemo, useState } from "react";
import trades from "./trades.json";
import roasts from "./roasts.json";
import drafts from "./drafts.json";
import { exportExcel, exportJson } from "./exports";
import { RoastVote, TradeVote, type VoteSummary } from "./voting";
import { RosterPortal, type RosterData } from "./roster-portal";

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
  return <>{text.split(";").map(raw=>{const item=raw.trim();const isPlayer=!/^\$/i.test(item)&&!/(?:draft|pick|cash|capital)/i.test(item);if(!isPlayer)return <span className="asset" key={item}>{item}</span>;const player=item.replace(/\s*\([^)]*\)\s*$/,"");return <a className="asset player-link" href={`https://www.baseball-reference.com/search/search.fcgi?search=${encodeURIComponent(player)}`} target="_blank" rel="noreferrer" title={`View ${player} on Baseball Reference`} key={item}>{item}</a>;})}</>;
}

function LeaderboardPage({tradeRows,roastRows}:{tradeRows:Array<{name:string;average:number;votes:number}>;roastRows:Array<{name:string;given?:number;givenVotes:number;received?:number;receivedVotes:number}>}) {
  return <section className="ledger leaderboard-page"><div className="standing-card"><div className="standing-head"><h2>Best traders</h2><p>Average result from rated trades · −10 to +10</p></div><div className="leader-table"><div className="leader-row heading"><span>Owner</span><span>Score</span><span>Votes</span></div>{tradeRows.map((row,i)=><div className="leader-row" key={row.name}><span><b>{i+1}</b>{row.name}</span><strong className={row.average>0?"positive":row.average<0?"negative":""}>{row.average>0?"+":""}{row.average.toFixed(1)}</strong><span>{row.votes}</span></div>)}{!tradeRows.length&&<p className="no-ratings">No trade votes yet.</p>}</div></div><div className="standing-card"><div className="standing-head"><h2>Roast standings</h2><p>Average stars for roasts given and times roasted</p></div><div className="leader-table roast-leader-table"><div className="leader-row heading"><span>Person</span><span>Roasts given</span><span>Times roasted</span></div>{roastRows.map((row,i)=><div className="leader-row" key={row.name}><span><b>{i+1}</b>{row.name}</span><strong>{row.given===undefined?"—":`${row.given.toFixed(1)} ★`}<small>{row.givenVotes?`${row.givenVotes} ratings`:""}</small></strong><strong>{row.received===undefined?"—":`${row.received.toFixed(1)} ★`}<small>{row.receivedVotes?`${row.receivedVotes} ratings`:""}</small></strong></div>)}{!roastRows.length&&<p className="no-ratings">No roast ratings yet.</p>}</div></div></section>;
}

function DraftHistory() {
  return <section className="ledger draft-history">{drafts.map(draft=><article className="draft-season" key={draft.year}>
    <div className="draft-season-head"><div><h2>{draft.year} Minor League Draft</h2><p>{draft.note}</p></div><time dateTime={draft.date}>{new Date(`${draft.date}T12:00:00`).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</time></div>
    <div className="draft-table"><div className="draft-row heading"><span>Overall</span><span>Round / Pick</span><span>Owner</span><span>Player</span></div>{draft.picks.map(pick=><div className="draft-row" key={`${draft.year}-${pick.overall}`}><strong>#{pick.overall}</strong><span>{pick.round}.{pick.pick}</span><span>{pick.owner}</span><a className="draft-player" href={`https://www.baseball-reference.com/search/search.fcgi?search=${encodeURIComponent(pick.player)}`} target="_blank" rel="noreferrer">{pick.player}</a></div>)}</div>
  </article>)}</section>;
}

export default function Home() {
  const [tradeVotes,setTradeVotes]=useState<VoteSummary>({});
  const [roastVotes,setRoastVotes]=useState<VoteSummary>({});
  const updateVotes=(data:unknown)=>{const payload=data as {trades?:Array<{id:string;average:number;votes:number}>;roasts?:Array<{id:string;average:number;votes:number}>};setTradeVotes(Object.fromEntries((payload.trades??[]).map(x=>[x.id,x])));setRoastVotes(Object.fromEntries((payload.roasts??[]).map(x=>[x.id,x])));};
  useEffect(()=>{fetch("/api/votes").then(r=>r.ok?r.json():Promise.reject()).then(updateVotes).catch(()=>{});},[]);
  const [tab,setTab]=useState<"trades"|"roasts"|"leaderboard"|"drafts"|"rosters">("trades");
  const [rosterAuthorized,setRosterAuthorized]=useState(false);
  const [rosterData,setRosterData]=useState<RosterData|null>(null);
  const [passwordOpen,setPasswordOpen]=useState(false);
  const [password,setPassword]=useState("");
  const [passwordError,setPasswordError]=useState("");
  const [passwordBusy,setPasswordBusy]=useState(false);
  const loadRosterData=async()=>{const response=await fetch("/api/rosters/data",{credentials:"same-origin"});if(!response.ok)throw new Error("Roster room is locked.");const data=await response.json() as RosterData;setRosterData(data);setRosterAuthorized(true);return data;};
  useEffect(()=>{fetch("/api/rosters/login",{credentials:"same-origin"}).then(response=>response.ok?response.json():Promise.reject()).then(({authorized}:{authorized:boolean})=>authorized?loadRosterData():undefined).catch(()=>{});},[]);
  const unlockRoster=async(event:React.FormEvent)=>{event.preventDefault();setPasswordBusy(true);setPasswordError("");try{const response=await fetch("/api/rosters/login",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({password})});if(!response.ok)throw new Error("That password did not unlock the roster room.");await loadRosterData();setPassword("");setPasswordOpen(false);setTab("rosters");}catch(error){setPasswordError(error instanceof Error?error.message:"Could not unlock the roster room.");}finally{setPasswordBusy(false);}};
  const lockRoster=async()=>{await fetch("/api/rosters/login",{method:"DELETE",credentials:"same-origin"}).catch(()=>{});setRosterAuthorized(false);setRosterData(null);setTab("trades");};
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
  const tradeLeaders=useMemo(()=>{const scores=new Map<string,{points:number;votes:number}>();for(const trade of trades){const vote=tradeVotes[trade.id];if(!vote)continue;for(const [name,score] of [[trade.partyA,-vote.average],[trade.partyB,vote.average]] as const){const old=scores.get(name)??{points:0,votes:0};scores.set(name,{points:old.points+score*vote.votes,votes:old.votes+vote.votes});}}return [...scores].map(([name,x])=>({name,average:x.points/x.votes/10,votes:x.votes})).sort((a,b)=>b.average-a.average);},[tradeVotes]);
  const roastLeaders=useMemo(()=>{const scores=new Map<string,{givenPoints:number;givenVotes:number;receivedPoints:number;receivedVotes:number}>();const get=(name:string)=>scores.get(name)??{givenPoints:0,givenVotes:0,receivedPoints:0,receivedVotes:0};for(const roast of roasts){const vote=roastVotes[roast.code];if(!vote)continue;const giver=get(roast.roaster);scores.set(roast.roaster,{...giver,givenPoints:giver.givenPoints+vote.average*vote.votes,givenVotes:giver.givenVotes+vote.votes});const target=get(roast.roasted);scores.set(roast.roasted,{...target,receivedPoints:target.receivedPoints+vote.average*vote.votes,receivedVotes:target.receivedVotes+vote.votes});}return [...scores].map(([name,x])=>({name,given:x.givenVotes?x.givenPoints/x.givenVotes:undefined,givenVotes:x.givenVotes,received:x.receivedVotes?x.receivedPoints/x.receivedVotes:undefined,receivedVotes:x.receivedVotes})).sort((a,b)=>(b.given??0)-(a.given??0));},[roastVotes]);

  return <main id="top">
    <header className="site-header"><div><div className="site-title"><h1>Maybe Next Year Fantasy Baseball League History</h1><p>{tab==="trades"?`${trades.length} recorded trades`:tab==="roasts"?`${roasts.length} all-timers`:tab==="drafts"?`${drafts.reduce((total,draft)=>total+draft.picks.length,0)} draft picks`:tab==="rosters"?"Private 2027 front office":"Community standings"}</p></div><button className={`roster-unlock${rosterAuthorized?" unlocked":""}`} aria-label={rosterAuthorized?"Open roster room":"Unlock roster room"} title="Roster room" onClick={()=>rosterAuthorized?setTab("rosters"):setPasswordOpen(true)}>⚾</button><nav className="tabs" aria-label="Site sections"><button className={tab==="trades"?"active":""} onClick={()=>setTab("trades")}>Trades</button><button className={tab==="roasts"?"active":""} onClick={()=>setTab("roasts")}>Roasts</button><button className={tab==="leaderboard"?"active":""} onClick={()=>setTab("leaderboard")}>Leaderboard</button><button className={tab==="drafts"?"active":""} onClick={()=>setTab("drafts")}>Previous Drafts</button>{rosterAuthorized&&<button className={`roster-tab${tab==="rosters"?" active":""}`} onClick={()=>setTab("rosters")}>Rosters</button>}</nav></div></header>
    {passwordOpen&&<div className="password-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setPasswordOpen(false)}}><section className="password-dialog" role="dialog" aria-modal="true" aria-labelledby="roster-password-title"><div className="password-dialog-head"><span aria-hidden="true">⚾</span><h2 id="roster-password-title">Roster room</h2><p>Enter the league password to continue.</p></div><form onSubmit={unlockRoster}><label>Password<input type="password" value={password} onChange={event=>setPassword(event.target.value)} autoComplete="current-password"/></label>{passwordError&&<p className="password-error" role="alert">{passwordError}</p>}<div className="password-actions"><button type="button" onClick={()=>setPasswordOpen(false)}>Cancel</button><button type="submit" disabled={passwordBusy||!password}>{passwordBusy?"Unlocking…":"Unlock"}</button></div></form></section></div>}
    {tab==="trades"?<section className="ledger">
      <div className="filters">
        <label>Team<select value={team} onChange={e=>setTeam(e.target.value)}>{teamFilters.map((item,i)=><option value={i} key={item.label}>{item.label}</option>)}</select></label>
        <label>Year<select value={year} onChange={e=>setYear(e.target.value)}><option value="all">All years</option><option value="2025">2025</option><option value="2026">2026</option></select></label>
        <label>Month<select value={month} onChange={e=>setMonth(e.target.value)}>{months.map((name,i)=><option value={i===0?"all":i} key={name}>{name}</option>)}</select></label>
        <label className="search">Player or asset<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search…"/></label>
        <div className="pills" aria-label="Trade type">{quickFilters.map(item=><button key={item.id} className={quick===item.id?"active":""} onClick={()=>setQuick(item.id)}>{item.label}</button>)}</div>
      </div>
      <div className="results"><p><strong>{filtered.length}</strong> trades</p><div className="result-actions">{(year!=="all"||month!=="all"||team!=="0"||quick!=="all"||query)&&<button onClick={clear}>Clear filters</button>}<button onClick={()=>exportExcel(filtered)}>Export Excel</button><button onClick={()=>exportJson(filtered)}>Export JSON</button></div></div>
      <div className="trade-grid">{filtered.map(trade=><article className="trade-card" key={trade.id}>
        <div className="trade-meta"><time dateTime={trade.date}>{new Date(`${trade.date}T12:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</time><span>{trade.august?"August":trade.cash?"Cash":trade.picks?"Picks":"Players"}</span></div>
        <div className="side"><h2>{trade.partyA}</h2><div className="assets"><AssetList text={trade.sendsA}/></div></div>
        <div className="divider"><span>⇅</span></div>
        <div className="side"><h2>{trade.partyB}</h2><div className="assets"><AssetList text={trade.sendsB}/></div></div>
        <TradeVote id={trade.id} left={trade.partyA} right={trade.partyB} summary={tradeVotes[trade.id]} onSaved={updateVotes}/>
      </article>)}
      {!filtered.length&&<div className="empty"><strong>No trades found</strong><button onClick={clear}>Clear filters</button></div>}</div>
    </section>:tab==="roasts"?<section className="ledger roasts">
      <div className="filters roast-filters">
        <label>Roaster<select value={roaster} onChange={e=>setRoaster(e.target.value)}><option value="all">All roasters</option>{people.map(person=><option key={person}>{person}</option>)}</select></label>
        <label>Roasted<select value={roasted} onChange={e=>setRoasted(e.target.value)}><option value="all">Everyone roasted</option>{people.map(person=><option key={person}>{person}</option>)}</select></label>
      </div>
      <div className="results"><p><strong>{filteredRoasts.length}</strong> roasts</p><div className="result-actions">{(roaster!=="all"||roasted!=="all")&&<button onClick={()=>{setRoaster("all");setRoasted("all")}}>Clear filters</button>}</div></div>
      <div className="roast-list">{filteredRoasts.map(item=><article className="roast-card" key={item.code}>
        <div className="roast-meta"><strong>{item.code}</strong><time dateTime={item.date}>{new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</time></div>
        <div className="roast-names"><span><small>Roaster</small>{item.roaster}</span><span className="roast-arrow">→</span><span><small>Roasted</small>{item.roasted}</span></div>
        <blockquote>“{item.roast}”</blockquote>
        <p className="roast-context">{item.context}</p>
        <div className="flags">{item.flags.map(flag=><span key={flag}>{flag}</span>)}</div>
        <RoastVote id={item.code} summary={roastVotes[item.code]} onSaved={updateVotes}/>
      </article>)}</div>
    </section>:tab==="leaderboard"?<LeaderboardPage tradeRows={tradeLeaders} roastRows={roastLeaders}/>:tab==="drafts"?<DraftHistory/>:rosterData?<RosterPortal data={rosterData} onLock={lockRoster}/>:null}
  </main>;
}
