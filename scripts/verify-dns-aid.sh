#!/usr/bin/env bash
# Quick local checks for DNS-AID + DNSSEC on isv.wiki

set -euo pipefail

DOMAIN="${DNS_AID_DOMAIN:-isv.wiki}"
FQDN="_index._agents.${DOMAIN}"

echo "=== HTTPS ${FQDN} ==="
dig @1.1.1.1 "${FQDN}" HTTPS +short || true

echo
echo "=== SVCB ${FQDN} ==="
dig @1.1.1.1 "${FQDN}" SVCB +short || true

echo
echo "=== DNSSEC (RRSIG on HTTPS query) ==="
dig @1.1.1.1 "${FQDN}" HTTPS +dnssec +short || true

echo
echo "=== DS at parent (${DOMAIN}) ==="
dig @1.1.1.1 "${DOMAIN}" DS +short || true

echo
echo "=== DoH with AD flag (what isitagentready uses) ==="
curl -fsS -H 'Accept: application/dns-json' \
  "https://cloudflare-dns.com/dns-query?name=${FQDN}&type=HTTPS&do=1" \
  | python3 -c "
import json, sys
d = json.load(sys.stdin)
print('Status:', d.get('Status'), '(0=NOERROR)')
print('AD (authenticated):', d.get('AD'))
answers = d.get('Answer') or []
for a in answers:
    print(' ', a.get('type'), a.get('data'))
if not answers:
    print('  (no answers — record missing or NXDOMAIN)')
"
