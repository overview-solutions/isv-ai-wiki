#!/usr/bin/env bash
# Publish DNS-AID _index._agents HTTPS record on Cloudflare for isv.wiki.
#
# Prerequisites:
#   - CLOUDFLARE_API_TOKEN with Zone:DNS:Edit for isv.wiki
#   - Optional: CLOUDFLARE_ZONE_ID (otherwise looked up by domain)
#
# DNSSEC: enable separately in Cloudflare → DNS → Settings → DNSSEC.
# With Cloudflare Registrar, DS at the parent is usually automatic once enabled.
#
# Usage:
#   export CLOUDFLARE_API_TOKEN='...'
#   ./scripts/publish-dns-aid-cloudflare.sh
#   ./scripts/publish-dns-aid-cloudflare.sh --dry-run
#
# Verify:
#   ./scripts/verify-dns-aid.sh

set -euo pipefail

DOMAIN="${DNS_AID_DOMAIN:-isv.wiki}"
RECORD_NAME="_index._agents"
FQDN="${RECORD_NAME}.${DOMAIN}"
TARGET="${DNS_AID_TARGET:-isv.wiki}"
TTL="${DNS_AID_TTL:-3600}"
DRY_RUN=0

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
fi

if [[ "$DRY_RUN" -eq 0 && -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "error: set CLOUDFLARE_API_TOKEN (Zone:DNS:Edit on ${DOMAIN})" >&2
  exit 1
fi

api() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[dry-run] $method https://api.cloudflare.com/client/v4$path"
    [[ -n "$body" ]] && echo "$body" | python3 -m json.tool
    return 0
  fi
  if [[ -n "$body" ]]; then
    curl -fsS -X "$method" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json" \
      "https://api.cloudflare.com/client/v4${path}" \
      -d "$body"
  else
    curl -fsS -X "$method" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json" \
      "https://api.cloudflare.com/client/v4${path}"
  fi
}

ZONE_ID="${CLOUDFLARE_ZONE_ID:-}"
if [[ -z "$ZONE_ID" ]]; then
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[dry-run] lookup zone id for ${DOMAIN}"
    ZONE_ID="ZONE_ID_PLACEHOLDER"
  else
    ZONE_ID="$(api GET "/zones?name=${DOMAIN}" | python3 -c "
import json, sys
data = json.load(sys.stdin)
zones = data.get('result', [])
if not zones:
    raise SystemExit('No Cloudflare zone found for ${DOMAIN}')
print(zones[0]['id'])
")"
  fi
fi

# RFC 9460 ServiceMode (priority >= 1). HTTPS RR for the static wiki entrypoint.
# Do NOT publish _mcp._agents or _a2a._agents — no live agents on this site.
PAYLOAD="$(python3 - <<PY
import json
target = "${TARGET}"
if not target.endswith("."):
    target += "."
print(json.dumps({
  "type": "HTTPS",
  "name": "${FQDN}",
  "ttl": int("${TTL}"),
  "data": {
    "priority": 1,
    "target": target,
    "value": 'alpn="h3,h2" port="443" mandatory="alpn,port"'
  },
  "comment": "DNS-AID organizational index (draft-mozleywilliams-dnsop-dnsaid)"
}))
PY
)"

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "[dry-run] would upsert HTTPS ${FQDN} -> ${TARGET}"
  api POST "/zones/${ZONE_ID}/dns_records" "$PAYLOAD"
  echo
  echo "Next: Cloudflare dashboard → ${DOMAIN} → DNS → Settings → enable DNSSEC"
  exit 0
fi

EXISTING="$(api GET "/zones/${ZONE_ID}/dns_records?type=HTTPS&name=${FQDN}" | python3 -c "
import json, sys
data = json.load(sys.stdin)
recs = data.get('result', [])
print(recs[0]['id'] if recs else '')
")"

if [[ -n "$EXISTING" ]]; then
  api PUT "/zones/${ZONE_ID}/dns_records/${EXISTING}" "$PAYLOAD" | python3 -m json.tool
  echo "Updated HTTPS record ${FQDN}"
else
  api POST "/zones/${ZONE_ID}/dns_records" "$PAYLOAD" | python3 -m json.tool
  echo "Created HTTPS record ${FQDN}"
fi

echo
echo "Done. Enable DNSSEC if not already:"
echo "  Cloudflare → ${DOMAIN} → DNS → Settings → DNSSEC → Enable"
echo
echo "Verify:"
echo "  ./scripts/verify-dns-aid.sh"
