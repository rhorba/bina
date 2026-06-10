# risks
## RISK-000 — marchespublics.gov.ma structure change (standing, high)
Portal may change HTML → scraper breaks. Mitigation: CSV fallback always available in admin.
Log scraper errors; admin is notified immediately if scraper fails 2 consecutive days.

## RISK-001 — Compliance doc unauthorized access (standing, critical)
Attestation fiscale + CNSS quitus contain company financial data.
Private R2 bucket. Signed URLs (15-min). Every access audit-logged. Contractor + admin only.

## RISK-002 — Groupement mandataire violation
Creating two mandataires per groupement violates Moroccan procurement law.
UNIQUE INDEX + application-level check. Test covers this explicitly.

## RISK-003 — Scraper rate limiting by portal
marchespublics.gov.ma may block if scraped too aggressively.
Rate limit: 1 req/3s. Nightly only. Random user-agent rotation. Exponential backoff on 429.
