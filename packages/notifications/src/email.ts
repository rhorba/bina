// Resend email glue. IO layer — excluded from unit coverage like the R2 storage
// and DB query layers. Mirrors compliance/storage.ts: when RESEND_API_KEY is
// unset (local dev / CI), email degrades to a no-op so the rest of the app keeps
// working (in-app notifications still land) without leaking errors.

import { Resend } from "resend";

// Default sender — overridable via env. Must be a verified Resend domain in prod.
const DEFAULT_FROM = process.env.RESEND_FROM ?? "Bina <alertes@bina.ma>";

function resendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return { apiKey, from: DEFAULT_FROM };
}

export function isResendConfigured(): boolean {
  return resendConfig() !== null;
}

let cachedClient: Resend | null = null;
function resendClient() {
  const cfg = resendConfig();
  if (!cfg) return null;
  if (!cachedClient) cachedClient = new Resend(cfg.apiKey);
  return cachedClient;
}

// Send one email. Returns false when Resend is unconfigured (no-op) or the send
// throws — email is always best-effort and must never block the in-app path.
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const cfg = resendConfig();
  const client = resendClient();
  if (!cfg || !client) return false;
  try {
    await client.emails.send({ from: cfg.from, to, subject, html });
    return true;
  } catch (err) {
    console.error("[notifications] email send failed:", err);
    return false;
  }
}
