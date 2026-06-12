"use server";
import { getSession } from "@/auth/index.js";
import { withUserContext } from "@bina/db";
import { type CsvImportRunResult, runCsvImport } from "@bina/tenders";
import { revalidatePath } from "next/cache";

export type CsvImportState =
  | { ok: true; result: CsvImportRunResult }
  | { ok: false; error: string }
  | null;

// Admin CSV fallback (non-negotiable #10): when the portal structure changes,
// an admin uploads a marchespublics CSV export. Same upsert path as the scraper,
// logged to scraper_runs. Admin-only — enforced here and by the (admin) layout.
export async function importCsvAction(
  _prev: CsvImportState,
  formData: FormData
): Promise<CsvImportState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { ok: false, error: "forbidden" };
  }

  const file = formData.get("csv");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "noFile" };
  }
  if (file.size > 5_000_000) {
    return { ok: false, error: "tooLarge" };
  }

  const text = await file.text();
  try {
    const result = await withUserContext(session.userId, "admin", (tx) =>
      runCsvImport(tx, text, session.userId)
    );
    revalidatePath("/", "layout");
    return { ok: true, result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}
