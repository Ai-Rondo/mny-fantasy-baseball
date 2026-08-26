"use client";

import { useMemo, useState } from "react";
import drafts from "./drafts.json";

type ScoutingLink = { source: string; url: string };
type Row = Record<string, string | number | null>;
export type RosterData = {
  season: number;
  rosterSize: number;
  salaryCap: number;
  rules: Row[];
  decisions: Row[];
  teams: Array<{
    team: string;
    owner: string;
    summary: Row;
    committed: Row[];
    projected: Row[];
    expiring: Row[];
    prospects: Row[];
  }>;
};

const money = (value: unknown) => `$${Math.round(Number(value ?? 0))}`;
const playerUrl = (name: unknown) =>
  `https://www.baseball-reference.com/search/search.fcgi?search=${encodeURIComponent(String(name ?? ""))}`;
const probableDrops: Record<string, { market: number }> = {
  "Juan Soto": { market: 46 },
  "Tarik Skubal": { market: 49 },
  "Fernando Tatis Jr.": { market: 37 },
  "Ronald Acuna Jr.": { market: 41 },
  "Logan Gilbert": { market: 28 },
  "Ketel Marte": { market: 32 },
};

function PlayerLinks({ row, name }: { row: Row; name: unknown }) {
  const label = String(name ?? "");
  const savant = String((row as Record<string, unknown>)["Savant URL"] ?? "");
  return (
    <div className="player-resource">
      <strong>{label}</strong>
      <span>
        <a href={playerUrl(label)} target="_blank" rel="noreferrer">
          BB Ref
        </a>
        {savant && (
          <a href={savant} target="_blank" rel="noreferrer">
            Savant
          </a>
        )}
      </span>
    </div>
  );
}

function Timeline({ row }: { row: Row }) {
  const contract = String(row["2027 Contract"] ?? row.Contract ?? "");
  const salary = Number(row["2027 $"] ?? 0);
  let years: Array<{ year: number; salary: number }> = [];
  if (/^\d+$/.test(contract))
    years = Array.from({ length: Number(contract) }, (_, i) => ({
      year: 2027 + i,
      salary,
    }));
  else if (contract === "3mL")
    years = [
      { year: 2027, salary: 0 },
      { year: 2028, salary: 5 },
      { year: 2029, salary: 15 },
    ];
  else if (contract === "2mL")
    years = [
      { year: 2027, salary: 5 },
      { year: 2028, salary: 15 },
    ];
  else if (contract === "1mL" || contract === "1FA")
    years = [{ year: 2027, salary }];
  return (
    <div className="contract-timeline">
      {years.length ? (
        years.map((item) => (
          <span key={item.year}>
            <small>{item.year}</small>
            <b>{money(item.salary)}</b>
          </span>
        ))
      ) : (
        <em>No 2027 commitment</em>
      )}
    </div>
  );
}

