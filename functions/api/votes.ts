type VoteBody = { type?: unknown; id?: unknown; value?: unknown };

const json = (data: unknown, status = 200) => Response.json(data, {
  status,
  headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
});

async function summaries(db: D1Database) {
  const [trades, roasts] = await db.batch([
    db.prepare("SELECT trade_id AS id, ROUND(AVG(score), 1) AS average, COUNT(*) AS votes FROM trade_votes GROUP BY trade_id"),
    db.prepare("SELECT roast_code AS id, ROUND(AVG(stars), 2) AS average, COUNT(*) AS votes FROM roast_votes GROUP BY roast_code"),
  ]);
  return { trades: trades.results, roasts: roasts.results };
}

export const onRequestGet: PagesFunction<Cloudflare.Env> = async ({ env }) => json(await summaries(env.DB));

export const onRequestPost: PagesFunction<Cloudflare.Env> = async ({ request, env }) => {
  if ((request.headers.get("content-length") && Number(request.headers.get("content-length")) > 1024)) return json({ error: "Request too large" }, 413);
  let body: VoteBody;
  try { body = await request.json<VoteBody>(); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (typeof body.id !== "string" || body.id.length > 16 || !/^[A-Z]\d{3}$/.test(body.id)) return json({ error: "Invalid item" }, 400);
  if (!Number.isInteger(body.value)) return json({ error: "Invalid rating" }, 400);

  if (body.type === "trade" && Number(body.value) >= -100 && Number(body.value) <= 100) {
    await env.DB.prepare("INSERT INTO trade_votes (trade_id, score) VALUES (?, ?)").bind(body.id, body.value).run();
  } else if (body.type === "roast" && Number(body.value) >= 1 && Number(body.value) <= 5) {
    await env.DB.prepare("INSERT INTO roast_votes (roast_code, stars) VALUES (?, ?)").bind(body.id, body.value).run();
  } else return json({ error: "Invalid vote" }, 400);

  return json(await summaries(env.DB), 201);
};
