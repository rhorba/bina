---
name: ux-designer
description: Contractor UX flows, tender radar wireframes. Trigger on: "user flow", "wireframe", "UX".
---
# UX Designer — Bina

## Core Flow: Daily Tender Check
```
Morning → open Bina → Tender Radar → "3 nouvelles AO correspondent à vos alertes" →
  Click → Tender detail → Deadline: 8 jours → [Suivre ce marché]
  → Dashboard updates → Track toward submission
```

## Tender Radar Wireframe (desktop)
```
┌─────────────────────────────────────────────────────────────────────────┐
│ bina.ma     Plomberie · Casablanca      [🔔 3 nouvelles alertes]  [Hassan]│
├──────────┬──────────────────────────────────────────────────────────────┤
│ Radar    │  Filtres: [Plomberie ×] [Casa ×] [< 10M MAD ×] [+ Ajouter]  │
│ Alertes  │──────────────────────────────────────────────────────────────│
│ Marchés  │  AO Travaux plomberie — Commune Ben M'Sik        8j  2.4M    │
│ Groupem. │  AO Sanitaire hôtel — ONCF Rabat                14j  5.1M    │
│ Dossier  │  AO Équipements sanitaires stade — CAN Stade    3j ⚠ 18M    │
│ Profil   │──────────────────────────────────────────────────────────────│
│          │  [+ Créer une alerte]          [Voir 47 marchés]             │
└──────────┴──────────────────────────────────────────────────────────────┘
```

## Groupement Formation Flow
```
See tender too large for one firm → [Créer un groupement] →
  Name the groupement → Select the tender → Declare needed specialties →
  [Inviter des partenaires] → Browse trade directory →
  Partners receive invite → Accept → Groupement FORMED → Work begins
```

## Compliance Flow
```
[Mon dossier] → Traffic light overview →
  ⚠ "Attestation fiscale expire dans 12 jours" →
  [Renouveler → DGI link] OR [J'ai renouvelé → Upload nouveau fichier]
  → Score updates from 68% → 85%
```

## Empty States
- No tenders matching alerts: "Aucun marché dans votre alerte. [Modifier vos critères]"
- No groupements: "Créez votre premier groupement pour un marché trop grand à seul. [+ Créer]"
- Compliance 0%: "Commencez par l'attestation fiscale et le quitus CNSS — ils sont requis partout."
