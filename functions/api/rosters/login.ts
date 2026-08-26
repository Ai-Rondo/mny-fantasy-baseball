import { accessCookie, authorized, clearCookie, validPassword, type RosterEnv } from "../../_lib/rosterAuth";

const json = (data: unknown, status = 200, headers: HeadersInit = {}) => Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers } });

export const onRequestGet: PagesFunction<RosterEnv> = async ({ request, env }) => json({ authorized: await authorized(request, env) });

export const onRequestPost: PagesFunction<RosterEnv> = async ({ request, env }) => {
  if (Number(request.headers.get("content-length") ?? 0) > 512) return json({ error: "Request too large" }, 413);
  let body: { password?: unknown };
  try { body = await request.json(); } catch { return json({ error: "Invalid request" }, 400); }
  if (typeof body.password !== "string" || body.password.length > 128 || !await validPassword(body.password, env)) return json({ error: "Incorrect password" }, 401);
  return json({ authorized: true }, 200, { "Set-Cookie": await accessCookie(env) });
};

export const onRequestDelete: PagesFunction<RosterEnv> = async () => json({ authorized: false }, 200, { "Set-Cookie": clearCookie });
