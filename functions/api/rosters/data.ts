import { authorized, type RosterEnv } from "../../_lib/rosterAuth";

export const onRequestGet: PagesFunction<RosterEnv> = async ({ request, env }) => {
  if (!await authorized(request, env)) return Response.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const result = await env.DB.prepare("SELECT payload FROM private_roster_data WHERE id = ? ORDER BY part").bind("2027-predraft").all<{ payload: string }>();
  if (!result.results.length) return Response.json({ error: "Roster data is unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  return new Response(result.results.map(row => row.payload).join(""), { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
};
