// Dispatch glue — turns a typed notification request into (a) an in-app row and
// (b) a best-effort email. DB/IO layer, excluded from unit coverage; the content
// it relies on (templates.ts) is pure and fully unit-tested. Authorization is the
// caller's job — RLS scopes notifications to user_id = self OR admin.

import { type DB, notifications } from "@bina/db";
import { sendEmail } from "./email.js";
import {
  type NotificationData,
  type NotificationKind,
  type NotificationLocale,
  buildEmailContent,
  buildInAppContent,
} from "./templates.js";

export type NotifyParams = {
  userId: string;
  kind: NotificationKind;
  data: NotificationData;
  // Recipient email + preferred locale for the email copy. When omitted, only
  // the in-app notification is created (no email).
  email?: string | null;
  locale?: NotificationLocale;
};

export type NotifyResult = { inApp: boolean; emailed: boolean };

// Create one notification: always insert the in-app row, then fire the email if
// we have an address and Resend is configured. Email failures never throw.
export async function notify(db: DB, params: NotifyParams): Promise<NotifyResult> {
  const locale = params.locale ?? "fr";
  const content = buildInAppContent(params.kind, params.data, locale);

  await db.insert(notifications).values({
    userId: params.userId,
    type: params.kind,
    title: content.title,
    body: content.body,
    linkUrl: content.linkUrl ?? null,
    metadata: params.data as Record<string, unknown>,
  });

  let emailed = false;
  if (params.email) {
    const mail = buildEmailContent(params.kind, params.data, locale);
    emailed = await sendEmail(params.email, mail.subject, mail.html);
  }

  return { inApp: true, emailed };
}
