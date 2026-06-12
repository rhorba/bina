import { describe, expect, it } from "vitest";
import {
  type NotificationKind,
  buildEmailContent,
  buildInAppContent,
  escapeHtml,
} from "./templates.js";

describe("escapeHtml", () => {
  it("escapes all five HTML-sensitive characters", () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
      "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;"
    );
  });

  it("leaves plain text untouched", () => {
    expect(escapeHtml("Réfection toiture")).toBe("Réfection toiture");
  });
});

describe("buildInAppContent — new_tender_match", () => {
  it("FR: prefixes 'Nouvelle AO' and joins client + region", () => {
    const c = buildInAppContent("new_tender_match", {
      tenderTitle: "Réfection école",
      maitreDOuvrage: "Commune de Casablanca",
      region: "Casablanca-Settat",
      tenderId: "t-1",
    });
    expect(c.title).toBe("Nouvelle AO: Réfection école");
    expect(c.body).toBe("Commune de Casablanca — Casablanca-Settat");
    expect(c.linkUrl).toBe("/tenders/t-1");
  });

  it("AR: uses Arabic prefix", () => {
    const c = buildInAppContent(
      "new_tender_match",
      { tenderTitle: "بناء مدرسة", region: "الرباط" },
      "ar"
    );
    expect(c.title).toContain("بناء مدرسة");
    expect(c.body).toBe("الرباط");
  });

  it("falls back to a generic title and omits link when data is sparse", () => {
    const c = buildInAppContent("new_tender_match", {});
    expect(c.title).toBe("Nouvelle AO: Nouvel appel d'offres");
    expect(c.body).toBe("");
    expect(c.linkUrl).toBeUndefined();
  });
});

describe("buildInAppContent — tender_deadline", () => {
  it("FR: pluralizes days", () => {
    const c = buildInAppContent("tender_deadline", {
      tenderTitle: "AO X",
      daysRemaining: 5,
      tenderId: "t-2",
    });
    expect(c.title).toBe("Échéance proche: AO X");
    expect(c.body).toBe("Plus que 5 jours pour soumissionner");
    expect(c.linkUrl).toBe("/tenders/t-2");
  });

  it("FR: singular for 1 day", () => {
    const c = buildInAppContent("tender_deadline", { daysRemaining: 1 });
    expect(c.body).toBe("Plus que 1 jour pour soumissionner");
  });

  it("AR: singular vs plural day word", () => {
    expect(buildInAppContent("tender_deadline", { daysRemaining: 1 }, "ar").body).toContain("يوم");
    expect(buildInAppContent("tender_deadline", { daysRemaining: 3 }, "ar").body).toContain("أيام");
  });

  it("defaults daysRemaining to 0 when missing", () => {
    expect(buildInAppContent("tender_deadline", {}).body).toBe(
      "Plus que 0 jour pour soumissionner"
    );
  });
});

describe("buildInAppContent — groupement_invite", () => {
  it("FR: names the inviter when present", () => {
    const c = buildInAppContent("groupement_invite", {
      groupementTitle: "Stade Tanger",
      inviterName: "SGTM",
      groupementId: "g-1",
    });
    expect(c.title).toBe("Invitation à un groupement: Stade Tanger");
    expect(c.body).toBe("SGTM vous invite comme cotraitant");
    expect(c.linkUrl).toBe("/groupements/g-1");
  });

  it("FR: generic body without inviter", () => {
    expect(buildInAppContent("groupement_invite", {}).body).toBe(
      "Vous êtes invité comme cotraitant"
    );
  });

  it("AR: with and without inviter", () => {
    expect(buildInAppContent("groupement_invite", { inviterName: "TGCC" }, "ar").body).toContain(
      "TGCC"
    );
    expect(buildInAppContent("groupement_invite", {}, "ar").body).toContain("متضامن");
  });
});

