---
name: content-editor
description: FR/AR BTP vocabulary, procurement terminology. Trigger on: "translation", "i18n", "fr.json", "ar.json".
---
# Content Editor — Bina

## Voice
- **Professional, sector-native**: use correct BTP vocabulary ("appel d'offres" not "offre d'emploi", "maître d'ouvrage" not "client")
- **Practical**: "3 jours restants" not "le délai expire bientôt"
- **Legally careful**: never say "Bina certifie votre conformité" — see compliance disclaimer rule

## Key strings (fr.json)
```json
{
  "nav": {
    "radar": "Radar des marchés", "groupements": "Mes groupements",
    "compliance": "Mon dossier", "dashboard": "Tableau de bord",
    "savedSearches": "Mes alertes", "tracking": "Mes marchés suivis"
  },
  "tender": {
    "type": {
      "travaux": "Travaux", "fournitures": "Fournitures",
      "services": "Services", "conception_realisation": "Conception-réalisation"
    },
    "deadline": "Dépôt avant le", "daysLeft": "{n} jours restants",
    "urgent": "Urgent — {n} jours", "lots": "Lots",
    "maitreDOuvrage": "Maître d'ouvrage", "region": "Région",
    "budget": "Montant estimé", "download": "Télécharger le dossier",
    "track": "Suivre ce marché", "untrack": "Ne plus suivre"
  },
  "specialty": {
    "genie_civil": "Génie civil", "batiment": "Bâtiment (gros œuvre)",
    "second_oeuvre": "Second œuvre", "plomberie": "Plomberie / Sanitaire",
    "electricite": "Électricité courants forts", "courants_faibles": "Courants faibles",
    "hvac": "CVC (Climatisation/Ventilation)", "charpente": "Charpente / Menuiserie",
    "peinture": "Peinture / Revêtements", "architecture": "Architecture",
    "bureau_etudes": "Bureau d'études", "routes": "Routes / VRD",
    "hydraulique": "Hydraulique", "equipment_supplier": "Fournisseur matériaux"
  },
  "groupement": {
    "status": {
      "forming": "En constitution", "formed": "Constitué",
      "submitting": "Dossier en cours", "submitted": "Candidature déposée",
      "won": "Marché remporté 🏆", "lost": "Non retenu", "withdrawn": "Retiré"
    },
    "mandataire": "Mandataire (chef de file)",
    "cotraitant": "Co-traitant",
    "seeking": "Recherche partenaire {specialty}",
    "invite": "Inviter à rejoindre",
    "legalNote": "Groupement conjoint — Décret 2-12-349 art. 154"
  },
  "compliance": {
    "score": "Complétude du dossier",
    "docs": {
      "attestation_fiscale": "Attestation fiscale (DGI)",
      "quitus_cnss": "Quitus CNSS",
      "assurance_decennale": "Assurance décennale",
      "rc_pro": "RC Professionnelle",
      "registre_commerce": "Registre de commerce",
      "qualification_fnbtp": "Qualification FNBTP",
      "reference_chantier": "Référence chantier"
    },
    "status": {
      "valid": "Valide ✓", "expiring_soon": "Expire dans {days} j",
      "expired": "Expiré — à renouveler", "pending_renewal": "En cours de renouvellement"
    },
    "disclaimer": "Outil de préparation uniquement. La vérification de conformité appartient au maître d'ouvrage."
  }
}
```

## Arabic (ar.json) — key strings
```json
{
  "nav": { "radar": "رادار المناقصات", "groupements": "مجموعاتي", "compliance": "ملفي" },
  "tender": {
    "deadline": "الإيداع قبل", "daysLeft": "{n} أيام متبقية",
    "urgent": "عاجل — {n} أيام", "type": { "travaux": "أشغال", "fournitures": "توريدات" }
  },
  "compliance": {
    "score": "اكتمال الملف",
    "docs": { "attestation_fiscale": "شهادة ضريبية", "quitus_cnss": "إبراء CNSS" }
  }
}
```

## Rules
- "Marché" = tender/contract (not "vente") — standard procurement vocabulary
- "Maître d'ouvrage" always in full (never shortened to "MO" in UI — most SMEs don't know the abbreviation)
- FNBTP categories: "1ère catégorie" / "2ème catégorie" / "3ème catégorie" — always spell out
- Compliance disclaimer must appear verbatim in the dossier builder output
