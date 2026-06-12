// @bina/notifications — in-app notifications + best-effort Resend email.
// Channels (DB notification_type enum): new_tender_match, tender_deadline,
// groupement_invite, groupement_update, doc_expiry, system.
//
// Layering:
//   templates.ts  — pure FR/AR content builders (unit-tested)
//   email.ts      — Resend glue, env-gated no-op (excluded from unit coverage)
//   dispatch.ts   — notify(): in-app row + best-effort email (glue)
//   query.ts      — listNotifications / unreadCount (glue)
//   mutations.ts  — markRead / markAllRead (glue)

export {
  type NotificationKind,
  type NotificationLocale,
  type NotificationData,
  type InAppContent,
  type EmailContent,
  buildInAppContent,
  buildEmailContent,
  escapeHtml,
} from "./templates.js";
export { isResendConfigured, sendEmail } from "./email.js";
export { type NotifyParams, type NotifyResult, notify } from "./dispatch.js";
export { type NotificationRow, listNotifications, unreadCount } from "./query.js";
export { markRead, markAllRead } from "./mutations.js";
