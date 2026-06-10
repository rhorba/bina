---
name: groupement-engine
description: Groupement state machine, workspace, Moroccan procurement law rules. Trigger on: "groupement", "consortium", "partenaire", "mandataire", "cotraitant", "equipe".
---
# Groupement Engine — Bina

## Role
Own `packages/groupement`. The groupement system is Bina's differentiator —
nothing equivalent exists for Moroccan construction SMEs. It must respect Moroccan
procurement law (Code des marchés publics, Décret 2-12-349).

## Moroccan Procurement Law Rules (non-negotiable)
1. **One mandataire** per groupement — the lead firm responsible to the maître d'ouvrage
2. **Each member signs** the groupement convention jointly
3. **The mandataire** submits the bid on behalf of all members
4. **FNBTP category**: the groupement's aggregate capacity must meet the tender's requirements
5. **Members must have individual compliance docs** — the mandataire assembles all

## State Machine
```
FORMING ──[enough members confirmed for required specialties]──→ FORMED
FORMING ──[30 days without completing, initiator inactive]─────→ archived (pg-boss)
FORMED ──[mandataire uploads complete dossier]──────────────────→ SUBMITTING
SUBMITTING ──[bid submitted on portal]───────────────────────────→ SUBMITTED
SUBMITTED ──[result announced: win]──────────────────────────────→ WON
SUBMITTED ──[result announced: loss]─────────────────────────────→ LOST
Any state ──[initiator withdraws]────────────────────────────────→ WITHDRAWN
```

## Mandataire Enforcement
```sql
-- DB-level: only one mandataire per groupement
CREATE UNIQUE INDEX idx_one_mandataire
  ON groupement_members (groupement_id)
  WHERE role = 'mandataire' AND status = 'confirmed';
```

## Workspace Logic
```typescript
// packages/groupement/src/workspace.ts
// Groupement workspace is visible only to confirmed members + admin
// Contains:
// - Member list with specialties + compliance scores
// - Shared notes (markdown, last-write-wins)
// - Required documents checklist (per member: attestation fiscale, CNSS, etc.)
// - Deadline countdown for the target tender
// - Message thread (simple append-only, not a full chat)
```

## Match Suggestions
When a new tender is scraped that requires multiple specialties and exceeds a
contractor's declared maxContractValueMAD:
```typescript
// "This tender needs 4 trades. You cover électricité.
//  We found 3 firms covering the other lots. Interested in forming a groupement?"
```

## Checklist
- [ ] One mandataire per groupement (DB unique index)
- [ ] Workspace: members-only access (RLS: groupement_members.status = 'confirmed')
- [ ] State machine transitions logged in audit_log
- [ ] FNBTP category validation on groupement formation
- [ ] 30-day inactivity archiving sweep (pg-boss weekly)

## Handoff Points
- **← DBA**: groupement + groupement_members tables + unique index
- **← Tender Engine**: tender data for match suggestions
- **→ Frontend Dev**: groupement creation + workspace UI
- **→ Tester**: state machine, mandataire uniqueness, workspace access
