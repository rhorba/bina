// marchespublics.gov.ma portal configuration — ALL portal-structure knowledge
// lives here so a portal redesign means editing one file (and re-capturing
// the HTML fixtures). If extraction breaks, the CSV fallback import keeps
// the platform alive (non-negotiable #10).

export const PORTAL = {
  baseUrl: "https://www.marchespublics.gov.ma",
  // Public consultation search, all open tenders, sorted by publication date
  searchUrl:
    "https://www.marchespublics.gov.ma/index.php?page=entreprise.EntrepriseAdvancedSearch&AllCons&searchAnnCons",

  selectors: {
    // Search results page
    resultRow: "table.table-results tr.row-consultation",
    resultRef: ".ref-consultation",
    resultDetailLink: "a.detail-consultation",
    nextPageLink: "a.pagination-next:not(.disabled)",

    // Detail page
    detailTitle: ".consultation-objet",
    detailMaitreDOuvrage: ".consultation-organisme",
    detailProcedure: ".consultation-procedure",
    detailRegion: ".consultation-lieu",
    detailBudget: ".consultation-estimation",
    detailPublishedAt: ".consultation-date-publication",
    detailDeadline: ".consultation-date-limite",
    detailOpeningDate: ".consultation-date-ouverture",
    detailDescription: ".consultation-description",
    detailDossierLink: "a.telecharger-dc",
    detailLotRow: "table.table-lots tr.row-lot",
    lotNumber: ".lot-numero",
    lotTitle: ".lot-intitule",
    lotBudget: ".lot-estimation",
  },
} as const;

// Non-negotiable #3: 1 request per 3 seconds.
export const RATE_LIMIT_MS = 3000;

// Safety cap — the portal lists ~200 new tenders/week; 30 pages × 20 rows
// is more than a nightly run ever needs.
export const MAX_PAGES = 30;