describe("buildInAppContent — groupement_update", () => {
  it("FR: uses provided message, falls back otherwise", () => {
    expect(
      buildInAppContent("groupement_update", { groupementId: "g-9", message: "Statut: constitué" })
        .body
    ).toBe("Statut: constitué");
    expect(buildInAppContent("groupement_update", {}).body).toBe(
      "Le statut de votre groupement a changé"
    );
  });

  it("AR fallback body", () => {
    expect(buildInAppContent("groupement_update", {}, "ar").body).toContain("تجمعك");
  });
});

describe("buildInAppContent — doc_expiry", () => {
  it("FR: future expiry pluralizes and links to /dossier", () => {
    const c = buildInAppContent("doc_expiry", {
      docTypeLabel: "Attestation fiscale",
      docExpiresInDays: 15,
    });
    expect(c.title).toBe("Document bientôt expiré: Attestation fiscale");
    expect(c.body).toBe("Votre Attestation fiscale expire dans 15 jours");
    expect(c.linkUrl).toBe("/dossier");
  });

  it("FR: singular day", () => {
    expect(
      buildInAppContent("doc_expiry", { docTypeLabel: "Quitus CNSS", docExpiresInDays: 1 }).body
    ).toBe("Votre Quitus CNSS expire dans 1 jour");
  });

  it("FR: already expired (<=0) switches to expired copy", () => {
    expect(buildInAppContent("doc_expiry", { docExpiresInDays: 0 }).body).toContain("expiré");
    expect(buildInAppContent("doc_expiry", { docExpiresInDays: -3 }).body).toContain("expiré");
  });

  it("AR: future and expired variants", () => {
    expect(
      buildInAppContent("doc_expiry", { docTypeLabel: "شهادة", docExpiresInDays: 2 }, "ar").body
    ).toContain("شهادة");
    expect(buildInAppContent("doc_expiry", { docExpiresInDays: 0 }, "ar").body).toContain(
      "منتهية"
    );
  });
});

describe("buildInAppContent — system / default", () => {
  it("uses title + message passthrough", () => {
    const c = buildInAppContent("system", { title: "Maintenance", message: "Demain 2h" });
    expect(c.title).toBe("Maintenance");
    expect(c.body).toBe("Demain 2h");
  });

  it("falls back to localized 'Notification' title", () => {
    expect(buildInAppContent("system", {}).title).toBe("Notification");
    expect(buildInAppContent("system", {}, "ar").title).toBe("إشعار");
  });
});

describe("buildEmailContent", () => {
  it("subject mirrors the in-app title", () => {
    const data = { tenderTitle: "AO Y", tenderId: "t-3" };
    expect(buildEmailContent("new_tender_match", data).subject).toBe(
      buildInAppContent("new_tender_match", data).title
    );
  });

  it("FR email: ltr dir, CTA into the app, FR footer", () => {
    const { html } = buildEmailContent("new_tender_match", { tenderId: "t-4" }, "fr");
    expect(html).toContain('dir="ltr"');
    expect(html).toContain("/fr/tenders/t-4");
    expect(html).toContain("Voir sur Bina");
    expect(html).toContain("alertes Bina");
  });

  it("AR email: rtl dir, AR CTA + footer", () => {
    const { html } = buildEmailContent("groupement_invite", { groupementId: "g-2" }, "ar");
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("/ar/groupements/g-2");
    expect(html).toContain("عرض على Bina");
  });

  it("escapes HTML-sensitive tender data in the body", () => {
    const { html } = buildEmailContent("new_tender_match", {
      tenderTitle: "<script>alert(1)</script>",
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("falls back to the dashboard CTA when the notification has no link", () => {
    const { html } = buildEmailContent("system", { title: "Info", message: "x" }, "fr");
    expect(html).toContain("/fr/dashboard");
  });

  it("covers every notification kind without throwing", () => {
    const kinds: NotificationKind[] = [
      "new_tender_match",
      "tender_deadline",
      "groupement_invite",
      "groupement_update",
      "doc_expiry",
      "system",
    ];
    for (const k of kinds) {
      expect(buildEmailContent(k, {}).subject.length).toBeGreaterThan(0);
    }
  });
});
