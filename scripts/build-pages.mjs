import fs from "node:fs/promises";

const output = new URL("../pages-dist/", import.meta.url);
await fs.rm(output, { recursive: true, force: true });
await fs.cp(new URL("../dist/client/", import.meta.url), output, { recursive: true });

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("static-export", Date.now().toString());
const { default: worker } = await import(workerUrl.href);
const response = await worker.fetch(new Request("https://mny-fantasy-baseball.pages.dev/", { headers: { accept: "text/html" } }), {
  ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
}, { waitUntil() {}, passThroughOnException() {} });
if (!response.ok) throw new Error(`Static render failed: ${response.status}`);
await fs.writeFile(new URL("index.html", output), await response.text());
await fs.writeFile(new URL("_headers", output), "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n");
await fs.rm(new URL("../dist/server/wrangler.json", import.meta.url), { force: true });
await fs.rm(new URL("../.wrangler/deploy/config.json", import.meta.url), { force: true });
console.log("Cloudflare Pages bundle written to pages-dist/");
