import type { ScrapedTenderFields } from "@bina/tenders";
import { type HTMLElement, parse } from "node-html-parser";
import { PORTAL } from "./portal.js";

// Pure HTML → fields extraction. Playwright renders the page (the portal
// needs JS), then hands the HTML string here. Tests run these functions
// against captured fixtures — never against the live portal (CI rule).

export type TenderListEntry = {
  externalId: string;
  detailUrl: string;
};

function text(root: HTMLElement, selector: string): string {
  return root.querySelector(selector)?.textContent.trim() ?? "";
}

function attr(root: HTMLElement, selector: string, name: string): string | undefined {
  return root.querySelector(selector)?.getAttribute(name) ?? undefined;
}

function absoluteUrl(href: string): string {
  if (href.startsWith("http")) return href;
  return `${PORTAL.baseUrl}${href.startsWith("/") ? "" : "/"}${href}`;
}

export function extractTenderList(html: string): TenderListEntry[] {
  const root = parse(html);
  const entries: TenderListEntry[] = [];

  for (const row of root.querySelectorAll(PORTAL.selectors.resultRow)) {
    const externalId = text(row, PORTAL.selectors.resultRef);
    const href = attr(row, PORTAL.selectors.resultDetailLink, "href");
    if (externalId && href) {
      entries.push({ externalId, detailUrl: absoluteUrl(href) });
    }
  }
  return entries;
}

export function hasNextPage(html: string): boolean {
  return parse(html).querySelector(PORTAL.selectors.nextPageLink) !== null;
}

export function nextPageUrl(html: string): string | null {
  const href = parse(html)
    .querySelector(PORTAL.selectors.nextPageLink)
    ?.getAttribute("href");
  return href ? absoluteUrl(href) : null;
}

export function extractTenderDetail(html: string, externalId: string): ScrapedTenderFields {
  const root = parse(html);
  const s = PORTAL.selectors;

  const lots = root.querySelectorAll(s.detailLotRow).flatMap((row) => {
    const lotNumber = Number(text(row, s.lotNumber));
    const lotTitle = text(row, s.lotTitle);
    if (!lotNumber || !lotTitle) return [];
    const lotBudget = text(row, s.lotBudget);
    return [{ lotNumber, lotTitle, estimatedBudget: lotBudget || undefined }];
  });

  const dossierHref = attr(root, s.detailDossierLink, "href");

  return {
    externalId,
    title: text(root, s.detailTitle),
    maitreDOuvrage: text(root, s.detailMaitreDOuvrage),
    procedureType: text(root, s.detailProcedure) || undefined,
    region: text(root, s.detailRegion) || undefined,
    estimatedBudget: text(root, s.detailBudget) || undefined,
    publishedAt: text(root, s.detailPublishedAt),
    submissionDeadline: text(root, s.detailDeadline),
    openingDate: text(root, s.detailOpeningDate) || undefined,
    description: text(root, s.detailDescription) || undefined,
    dossierUrl: dossierHref ? absoluteUrl(dossierHref) : undefined,
    lots,
  };
}
