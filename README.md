# MNY Fantasy Baseball Trade Ledger

A responsive, filterable archive of trades posted in the Maybe Next Year Fantasy Baseball league chat.

Community trade and roast votes are stored in Cloudflare D1 through `/api/votes`. Repeat voting is intentionally allowed.

## Features

- Search by player, owner, or team name
- Filter by season and month
- Quick filters for cash, draft picks, and August deadline deals
- Current owner directory while preserving historical team aliases in trade records
- Community trade-winner sliders and roast star ratings with shared averages

## Development

```bash
npm install
npm run dev
```

Build the production bundle with `npm run build`.
