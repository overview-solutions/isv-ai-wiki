# ISV Knowledge Base — Sharing Policy

**What is public, what is private, and why.**

This document is deliberately public. The ISV Knowledge Base is open by default — anyone can read the [live wiki](https://isv.wiki/) and the [source repo](https://github.com/overview-solutions/isv-ai-wiki). A small amount of information is kept private. We publish this policy so contributors, vendors, and partners can see exactly what we protect and on what principle — openness you can audit, not openness you have to trust blindly.

Maintained by the IEEE Smart Village (ISV) Tech Comm Committee. Questions: **Adam Sauer**, Tech Comm Chair — [adam.r.sauer@ieee.org](mailto:adam.r.sauer@ieee.org).

---

## The principle

**Public by default. Private only by necessity.** A page goes private only if publishing it would (a) break a confidence we owe a vendor or partner, (b) expose an individual's personal contact details without consent, or (c) reveal commercial terms that are not ours to disclose. Everything else — problem framing, cited benchmarks, topology, standards, meeting reasoning, industry cost *bands* — stays open, because the whole point of this wiki is decision support that any village mini-grid operator can use.

When in doubt, a thing is public. The burden of proof is on keeping something private, not on opening it.

---

## Two repositories

| | Public | Private |
|---|--------|---------|
| **Repo** | `overview-solutions/isv-ai-wiki` | `overview-solutions/isv-ai-wiki-private` *(separate, access-controlled)* |
| **Hosting** | GitHub Pages → [isv.wiki](https://isv.wiki/) | Not published to the open web |
| **Who can read** | Everyone | ISV Tech Comm members granted access on GitHub |
| **License** | MIT, open contribution | Internal; not redistributable |
| **Access control** | GitHub controls *who can edit*; the published site is world-readable | GitHub repo permissions control *who can read and edit* |

> **Why two repos and not a login wall on the wiki?** The public wiki is static HTML served by GitHub Pages — there is no server to check passwords, so anything published there is readable by anyone with the URL. A "login" added in browser JavaScript would be a lock on a glass door. Real access control therefore lives in a *separate* private repository, governed by GitHub's own permissions. If a future need arises to publish gated pages on the web (not just read them on GitHub), that would be done through an authenticated host (e.g. Cloudflare Access + GitHub login), never by hiding secrets inside the public static site.

---

## What stays PRIVATE

The following belong in `isv-ai-wiki-private` and must **never** be committed to the public repo.

### 1. Vendor contacts obtained through outreach, and outreach status
Named individuals, direct/personal email addresses, phone, WeChat/WhatsApp handles, and the **state of any conversation** (who replied, who introduced whom, what was discussed, negotiation posture).

*Nuance — not everything with an "@" is private:* a vendor's own **published, generic** address (`info@`, `sales@`, `support@` listed on their public website) is not a secret and may appear in the public study as a starting point for others. What is private is the **person**, the **relationship**, and the **status** — e.g. "Warren at SteamaCo, intro'd by X, sent pricing on June 3, awaiting NDA." Publish the front door; keep the handshake private.

### 2. Unpublished pricing and commercial terms
Real quoted `$/connection`, project-specific discounts, volume terms, NDA pricing, and any figure given to ISV in confidence. The public study uses **industry cost bands** (e.g. $40–110/connection from cited literature) — never a specific vendor's confidential quote.

### 3. NDA-gated technical documents
DLMS/COSEM interoperability guides, ICDs, firmware notes, datasheets, or test results shared with ISV **under NDA or on a "do not redistribute" basis**. The public wiki may *describe that such a document exists and what it covers*, and cite it as an ISV-internal source, but must not host or quote its restricted contents.

### 4. Internal people and partner details
Personal contact information for volunteers, partners, or community members; partner organizations' internal notes; and anything naming an individual who has not consented to publication. ISV staff who publish their own work contact (e.g. a committee chair's IEEE address) are not covered by this — that is self-published.

---

## What stays PUBLIC

To make the boundary concrete, these are explicitly **public** and should not be moved private out of over-caution:

- Problem framing, pain points, and the metering-cost / theft / protocol-fragmentation analysis.
- The cited vendor **benchmark tables** (protocol support, stack role, confidence tiers) — minus the private contact/pricing columns above.
- Industry cost **bands** and ranges drawn from published literature with citations.
- Topology diagrams, standards references (DLMS, STS, SunSpec, IEEE 2030.5), and the VMRS/northbound JSON profiles.
- Tech Comm meeting **reasoning and decisions**, action items (as GitHub Issues), and event/workshop planning — unless a specific note contains category 1–4 material, in which case that material moves private and the public note links to it as "ISV-internal."
- Vendors' own **publicly listed** generic contact addresses.

---

## How to request access to private material

1. You must be an ISV Tech Comm contributor with a GitHub account.
2. Email **Adam Sauer**, Tech Comm Chair — [adam.r.sauer@ieee.org](mailto:adam.r.sauer@ieee.org) — with your GitHub username and your ISV role.
3. You will be added as a collaborator on `overview-solutions/isv-ai-wiki-private` with read (or write) access as appropriate.

Not an ISV volunteer yet? Sign up at [smartvillage.ieee.org/volunteer](https://smartvillage.ieee.org/volunteer/).

---

## For contributors and AI assistants

Before committing to the **public** repo, confirm the change contains none of categories 1–4 above. If a meeting note, study row, or report contains both public and private material, **split it**: public reasoning stays in `isv-ai-wiki`; private specifics move to `isv-ai-wiki-private`, and the public side links across as "ISV-internal — access on request."

AI coding assistants (Cursor, Claude, etc.) working with **both** repositories open as shared context must treat the boundary as one-directional: private content may inform public writing in the abstract, but **no private fact, name, price, or quote is ever copied into a public file.** See [`AGENTS.md`](AGENTS.md) → *Public / private split* for the machine-oriented rules.

---

*MIT · IEEE Smart Village · Overview Solutions LLC · Policy v1.0 — June 2026*
