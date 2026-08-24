import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the MNY trade explorer", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /MNY Fantasy Baseball Trade Ledger/i);
  assert.match(html, /Trade Ledger/i);
  assert.match(html, /All teams/i);
  assert.match(html, /Kyle · Vandelay Industries/i);
  assert.match(html, />Cash</i);
  assert.match(html, />August</i);
  assert.doesNotMatch(html, /Every deal|One ledger|Trade explorer|THE LEAGUE ARCHIVE/i);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Your site is taking shape/i);
});

test("includes complete trade data and social metadata", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, />49</);
  assert.match(html, /mny-fantasy-baseball\.pages\.dev\/og-v2\.png/i);
  assert.match(html, /summary_large_image/i);
});
