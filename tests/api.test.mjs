import test from "node:test";
import assert from "node:assert/strict";
import { onRequestGet, onRequestPost } from "../functions/api/chat.js";
import { onRequestGet as serverStatus } from "../functions/api/server-status.js";

const env = { OPENAI_API_KEY: "test-key-not-real", HEART_ACCESS_TOKEN: "heart-local-test-token-long-enough" };
const url = "https://heart.example/api/chat";
function request(messages, opts = {}) {
  const headers = { "content-type": "application/json", authorization: "Bearer " + env.HEART_ACCESS_TOKEN, ...(opts.headers || {}) };
  return new Request(url, { method: "POST", headers, body: opts.raw ?? JSON.stringify({ messages }) });
}
const context = (req, settings = env) => ({ request: req, env: settings });
const userMessage = [{ role: "user", text: "Bonjour" }];

test("GET status reports configuration without leaking secrets", async () => {
  const r = await onRequestGet({ env });
  const data = await r.json();
  assert.equal(data.aiConfigured, true);
  assert.equal(data.authenticationRequired, true);
  assert.equal(JSON.stringify(data).includes(env.OPENAI_API_KEY), false);
});

test("fails closed when secrets are missing", async () => {
  const r = await onRequestPost(context(request(userMessage), {}));
  assert.equal(r.status, 503);
});

test("rejects an incorrect bearer token", async () => {
  const r = await onRequestPost(context(request(userMessage, { headers: { authorization: "Bearer fake-token" } })));
  assert.equal(r.status, 401);
});

test("rejects cross-origin browser requests", async () => {
  const r = await onRequestPost(context(request(userMessage, { headers: { origin: "https://foreign.example" } })));
  assert.equal(r.status, 403);
});

test("rejects malformed JSON", async () => {
  const r = await onRequestPost(context(request(userMessage, { raw: "{" })));
  assert.equal(r.status, 400);
});

test("rejects invalid history ending in assistant turn", async () => {
  const r = await onRequestPost(context(request([{ role: "assistant", text: "Salut" }])));
  assert.equal(r.status, 400);
});

test("rejects too many messages", async () => {
  const r = await onRequestPost(context(request(Array.from({ length: 21 }, () => ({ role: "user", text: "hello" })))));
  assert.equal(r.status, 400);
});

test("successful inference returns a model reply without storing request", async t => {
  const originalFetch = globalThis.fetch;
  let upstream;
  globalThis.fetch = async (target, init) => {
    upstream = { target, init };
    return new Response(JSON.stringify({ output: [{ content: [{ type: "output_text", text: "Bonjour !" }] }] }), { status: 200 });
  };
  t.after(() => { globalThis.fetch = originalFetch; });
  const r = await onRequestPost(context(request(userMessage)));
  assert.equal(r.status, 200);
  assert.equal((await r.json()).reply, "Bonjour !");
  assert.equal(upstream.target, "https://api.openai.com/v1/responses");
  assert.equal(JSON.parse(upstream.init.body).store, false);
});

test("upstream errors are not leaked to the browser", async t => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("provider diagnostic containing secrets", { status: 500 });
  t.after(() => { globalThis.fetch = originalFetch; });
  const r = await onRequestPost(context(request(userMessage)));
  assert.equal(r.status, 502);
  assert.equal(JSON.stringify(await r.json()).includes("provider diagnostic"), false);
});

test("WarLike Server diagnostic never reports an authenticated account", async t => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("{}", { status: 200 });
  t.after(() => { globalThis.fetch = originalFetch; });
  const r = await serverStatus();
  const data = await r.json();
  assert.equal(data.serverHealthy, true);
  assert.equal(data.accountConnected, false);
});
