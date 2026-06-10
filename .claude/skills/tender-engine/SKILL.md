---
name: tender-engine
description: Scraper, tender parsing, filter matching, alert sweep. Trigger on: "scraper", "marchespublics", "tender", "alert", "parsing", "AO", "appel d'offres".
---
# Tender Engine — Bina

## Role
Own `packages/scraper` and `packages/tenders`. This is the acquisition engine.
The scraper runs nightly; alert sweep follows it. Both must be idempotent and resilient.

## Scraper Architecture (Playwright + pg-boss)

```typescript
// packages/scraper/src/scrape.ts
// Triggered by pg-boss job 'scraper.daily' at 06:00
export async function scrapeMarchesPublics(db: DB): Promise<ScrapeResult> {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  let newTenders = 0, updatedTenders = 0, errors = 0

  // Navigate to search results (travaux + fournitures + services)
  await page.goto('https://www.marchespublics.gov.ma/pmmp/index.html')
  await page.waitForLoadState('networkidle')

  // Paginate through results (typically 20/page, up to 200 total)
  let hasMore = true
  while (hasMore) {
    const tenderCards = await page.locator('.avis-item').all()
    for (const card of tenderCards) {
      await sleep(3000)  // rate limit: 1 req/3s
      try {
        const raw = await parseTenderCard(card)
        const { upserted } = await upsertTender(db, raw)
        if (upserted === 'created') newTenders++
        else if (upserted === 'updated') updatedTenders++
      } catch (err) {
        errors++
        await logScraperError(db, err)
      }
    }
    hasMore = await goToNextPage(page)
  }
  await browser.close()
  return { newTenders, updatedTenders, errors, scrapedAt: new Date() }
}
```

## Tender Parsing
```typescript
// packages/tenders/src/parser.ts
export function parseTenderHTML(html: string): RawTender {
  // Extract: title, maitreDOuvrage, type (travaux/fournitures/services),
  // region, estimatedBudget, publishedAt, submissionDeadline, dossierUrl
  // Detect lots: if title contains "Lot N°" → split into TenderLot[]
  // Infer requiredSpecialties from title keywords:
  //   "plomberie" / "sanitaire" → 'plomberie'
  //   "électricité" / "courants forts" → 'electricite'
  //   "voirie" / "VRD" → 'routes'
  // etc. — keyword mapping table in packages/tenders/src/specialty-keywords.ts
}
```

## Alert Sweep (pg-boss, after each scrape)
```typescript
// packages/tenders/src/alert-sweep.ts
export async function runAlertSweep(db: DB): Promise<AlertSweepResult> {
  const newTenders = await getNewTendersSinceLastSweep(db)
  const savedSearches = await getActiveSavedSearches(db)

  for (const search of savedSearches) {
    const matches = newTenders.filter(t => matchesSavedSearch(t, search.filters))
    if (matches.length > 0) {
      await createNotifications(db, search.contractorId, matches)
      await scheduleAlertEmail(db, search.contractorId, matches)
      await updateLastAlertAt(db, search.id)
    }
  }
}

function matchesSavedSearch(tender: Tender, filters: TenderFilters): boolean {
  if (filters.specialties?.length && !tender.requiredSpecialties.some(s => filters.specialties!.includes(s))) return false
  if (filters.regions?.length && !filters.regions.includes(tender.region)) return false
  if (filters.budgetMin && (!tender.estimatedBudgetMax || tender.estimatedBudgetMax < filters.budgetMin)) return false
  if (filters.budgetMax && (!tender.estimatedBudgetMin || tender.estimatedBudgetMin > filters.budgetMax)) return false
  if (filters.deadlineWithinDays) {
    const daysLeft = daysBetween(new Date(), tender.submissionDeadline)
    if (daysLeft > filters.deadlineWithinDays) return false
  }
  return true
}
```

## CSV Fallback Import
Admin can upload a CSV export from marchespublics.gov.ma via the admin dashboard.
The CSV import uses the same `upsertTender()` function as the scraper.
This is the safety net if the portal changes its HTML structure.

## Scraper Tests (IMPORTANT: never hit live portal in CI)
```typescript
// packages/scraper/src/__tests__/parser.test.ts
// Tests use HTML fixtures captured from the real portal
// vi.mock('playwright') — no real browser in CI
test('parses a travaux tender correctly', () => {
  const html = readFixture('travaux_plomberie.html')
  const tender = parseTenderHTML(html)
  expect(tender.type).toBe('travaux')
  expect(tender.requiredSpecialties).toContain('plomberie')
  expect(tender.submissionDeadline).toBeInstanceOf(Date)
})
```

## Checklist
- [ ] Scraper runs at 6am via pg-boss; idempotent (upsert by externalId)
- [ ] Rate limit: 1 req/3s enforced
- [ ] Alert sweep runs after scrape (not on a fixed timer)
- [ ] CSV fallback import in admin dashboard
- [ ] Tests use HTML fixtures — never hit live portal in CI
- [ ] Scraper errors logged to DB; admin dashboard shows scraper health

## Handoff Points
- **← DBA**: tenders + scraper_logs tables
- **← Backend Dev**: pg-boss job registration
- **→ Frontend Dev**: tender list + detail UI contracts
- **→ Tester**: HTML fixtures for parser tests
