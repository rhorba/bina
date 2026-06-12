// Pure notification content builders — the unit-tested heart of @bina/notifications.
// Every notification has an in-app form ({ title, body, linkUrl }) and an email
// form ({ subject, html }). Both are derived here so the copy lives in ONE place
// and stays bilingual (FR primary, AR). No IO — these are pure functions.

export type NotificationLocale = "fr" | "ar";

// Mirrors packages/db notification_type enum.
export type NotificationKind =
  | "new_tender_match"
  | "tender_deadline"
  | "groupement_invite"
  | "groupement_update"
  | "doc_expiry"
  | "system";

// Loosely-typed payloads — the dispatch layer passes through whatever the caller
// has. Each builder reads the fields it needs and tolerates missing ones.
export type NotificationData = {
  tenderTitle?: string;
  maitreDOuvrage?: string;
  region?: string;
  tenderId?: string;
  daysRemaining?: number;
  groupementTitle?: string;
  groupementId?: string;
  inviterName?: string;
  docTypeLabel?: string;
  docExpiresInDays?: number;
  message?: string;
  title?: string;
};

export type InAppContent = { title: string; body: string; linkUrl?: string };
export type EmailContent = { subject: string; html: string };

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://bina.ma").replace(/\/$/, "");

// "—" em dash separator, used in both languages.
const SEP = " — ";

function dir(locale: NotificationLocale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

// Builds the in-app notification (the row the bell/dropdown renders).
export function buildInAppContent(
  kind: NotificationKind,
  data: NotificationData,
  locale: NotificationLocale = "fr"
): InAppContent {
  const ar = locale === "ar";
  switch (kind) {
    case "new_tender_match": {
      const title = data.tenderTitle ?? (ar ? "مناقصة جديدة" : "Nouvel appel d'offres");
      const parts = [data.maitreDOuvrage, data.region].filter(Boolean);
      return {
        title: ar ? `مناقصة مطابقة: ${title}` : `Nouvelle AO: ${title}`,
        body: parts.join(SEP),
        linkUrl: data.tenderId ? `/tenders/${data.tenderId}` : undefined,
      };
    }
    case "tender_deadline": {
      const title = data.tenderTitle ?? (ar ? "مناقصة" : "Appel d'offres");
      const d = data.daysRemaining ?? 0;
      return {
        title: ar ? `الموعد النهائي يقترب: ${title}` : `Échéance proche: ${title}`,
        body: ar
          ? `يتبقى ${d} ${d === 1 ? "يوم" : "أيام"} لتقديم العرض`
          : `Plus que ${d} jour${d > 1 ? "s" : ""} pour soumissionner`,
        linkUrl: data.tenderId ? `/tenders/${data.tenderId}` : undefined,
      };
    }
    case "groupement_invite": {
      const g = data.groupementTitle ?? (ar ? "تجمع" : "Groupement");
      return {
        title: ar ? `دعوة للانضمام: ${g}` : `Invitation à un groupement: ${g}`,
        body: data.inviterName
          ? ar
            ? `${data.inviterName} يدعوك للانضمام كعضو متضامن`
            : `${data.inviterName} vous invite comme cotraitant`
          : ar
            ? "تمت دعوتك كعضو متضامن"
            : "Vous êtes invité comme cotraitant",
        linkUrl: data.groupementId ? `/groupements/${data.groupementId}` : undefined,
      };
    }
    case "groupement_update": {
      const g = data.groupementTitle ?? (ar ? "تجمع" : "Groupement");
      return {
        title: ar ? `تحديث التجمع: ${g}` : `Mise à jour du groupement: ${g}`,
        body: data.message ?? (ar ? "تم تحديث حالة تجمعك" : "Le statut de votre groupement a changé"),
        linkUrl: data.groupementId ? `/groupements/${data.groupementId}` : undefined,
      };
    }
    case "doc_expiry": {
      const label = data.docTypeLabel ?? (ar ? "وثيقة" : "Document");
      const d = data.docExpiresInDays ?? 0;
      return {
        title: ar ? `وثيقة على وشك الانتهاء: ${label}` : `Document bientôt expiré: ${label}`,
        body:
          d <= 0
            ? ar
              ? "هذه الوثيقة منتهية الصلاحية — جددها لإبقاء ملفك مكتملاً"
              : "Ce document est expiré — renouvelez-le pour garder votre dossier complet"
            : ar
              ? `تنتهي صلاحية ${label} خلال ${d} ${d === 1 ? "يوم" : "أيام"}`
              : `Votre ${label} expire dans ${d} jour${d > 1 ? "s" : ""}`,
        linkUrl: "/dossier",
      };
    }
    default: {
      return {
        title: data.title ?? (ar ? "إشعار" : "Notification"),
        body: data.message ?? "",
      };
    }
  }
}

// Builds the email form. Subject mirrors the in-app title; the HTML body wraps
// the message with a short call-to-action link back into the app.
export function buildEmailContent(
  kind: NotificationKind,
  data: NotificationData,
  locale: NotificationLocale = "fr"
): EmailContent {
  const inApp = buildInAppContent(kind, data, locale);
  const ar = locale === "ar";
  const cta = inApp.linkUrl
    ? `${APP_URL}/${locale}${inApp.linkUrl}`
    : `${APP_URL}/${locale}/dashboard`;
  const ctaLabel = ar ? "عرض على Bina" : "Voir sur Bina";
  const footer = ar
    ? "أنت تتلقى هذا البريد لأنك مشترك في تنبيهات Bina."
    : "Vous recevez cet e-mail car vous êtes abonné aux alertes Bina.";

  const html = `<!doctype html>
<html lang="${locale}" dir="${dir(locale)}">
<body style="font-family:'IBM Plex Sans',Arial,sans-serif;color:#1E3A5F;margin:0;padding:24px;background:#F4F2EF;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;">
    <h1 style="font-size:18px;margin:0 0 12px;color:#1E3A5F;">${escapeHtml(inApp.title)}</h1>
    <p style="font-size:14px;line-height:1.6;color:#3a3a3a;margin:0 0 20px;">${escapeHtml(inApp.body)}</p>
    <a href="${cta}" style="display:inline-block;background:#E07B39;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:8px;">${ctaLabel}</a>
    <p style="font-size:12px;color:#8a8a8a;margin:24px 0 0;">${footer}</p>
  </div>
</body>
</html>`;

  return { subject: inApp.title, html };
}

// Minimal HTML escaping for interpolated user/tender data in email bodies.
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
