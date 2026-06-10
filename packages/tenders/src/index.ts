// Sprint 2: tender parsing, filter matching
// Sprint 3: alert sweep — match new tenders to saved search profiles

export type TenderMatchResult = {
  contractorId: string;
  savedSearchId: string;
  tenderId: string;
  matchedAt: Date;
};

export async function runAlertSweep(): Promise<TenderMatchResult[]> {
  throw new Error("Alert sweep not implemented — Sprint 3");
}
