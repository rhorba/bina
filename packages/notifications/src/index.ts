// Sprint 6: in-app + Resend email alerts
// Channels: tender_alert, doc_expiry, groupement_invite, deadline_reminder

export type NotificationType =
  | "tender_alert"
  | "doc_expiry"
  | "groupement_invite"
  | "deadline_reminder";

export type NotificationPayload = {
  type: NotificationType;
  userId: string;
  data: Record<string, unknown>;
};

export async function sendNotification(_payload: NotificationPayload): Promise<void> {
  throw new Error("Notifications not implemented — Sprint 6");
}

export async function sendEmail(_to: string, _subject: string, _html: string): Promise<void> {
  throw new Error("Resend email not implemented — Sprint 6");
}
