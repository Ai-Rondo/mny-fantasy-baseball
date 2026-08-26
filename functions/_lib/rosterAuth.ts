type RosterEnv = Cloudflare.Env & { ROSTER_PASSWORD: string; ROSTER_SESSION_SECRET: string };

const encoder = new TextEncoder();
const cookieName = "mny_roster_access";
const message = "mny-rosters:v1";

const b64url = (bytes: Uint8Array) => {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

async function token(secret: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message))));
}

async function equal(a: string, b: string) {
  const [left, right] = await Promise.all([a, b].map(value => crypto.subtle.digest("SHA-256", encoder.encode(value))));
  const x = new Uint8Array(left), y = new Uint8Array(right);
  let mismatch = x.length ^ y.length;
  for (let i = 0; i < Math.min(x.length, y.length); i++) mismatch |= x[i] ^ y[i];
  return mismatch === 0;
}

export async function validPassword(password: string, env: RosterEnv) {
  return equal(password, env.ROSTER_PASSWORD);
}

export async function authorized(request: Request, env: RosterEnv) {
  const cookie = request.headers.get("cookie") ?? "";
  const value = cookie.split(";").map(item => item.trim()).find(item => item.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  return Boolean(value && await equal(value, await token(env.ROSTER_SESSION_SECRET)));
}

export async function accessCookie(env: RosterEnv) {
  return `${cookieName}=${await token(env.ROSTER_SESSION_SECRET)}; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Strict`;
}

export const clearCookie = `${cookieName}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
export type { RosterEnv };
