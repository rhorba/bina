// @bina/tenders — tender parsing, filtering, upsert, CSV fallback.
// Sprint 3 adds the alert sweep on top of these primitives.

export * from "./types.js";
export * from "./specialty-keywords.js";
export * from "./parser.js";
export * from "./status.js";
export * from "./upsert.js";
export * from "./query.js";
export * from "./csv.js";
export * from "./csv-import.js";

export type TenderMatchResult = {
  contractorId: string;
  savedSearchId: string;
  tenderId: string;
  matchedAt: Date;
};

export async function runAlertSweep(): Promise<TenderMatchResult[]> {
  throw new Error("Alert sweep not implemented — Sprint 3");
}
