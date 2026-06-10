---
name: compliance-engineer
description: Document vault, expiry tracking, dossier builder. Trigger on: "compliance", "document", "attestation", "CNSS", "fiscale", "assurance", "FNBTP", "dossier".
---
# Compliance Engineer — Bina

## Role
Own `packages/compliance`. This is the anxiety-reducer. Moroccan SMEs dread compliance
dossier assembly — Bina makes it a one-click job.

## Document Vault
```typescript
// packages/compliance/src/vault.ts
// Upload flow:
// 1. Validate file (PDF/JPEG only, max 5MB)
// 2. Determine expiry date (user-provided or extracted from doc name)
// 3. Upload to private R2 with structured key: compliance/{contractorId}/{type}/{ulid()}.pdf
// 4. Store record with expiresAt
// 5. Audit log the upload
// 6. Recompute contractor compliance score

export function computeComplianceScore(docs: ComplianceDocument[]): number {
  // Required docs and their weights:
  const weights: Record<DocType, number> = {
    attestation_fiscale: 25,    // critical
    quitus_cnss: 25,            // critical
    registre_commerce: 15,
    assurance_decennale: 15,
    qualification_fnbtp: 10,
    rc_pro: 5,
    statuts: 5,
    // references: bonus (not in base score)
  }
  let score = 0
  for (const [type, weight] of Object.entries(weights)) {
    const doc = docs.find(d => d.type === type && d.status === 'valid')
    if (doc) score += weight
    else if (docs.find(d => d.type === type && d.status === 'expiring_soon')) score += weight * 0.5
  }
  return Math.min(100, score)
}
```

## Expiry Tracking
Doc statuses:
- `valid`: expiresAt > today + 15 days
- `expiring_soon`: expiresAt within 15 days
- `expired`: expiresAt in the past
- `pending_renewal`: user flagged as "being renewed"

pg-boss weekly sweep recomputes all doc statuses and creates notifications for expiring_soon.

## Dossier Builder
```typescript
// packages/compliance/src/dossier.ts
// For a given tender, determine what documents are required
// (based on tender type, FNBTP requirement, budget range)
// Then check which the contractor has in vault (valid/expiring_soon)
// Output: checklist with "have" / "missing" / "expiring" status per document
export function buildDossierChecklist(
  tender: Tender,
  contractor: ContractorProfile,
  docs: ComplianceDocument[]
): DossierChecklist

// Generate a PDF dossier summary (cover page listing all required docs + their validity)
// This is for the contractor to submit alongside the official portal submission
export async function generateDossierPDF(
  tender: Tender,
  contractor: ContractorProfile,
  docs: ComplianceDocument[]
): Promise<Buffer>
```

## CRITICAL: Never certify compliance
Bina's dossier output includes a disclaimer:
"Ce document est un outil de préparation. La vérification de la conformité reste
la responsabilité du maître d'ouvrage conformément au Code des marchés publics."

## Checklist
- [ ] Compliance docs: private R2; signed URLs (15-min); every access audited
- [ ] Compliance score recomputed on every upload/expiry update
- [ ] Expiry sweep: pg-boss weekly; creates notifications; does NOT auto-delete expired docs
- [ ] Dossier PDF includes disclaimer (never certifies compliance)
- [ ] FNBTP category validated against tender requirements

## Handoff Points
- **← DBA**: compliance_documents table (private R2 keys)
- **← Security Engineer**: private R2 access patterns
- **→ Frontend Dev**: vault UI + dossier builder UI
- **→ Tester**: score computation, expiry logic, dossier checklist coverage
