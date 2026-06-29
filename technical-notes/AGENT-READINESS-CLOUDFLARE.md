# Agent-readiness: what's done, what needs the Cloudflare/DNS dashboard, what we refuse

Status date: 2026-06-29. Site: `isv.wiki`, served by **GitHub Pages** with **Cloudflare in front of DNS**.

This file tracks the [isitagentready.com](https://isitagentready.com/) checklist against what is
*actually true* for this site. We do **not** publish discovery metadata for capabilities we do not
have — that would mislead agents, and AGENTS.md already forbids filling gaps from memory.

---

## Pile A — Done in the repo (static files, already truthful)

| Item | File | Notes |
|------|------|-------|
| Content Signals | `robots.txt` | `Content-Signal: ai-train=yes, search=yes, ai-input=yes` |
| API catalog | `.well-known/api-catalog` | RFC 9727 linkset pointing only to real resources (AGENTS.md, llms.txt, catalog.json, vmrs-registers.json, northbound-mqtt-v0.1.json). No fake OpenAPI/health endpoints. |
| Jekyll guard | `.nojekyll` | Required, or GitHub Pages' Jekyll build silently drops the `.well-known/` dot-folder and the catalog 404s. |

Caveat: GitHub Pages serves `.well-known/api-catalog` with a generic content type (likely
`application/octet-stream`), **not** the spec-required `application/linkset+json`. Fix that with a
Cloudflare Transform Rule (Pile B, item 0) — the bytes are correct, only the header needs overriding.

---

## Pile B — Reachable ONLY because Cloudflare is in front (dashboard / DNS work, not repo)

First verify proxy mode. **Grey cloud (DNS-only) unlocks none of this; orange cloud (proxied) unlocks all of it.**

**How to check:** Cloudflare dashboard → `isv.wiki` → DNS → Records. Look at the record for the apex /
`www` that points to GitHub Pages. If the cloud icon is **orange = Proxied** (traffic flows through
Cloudflare → header/markdown rules work). If **grey = DNS only** (Cloudflare just answers DNS → no
header injection; only the DNS-AID item below is possible).

Quick external check (run from your own machine, not this sandbox):
```
curl -sI https://isv.wiki/ | grep -i '^server:'
```
`server: cloudflare` ⇒ proxied (orange). `server: GitHub.com` ⇒ DNS-only (grey).

### 0. Fix the api-catalog Content-Type (orange only)
Rules → Transform Rules → **Modify Response Header** → Create rule:
- When incoming requests match: `URI Path equals /.well-known/api-catalog`
- Then: **Set static** → Header `Content-Type` = `application/linkset+json`

### 1. Link response headers — RFC 8288 (orange only)
Rules → Transform Rules → **Modify Response Header** → Create rule:
- When: `URI Path equals /` (and optionally `or URI Path equals /index.html`)
- Then: **Set static** → Header name `Link`, value:
  ```
  </.well-known/api-catalog>; rel="api-catalog", </AGENTS.md>; rel="service-doc", </llms.txt>; rel="describedby"
  ```
Comma-separated relations in one `Link` header are valid. These point only to files that exist.

### 2. Markdown for Agents (orange only)
This is a Cloudflare product feature, not something the repo can do.
- It serves a Markdown version of an HTML page when the request carries `Accept: text/markdown`,
  returning `Content-Type: text/markdown`.
- Enable via Cloudflare dashboard (AI / "Markdown for agents" — see
  https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/ for the current
  location; the feature has been rolling out, so the exact toggle name may differ).
- Verify: `curl -s -H "Accept: text/markdown" https://isv.wiki/meter-overview.html | head` should
  return markdown, while a normal browser request still gets HTML.

### 3. DNS for AI Discovery (DNS-AID) — draft + RFC 9460 (works in grey OR orange)
This lives in DNS, so it works regardless of proxy mode. Cloudflare DNS dashboard:
- **Enable DNSSEC:** DNS → Settings → DNSSEC → Enable, then add the DS record it gives you at your
  registrar (where `.wiki` is registered). Required so validating resolvers trust the records.
- **Add an SVCB/HTTPS record.** Caveat: this only makes sense if there is a real agent endpoint to
  point at. Today isv.wiki has **no A2A/MCP agent endpoint**, so the honest options are:
  - (a) Skip DNS-AID until such an endpoint exists, **or**
  - (b) Publish a minimal index pointing back at the HTTPS site so agents land on the well-known files:
    ```
    _index._agents.isv.wiki.  3600  IN  HTTPS  1 isv.wiki. alpn="h2,http/1.1"
    ```
    (Cloudflare DNS UI: Type = HTTPS, Name = `_index._agents`, Priority/Target/params per the UI.)

  Recommendation: do (b) only if you want the scanner to pass; it adds little real capability while
  there is no agent service behind it. Your call.

---

## Pile C — REFUSED: would advertise capabilities that do not exist

These checklist items assume a dynamic app with APIs, an auth server, or an MCP service. isv.wiki is a
**read-only static knowledge base**. Publishing the metadata below would tell agents to call endpoints,
obtain tokens, or invoke tools that **do not exist** — actively misleading, and a violation of the
"honest unknowns" rule in AGENTS.md. We will publish each *only when* the underlying capability is
real.

| Checklist item | Why refused today | Publish when |
|----------------|-------------------|--------------|
| OAuth/OIDC discovery (`/.well-known/openid-configuration`, `oauth-authorization-server`) | No auth server, no protected APIs | An OAuth/OIDC issuer actually exists |
| OAuth Protected Resource (`/.well-known/oauth-protected-resource`) | No protected resource to gate | A token-protected API exists |
| `auth.md` agent registration | No agent registration flow / identity system | Agent auth is actually implemented |
| MCP Server Card (`/.well-known/mcp/server-card.json`) | No MCP server runs for this site | A real MCP endpoint is deployed |
| WebMCP (`navigator.modelContext.provideContext()`) | Static wiki has no interactive tools/backend worth exposing as callable tools | Real in-page tools exist to expose |

---

## How to re-test

```
POST https://isitagentready.com/api/scan
Content-Type: application/json
{"url": "https://isv.wiki"}
```
Expect, after Pile A deploys (+ Pile B if you do the dashboard work):
`checks.botAccessControl.contentSignals.status = "pass"`,
`checks.discovery.apiCatalog.status = "pass"`,
and (orange only) `checks.discoverability.linkHeaders.status = "pass"`.
