# auth.md

Public access notes for agents and tools using **https://isv.wiki/**.

## Audience

AI agents, crawlers, and humans reading the IEEE Smart Village Technology Committee
knowledge base (volunteer wiki). Not the IEEE program portal.

## Authentication

**None required.** This origin is a **public, read-only static site** (MIT-licensed HTML/JSON/Markdown on GitHub Pages). There is:

- no account signup
- no OAuth / OIDC issuer on this host
- no protected API that issues or requires bearer tokens

Do **not** expect `/.well-known/openid-configuration`, `oauth-authorization-server`, or
`oauth-protected-resource` here. Those appear only if a real auth server or protected API is added later.

## How agents should fetch content

1. Prefer machine docs: [`/AGENTS.md`](https://isv.wiki/AGENTS.md), [`/llms.txt`](https://isv.wiki/llms.txt).
2. Discovery: [`/.well-known/ai-catalog.json`](https://isv.wiki/.well-known/ai-catalog.json),
   [`/.well-known/agent-skills/index.json`](https://isv.wiki/.well-known/agent-skills/index.json),
   [`/.well-known/api-catalog`](https://isv.wiki/.well-known/api-catalog),
   [`/.well-known/agents/index.json`](https://isv.wiki/.well-known/agents/index.json).
3. HTML pages remain the browser default. If Cloudflare **Markdown for Agents** is enabled on the zone, requests with `Accept: text/markdown` may receive `Content-Type: text/markdown` (dashboard toggle — not controlled by this file).

## Credentials

Send **no** Authorization header and **no** session cookies for wiki content. Treat all published paths as anonymous/public.

## Registration

There is **no agent registration endpoint** on isv.wiki. To contribute, open a pull request on
[overview-solutions/isv-ai-wiki](https://github.com/overview-solutions/isv-ai-wiki) (human GitHub accounts).

## Related (separate hosts)

- IEEE Smart Village program site: https://smartvillage.ieee.org/
- Live Village Simulator source (sibling repo): https://github.com/overview-solutions/smart-village-simulator
