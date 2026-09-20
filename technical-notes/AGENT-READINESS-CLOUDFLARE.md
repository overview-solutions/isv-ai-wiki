# Agent-readiness: what's done, what needs the Cloudflare/DNS dashboard, what we refuse

Status date: 2026-09-20. Site: `isv.wiki`, served by **GitHub Pages** with **Cloudflare in front of DNS**.

This file tracks the [isitagentready.com](https://isitagentready.com/) checklist against what is
*actually true* for this site. We do **not** publish discovery metadata for capabilities we do not
have — that would mislead agents, and AGENTS.md already forbids filling gaps from memory.

---

## Pile A — Done in the repo (static files, already truthful)

| Item | File | Notes |
|------|------|-------|
| Content Signals | `robots.txt` | `Content-Signal: ai-train=yes, search=yes, ai-input=yes` |
| ARD Agentmap | `robots.txt` + `.well-known/ai-catalog.json` | `Agentmap:` directive + capability manifest |
| Agent Skills index | `.well-known/agent-skills/index.json` | `navigate-isv-wiki`, `cite-evidence`, `village-map-twin` (+ SKILL.md + sha256 digests) |
| auth.md (public) | `/auth.md` | Honest: **no auth**, no registration, no OAuth on this host |
| WebMCP | `index.html` | Real SPA tools only: list routes, navigate, fetch agent docs / JSON |
| API catalog | `.well-known/api-catalog` | RFC 9727 linkset pointing only to real resources |
| DNS-AID HTTP index | `.well-known/agents/index.json` | Empty `agents[]`; links to discovery docs |
| llms.txt / AGENTS.md | root | Primary agent entrypoints |
| Jekyll guard | `.nojekyll` | Required, or GitHub Pages' Jekyll build silently drops `.well-known/` |

Caveat: GitHub Pages often serves `.well-known/*` with a generic content type. Prefer Cloudflare
Transform Rules (Pile B) for `Content-Type` / CORS on JSON well-knowns.

---

## Pile B — Reachable ONLY because Cloudflare is in front (dashboard / DNS work, not repo)

First verify proxy mode. **Grey cloud (DNS-only) unlocks none of this; orange cloud (proxied) unlocks all of it.**

**How to check:** Cloudflare dashboard → `isv.wiki` → DNS → Records. Look at the record for the apex /
`www` that points to GitHub Pages. If the cloud icon is **orange = Proxied** (traffic flows through
Cloudflare → header/markdown rules work). If **grey = DNS only** (Cloudflare just answers DNS → no
header injection; only the DNS-AID item below is possible).

Quick external check:
```
curl -sI https://isv.wiki/ | grep -i '^server:'
```
`server: cloudflare` ⇒ proxied (orange). `server: GitHub.com` ⇒ DNS-only (grey).

### 0. Fix well-known Content-Types + CORS (orange only)

Rules → Transform Rules → **Modify Response Header**:

| Match | Set |
|-------|-----|
| `URI Path equals /.well-known/api-catalog` | `Content-Type` = `application/linkset+json` |
| `URI Path equals /.well-known/ai-catalog.json` | `Content-Type` = `application/json` and `Access-Control-Allow-Origin` = `*` |
| `URI Path equals /.well-known/agent-skills/index.json` | `Content-Type` = `application/json` and `Access-Control-Allow-Origin` = `*` |

### 1. Link response headers — RFC 8288 (orange only)

Rules → Transform Rules → **Modify Response Header** → Create rule:

- When: `URI Path equals /` (and optionally `or URI Path equals /index.html`)
- Then: **Set static** → Header name `Link`, value:
  ```
  </.well-known/api-catalog>; rel="api-catalog", </.well-known/ai-catalog.json>; rel="describedby", </AGENTS.md>; rel="service-doc", </llms.txt>; rel="describedby", </auth.md>; rel="describedby"
  ```

### 2. Markdown for Agents (orange only) — **not in repo**

Requires Cloudflare **Pro+** and a dashboard toggle (AI Crawl Control → Markdown for Agents), or API
`PATCH .../settings/content_converter` with `{"value":"on"}`.

- Serves Markdown when request has `Accept: text/markdown`
- Sets `Content-Type: text/markdown` and may add `x-markdown-tokens`
- Docs: https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/

Verify:
```
curl -sI -H "Accept: text/markdown" https://isv.wiki/meter-overview.html | grep -i content-type
```

### 3. DNS for AI Discovery (DNS-AID) — draft + RFC 9460 (works in grey OR orange)

See prior steps in git history / DNS dashboard: `_index._agents.isv.wiki` HTTPS → `isv.wiki` + DNSSEC.
Scripts: `scripts/publish-dns-aid-cloudflare.sh`, `scripts/verify-dns-aid.sh` (if present).

#### What we deliberately skip in DNS

| Record | Why |
|--------|-----|
| `_mcp._agents` | No MCP server on isv.wiki |
| `_a2a._agents` | No A2A endpoint |
| Fake `cap=` URLs | Would mislead agents |

---

## Pile C — REFUSED: would advertise capabilities that do not exist

| Checklist item | Why refused today | Publish when |
|----------------|-------------------|--------------|
| OAuth/OIDC discovery (`openid-configuration`, `oauth-authorization-server`) | No auth server, no protected APIs | An OAuth/OIDC issuer actually exists |
| OAuth Protected Resource (`oauth-protected-resource`) | No protected resource to gate | A token-protected API exists |
| MCP Server Card (`/.well-known/mcp/server-card.json`) | No MCP server runs for this site | A real MCP endpoint is deployed |
| Fake agent registration URLs in auth.md | No registration flow | Agent auth is actually implemented |

`auth.md` and WebMCP **are** published, but only for **public read + SPA navigation** — not as a stand-in for OAuth/MCP.

---

## How to re-test

```
POST https://isitagentready.com/api/scan
Content-Type: application/json
{"url": "https://isv.wiki"}
```

Expect after deploy (Pile A): ARD, agent skills, auth.md, WebMCP (browser check), content signals.
Expect after Pile B: markdown negotiation, link headers, correct well-known Content-Types / CORS.