function PlayerTable({
  title,
  subtitle,
  rows,
  kind,
}: {
  title: string;
  subtitle: string;
  rows: Row[];
  kind: string;
}) {
  return (
    <section className="roster-section">
      <div className="roster-section-head">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <span>{rows.length}</span>
      </div>
      {rows.length ? (
        <div className="roster-player-list">
          {rows.map((row, index) => {
            const name = String(row.Player ?? "");
            const draft = drafts
              .flatMap((d) => d.picks.map((p) => ({ ...p, year: d.year })))
              .find((p) => p.player.toLowerCase() === name.toLowerCase());
            const reportValue = (row as Record<string, unknown>)[
              "Scouting Reports"
            ];
            const reports = Array.isArray(reportValue)
              ? (reportValue as ScoutingLink[])
              : [];
            return (
              <article
                className={`roster-player ${kind}`}
                key={`${name}-${index}`}
              >
                <div className="player-identity">
                  <a href={playerUrl(name)} target="_blank" rel="noreferrer">
                    {name}
                  </a>
                  <span>
                    {row.Pos || "—"} · {row.MLB || row["MLB Org"] || "—"}
                  </span>
                  {draft && (
                    <small>
                      Drafted {draft.year} · #{draft.overall} overall
                    </small>
                  )}
                  {reports.length > 0 && (
                    <div className="scouting-links">
                      {reports.map((report) => (
                        <a
                          key={report.source}
                          href={report.url}
                          target="_blank"
                          rel="noreferrer"
                          title={`${name} scouting report from ${report.source}`}
                        >
                          <b>
                            {report.source === "Baseball America"
                              ? "BA"
                              : "MLB"}
                          </b>
                          <span>
                            {report.source === "Baseball America"
                              ? "Scouting"
                              : "Pipeline"}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="player-status">
                  <small>
                    {row["2026 Status"] ||
                      row["2027 Projection"] ||
                      row.Type ||
                      "Status"}
                  </small>
                  <b>{row["2027 Contract"] || row.Contract || "—"}</b>
                </div>
                <Timeline row={row} />
                <div className="player-points">
                  <small>2026 FPTS</small>
                  <b>
                    {Number(row["2026 FPTS"] ?? 0).toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}
                  </b>
                </div>
                {(row.Basis || row.Comment) && (
                  <p className="player-note">{row.Basis || row.Comment}</p>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="roster-empty">None currently projected.</p>
      )}
    </section>
  );
}

function RosterDepthChart({ rows }: { rows: Row[] }) {
  const slots = [
    "C",
    "1B",
    "2B",
    "3B",
    "SS",
    "OF",
    "OF",
    "OF",
    "UTIL",
    "UTIL",
    "SP",
    "SP",
    "SP",
    "SP",
    "SP",
    "RP",
    "RP",
    "RP",
    "BN",
    "BN",
    "BN",
    "BN",
  ];
  const remaining = rows.map((row, index) => ({ row, index }));
  const eligible = (row: Row, slot: string) => {
    const pos = String(row.Pos ?? "")
      .split(",")
      .map((item) => item.trim());
    if (slot === "BN") return true;
    if (slot === "UTIL")
      return pos.some((item) => !["SP", "RP", "P"].includes(item));
    return (
      pos.includes(slot) ||
      (slot === "SP" && pos.includes("P")) ||
      (slot === "RP" && pos.includes("P"))
    );
  };
  const assigned = slots.map((slot) => {
    const match = remaining.findIndex((item) => eligible(item.row, slot));
    return {
      slot,
      player: match < 0 ? null : remaining.splice(match, 1)[0].row,
    };
  });
  return (
    <section className="depth-chart">
      <div className="depth-row heading">
        <span>Slot</span>
        <span>Player</span>
        <span>Pos</span>
        <span>2027</span>
        <span>Deal</span>
        <span>2026 FPTS</span>
      </div>
      {assigned.map(({ slot, player }, index) => {
        const possibleOption =
          player &&
          (String(player.Type) === "FA Option" ||
            String(player["2027 Contract"]) === "1FA");
        const possibleDrop = player && probableDrops[String(player.Player)];
        return (
          <div
            className={`depth-row${player ? "" : " empty-slot"}${possibleOption ? " option-player" : ""}${possibleDrop ? " drop-player" : ""}`}
            key={`${slot}-${index}`}
          >
            <b>{slot}</b>
            {player ? (
              <>
                <PlayerLinks row={player} name={player.Player} />
                <span>{player.Pos}</span>
                <strong>{money(player["2027 $"])}</strong>
                {possibleDrop ? (
                  <em className="drop-note">Probable drop</em>
                ) : possibleOption ? (
                  <em className="keeper-option">Possible $15 Keeper</em>
                ) : (
                  <span>
                    {player["2027 Contract"] || player.Contract || "—"}
                  </span>
                )}
                <span>
                  {Number(player["2026 FPTS"] ?? 0).toLocaleString("en-US", {
                    maximumFractionDigits: 1,
                  })}
                </span>
              </>
            ) : (
              <>
                <em>Empty</em>
                <span>—</span>
                <span>—</span>
                <span>—</span>
                <span>—</span>
              </>
            )}
          </div>
        );
      })}
    </section>
  );
}

export function RosterPortal({ data }: { data: RosterData }) {
  const [selected, setSelected] = useState(data.teams[0].team);
  const [view, setView] = useState<
    "team" | "contracts" | "auction" | "farm" | "rules"
  >("team");
  const [auctionPosition, setAuctionPosition] = useState("All");
  const [farmPosition, setFarmPosition] = useState("All");
  const [rosterMode, setRosterMode] = useState<"projected" | "contracted">(
    "projected",
  );
  const team = useMemo(
    () => data.teams.find((item) => item.team === selected) ?? data.teams[0],
    [data, selected],
  );
  const auction = useMemo(
    () =>
      data.teams
        .flatMap((item) => [
          ...item.expiring.map((row) => ({
            ...row,
            FormerTeam: item.team,
            Owner: item.owner,
            AuctionStatus: "Expected Auction",
          })),
          ...item.projected
            .filter((row) => String(row.Type) === "FA Option")
            .map((row) => ({
              ...row,
              FormerTeam: item.team,
              Owner: item.owner,
              AuctionStatus: "$15 Option Keeper",
            })),
          ...item.committed
            .filter((row) => probableDrops[String(row.Player)])
            .map((row) => ({
              ...row,
              FormerTeam: item.team,
              Owner: item.owner,
              AuctionStatus: "Under contract · probable drop",
            })),
        ])
        .filter(
          (row) =>
            auctionPosition === "All" ||
            String(row.Pos).split(",").includes(auctionPosition),
        )
        .sort((a, b) => {
          const priority = (status: string) =>
            status === "$15 Option Keeper"
              ? 0
              : status.includes("probable drop")
                ? 1
                : 2;
          return (
            priority(a.AuctionStatus) - priority(b.AuctionStatus) ||
            Number(b["2026 FPTS"] ?? 0) - Number(a["2026 FPTS"] ?? 0)
          );
        }),
    [data, auctionPosition],
  );
  const farm = useMemo(
    () =>
      data.teams
        .flatMap((item) =>
          item.prospects.map((row) => ({
            ...row,
            FantasyTeam: item.team,
            Owner: item.owner,
          })),
        )
        .filter(
          (row) =>
            farmPosition === "All" ||
            String(row.Pos).split(",").includes(farmPosition),
        )
        .sort(
          (a, b) =>
            Number(a["MLB Pipeline Rank"] ?? 999) -
              Number(b["MLB Pipeline Rank"] ?? 999) ||
            Number(String(b["Roster %"] ?? "0").replace("%", "")) -
              Number(String(a["Roster %"] ?? "0").replace("%", "")),
        ),
    [data, farmPosition],
  );
  const positions = ["All", "C", "1B", "2B", "3B", "SS", "OF", "SP", "RP"];
  const contractRows = [...team.committed, ...team.projected];
  const projectedRows = [
    ...team.committed.filter((row) => !probableDrops[String(row.Player)]),
    ...team.projected,
  ];
  const rosterRows =
    rosterMode === "projected" ? projectedRows : team.committed;
  const rosterPayroll = rosterRows.reduce(
    (total, row) => total + Number(row["2027 $"] ?? 0),
    0,
  );
  const rosterSpots = Math.max(0, data.rosterSize - rosterRows.length);
  const rosterBudget = data.salaryCap - rosterPayroll;
  const teamDrafts = drafts
    .filter((draft) => draft.year === 2025 || draft.year === 2026)
    .flatMap((draft) =>
      draft.picks
        .filter((pick) => pick.owner === team.owner)
        .map((pick) => ({
          ...pick,
          year: draft.year,
          current: team.prospects.some(
            (row) =>
              String(row.Player)
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase() ===
              pick.player
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase(),
          ),
        })),
    )
    .sort((a, b) => b.year - a.year || a.overall - b.overall);
  const farmSystems: Array<{
    item: RosterData["teams"][number];
    ranked: number;
    score: number;
  }> = [];
  const salaryYears = (row: Row) => {
    const contract = String(row["2027 Contract"] ?? row.Contract ?? "");
    const salary = Number(row["2027 $"] ?? 0);
    if (/^\d+$/.test(contract))
      return [2027, 2028, 2029].map((year, i) =>
        i < Number(contract) ? salary : null,
      );
    if (contract === "3mL") return [0, 5, 15];
    if (contract === "2mL") return [5, 15, null];
    if (contract === "1mL" || contract === "1FA") return [salary, null, null];
    return [null, null, null];
  };
  return (
    <section className="ledger roster-portal">
      <div className="roster-command">
        <div>
          <span>2027 LEAGUE OFFICE</span>
          <h2>Rosters &amp; Player Pool</h2>
        </div>
        <div className="roster-command-actions">
          <div className="roster-view-tabs">
            {[
              ["team", "Rosters"],
              ["contracts", "Budgets"],
              ["auction", "Auction Pool"],
              ["farm", "Farm Rankings"],
            ].map(([id, label]) => (
              <button
                key={id}
                className={view === id ? "active" : ""}
                onClick={() => setView(id as typeof view)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {(view === "team" || view === "contracts") && (
        <div className="team-selector">
          <label>
            Club
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {data.teams.map((item) => (
                <option key={item.team}>{item.team}</option>
              ))}
            </select>
          </label>
          <div className="team-heading">
            <span>{team.owner}</span>
            <h2>{team.team}</h2>
            <div className="roster-mode-toggle" aria-label="Roster projection">
              <button
                className={rosterMode === "projected" ? "active" : ""}
                onClick={() => setRosterMode("projected")}
              >
                Projected
              </button>
              <button
                className={rosterMode === "contracted" ? "active" : ""}
                onClick={() => setRosterMode("contracted")}
              >
                Under Contract
              </button>
            </div>
          </div>
        </div>
      )}
      {view === "rules" ? (
        <div className="roster-rules">
          <section>
            <h3>Contract projection rules</h3>
            {data.rules.map((rule, i) => (
              <article key={i}>
                <strong>{rule.Rule}</strong>
                <span>{rule["2027 Treatment"]}</span>
                <p>{rule.Reason}</p>
              </article>
            ))}
          </section>
          <section>
            <h3>Current projection decisions</h3>
            {data.decisions.map((decision, i) => (
              <article key={i}>
                <strong>{decision.Player}</strong>
                <span>
                  {decision.Team} · {decision.Decision}
                </span>
                <p>{decision.Basis}</p>
              </article>
            ))}
          </section>
        </div>
      ) : view === "auction" ? (
        <>
          <div className="board-head">
            <div>
              <h2>2027 Auction Pool</h2>
              <p>All expiring contracts · possible keepers remain listed</p>
            </div>
            <label>
              Position
              <select
                value={auctionPosition}
                onChange={(e) => setAuctionPosition(e.target.value)}
              >
                {positions.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="data-board">
            <div className="data-row auction-row heading">
              <span>#</span>
              <span>Player</span>
              <span>Pos</span>
              <span>Former team</span>
              <span>Old salary</span>
              <span>Status</span>
              <span>2026 FPTS</span>
            </div>
            {auction.map((row, i) => (
              <div
                className={`data-row auction-row ${row.AuctionStatus === "$15 Option Keeper" ? "option-player" : row.AuctionStatus.includes("probable drop") ? "drop-player" : ""}`}
                key={`${row.Player}-${row.FormerTeam}`}
              >
                <b>{i + 1}</b>
                <PlayerLinks row={row} name={row.Player} />
                <span>{row.Pos}</span>
                <span>{row.FormerTeam}</span>
                <strong>{money(row["2026 $"])}</strong>
                <em
                  className={
                    row.AuctionStatus === "$15 Option Keeper"
                      ? "possible-keeper"
                      : row.AuctionStatus.includes("probable drop")
                        ? "probable-drop"
                        : ""
                  }
                >
                  {row.AuctionStatus}
                </em>
                <span>{Number(row["2026 FPTS"] ?? 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>
      ) : view === "farm" ? (
        <>
          <div className="board-head">
            <div>
              <h2>League Farm Rankings</h2>
              <p>
                Current MLB Pipeline rank first, then roster rate · includes
                projected graduates
              </p>
            </div>
            <label>
              Position
              <select
                value={farmPosition}
                onChange={(e) => setFarmPosition(e.target.value)}
              >
                {positions.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="farm-system-strip">
            {farmSystems.map(({ item, ranked, score }) => (
              <button
                key={item.team}
                onClick={() => {
                  setSelected(item.team);
                  setView("team");
                }}
              >
                <strong>{item.team}</strong>
                <span>
                  {ranked} Top 100 · {score} pts
                </span>
              </button>
            ))}
          </div>
          <div className="data-board">
            <div className="data-row farm-heading heading">
              <span>Rank</span>
              <span>Player</span>
              <span>Pos</span>
              <span>Fantasy team</span>
              <span>MLB Org</span>
              <span>2027 outlook</span>
            </div>
            {farm.map((row, i) => (
              <div
                className="data-row farm-heading"
                key={`${row.Player}-${row.FantasyTeam}`}
              >
                <b>
                  {row["MLB Pipeline Rank"]
                    ? `#${row["MLB Pipeline Rank"]}`
                    : `— ${i + 1}`}
                </b>
                <a
                  href={playerUrl(row.Player)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {row.Player}
                </a>
                <span>{row.Pos}</span>
                <span>{row.FantasyTeam}</span>
                <span>{row["MLB Org"]}</span>
                <strong>{row["2027 Projection"]}</strong>
              </div>
            ))}
          </div>
          <p className="ranking-source">
            Current ranks: MLB Pipeline in-season Top 100, August 2026. Unranked
            players are ordered by roster percentage.
          </p>
        </>
      ) : view === "contracts" ? (
        <>
          <div className="budget-dashboard">
            <article>
              <small>
                {rosterMode === "projected"
                  ? "Projected payroll"
                  : "Contracted payroll"}
              </small>
              <strong>{money(rosterPayroll)}</strong>
              <span>of {money(data.salaryCap)}</span>
            </article>
            <article className="budget-available">
              <small>Draft budget</small>
              <strong>{money(rosterBudget)}</strong>
              <span>{rosterSpots} open spots</span>
            </article>
            <article>
              <small>Buying power</small>
              <strong>
                {money(rosterSpots ? rosterBudget / rosterSpots : 0)}
              </strong>
              <span>per open spot</span>
            </article>
            <article>
              <small>Rostered</small>
              <strong>{rosterRows.length}</strong>
              <span>
                {rosterMode === "projected"
                  ? "after likely drops"
                  : "current contracts"}
              </span>
            </article>
            <div className="cap-meter">
              <i
                style={{
                  width: `${Math.min(100, (rosterPayroll / data.salaryCap) * 100)}%`,
                }}
              />
              <span>
                {Math.round((rosterPayroll / data.salaryCap) * 100)}% of cap
              </span>
            </div>
          </div>
          <div className="contract-grid">
            <div className="contract-grid-row heading">
              <span>Player</span>
              <span>Pos</span>
              <b>2027</b>
              <b>2028</b>
              <b>2029</b>
            </div>
            {contractRows.map((row, i) => {
              const possibleOption =
                String(row.Type) === "FA Option" ||
                String(row["2027 Contract"]) === "1FA";
              const possibleDrop = probableDrops[String(row.Player)];
              return (
                <div
                  className={`contract-grid-row${possibleOption ? " option-player" : ""}${possibleDrop ? " drop-player" : ""}`}
                  key={`${row.Player}-${i}`}
                >
                  <PlayerLinks row={row} name={row.Player} />
                  {possibleOption && <small>Possible $15 keeper</small>}
                  {possibleDrop && (
                    <small className="drop-note">
                      Probable drop · market ~{money(possibleDrop.market)}
                    </small>
                  )}
                  <span>{row.Pos}</span>
                  {salaryYears(row).map((salary, index) => (
                    <b key={index}>{salary === null ? "—" : money(salary)}</b>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="budget-dashboard">
            <article>
              <small>
                {rosterMode === "projected"
                  ? "Projected payroll"
                  : "Contracted payroll"}
              </small>
              <strong>{money(rosterPayroll)}</strong>
              <span>of {money(data.salaryCap)}</span>
            </article>
            <article className="budget-available">
              <small>Draft budget</small>
              <strong>{money(rosterBudget)}</strong>
              <span>{rosterSpots} open roster spots</span>
            </article>
            <article>
              <small>Buying power</small>
              <strong>
                {money(rosterSpots ? rosterBudget / rosterSpots : 0)}
              </strong>
              <span>per open spot</span>
            </article>
            <article>
              <small>Rostered</small>
              <strong>{rosterRows.length}</strong>
              <span>
                {rosterMode === "projected"
                  ? "after likely drops"
                  : "current contracts"}
              </span>
            </article>
            <div className="cap-meter">
              <i
                style={{
                  width: `${Math.min(100, (rosterPayroll / data.salaryCap) * 100)}%`,
                }}
              />
              <span>
                {Math.round((rosterPayroll / data.salaryCap) * 100)}% of cap
              </span>
            </div>
          </div>
          <div className="roster-section-head depth-title">
            <div>
              <h3>Projected 22-Man Roster</h3>
              <p>
                Eligible players placed into lineup, pitching and bench slots
              </p>
            </div>
            <span>{contractRows.length}</span>
          </div>
          <RosterDepthChart rows={rosterRows} />
          <PlayerTable
            title="Farm System"
            subtitle="0mL prospects whose contract clock has not started"
            rows={team.prospects}
            kind="prospect"
          />
          <section className="drafted-prospects">
            <div className="roster-section-head">
              <div>
                <h3>Minor League Drafts</h3>
                <p>2025 and 2026 selections · historical ownership</p>
              </div>
              <span>{teamDrafts.length}</span>
            </div>
            {teamDrafts.map((pick) => (
              <div
                className="drafted-prospect"
                key={`${pick.year}-${pick.overall}`}
              >
                <b>{pick.year}</b>
                <span>#{pick.overall}</span>
                <a
                  href={playerUrl(pick.player)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {pick.player}
                </a>
                <em>{pick.current ? "Current farm" : "Historical pick"}</em>
              </div>
            ))}
          </section>
        </>
      )}
    </section>
  );
}
