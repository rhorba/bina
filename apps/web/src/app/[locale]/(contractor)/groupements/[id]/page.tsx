import { getSession } from "@/auth/index.js";
import { DeadlineChip } from "@/components/tender/chips.js";
import { formatMAD } from "@bina/core";
import { db } from "@bina/db";
import {
  allowedNextStatusesForActor,
  getGroupementDetail,
  missingSpecialties,
} from "@bina/groupement";
import { ArrowLeft, Award, Crown, FileText, MapPin, ShieldCheck, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GroupementStatusChip } from "../_status-chip";
import {
  leaveGroupementAction,
  manageMemberAction,
  requestJoinAction,
  respondToInviteAction,
} from "../actions";
import { NotesForm } from "./_notes-form";
import { StatusTransitions } from "./_status-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function GroupementWorkspacePage({ params }: Props) {
  const { locale, id } = await params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/auth/login`);

  const detail = await getGroupementDetail(db, id);
  if (!detail) notFound();

  const [t, tSpec] = await Promise.all([
    getTranslations("groupement"),
    getTranslations("specialty"),
  ]);
  const moneyLocale = locale === "ar" ? "ar" : "fr";

  const { groupement, members, tenderTitle, tenderRegion, submissionDeadline } = detail;
  const myContractorId = session.contractorId;
  const isAdmin = session.role === "admin";

  const myRow = members.find((m) => m.contractorId === myContractorId);
  const amConfirmed = myRow?.status === "confirmed";
  const amMandataire = amConfirmed && myRow?.role === "mandataire";
  const myInvitePending = myRow?.status === "invited";
  const canViewWorkspace = amConfirmed || isAdmin;

  const activeMembers = members.filter((m) => m.status === "confirmed" || m.status === "invited");
  const confirmedMembers = members.filter((m) => m.status === "confirmed");

  const memberLikes = members.map((m) => ({
    contractorId: m.contractorId,
    specialty: m.specialty,
    role: m.role,
    status: m.status,
  }));
  const missing = missingSpecialties(groupement.neededSpecialties, memberLikes);
  const allowed = amMandataire ? allowedNextStatusesForActor(groupement.status, true) : [];

  return (
    <div className="max-w-3xl">
      <Link
        href={`/${locale}/groupements`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition mb-4"
      >
        <ArrowLeft size={15} />
        {t("backToList")}
      </Link>

      {/* Header */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold text-[var(--color-foreground)] leading-snug">
            {groupement.title}
          </h1>
          <div className="flex items-center gap-1.5 shrink-0">
            <GroupementStatusChip status={groupement.status} />
            {groupement.status === "forming" && <DeadlineChip deadline={submissionDeadline} />}
          </div>
        </div>
        <div className="flex items-center gap-x-4 gap-y-1 mt-2 text-sm text-[var(--color-muted)] flex-wrap">
          <Link
            href={`/${locale}/tenders/${groupement.tenderId}`}
            className="flex items-center gap-1 hover:text-[var(--color-primary)] min-w-0"
          >
            <FileText size={14} className="shrink-0" />
            <span className="truncate">{tenderTitle}</span>
          </Link>
          <span className="flex items-center gap-1">
            <MapPin size={14} />
            {tenderRegion}
          </span>
          <span className="flex items-center gap-1">
            <Users size={14} />
            {confirmedMembers.length} {t("confirmed")}
          </span>
          {groupement.targetBudgetCentimes != null && (
            <span className="font-medium text-[var(--color-foreground)]">
              {formatMAD(groupement.targetBudgetCentimes, moneyLocale)}
            </span>
          )}
        </div>

        {/* Seeking specialties */}
        {missing.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            <span className="text-xs text-[var(--color-muted)]">{t("stillSeeking")}:</span>
            {missing.map((s) => (
              <span
                key={s}
                className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
              >
                {tSpec(s)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* My pending invite */}
      {myInvitePending && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-warning)]/40 p-4 mb-5">
          <p className="text-sm text-[var(--color-foreground)] mb-3">{t("youAreInvited")}</p>
          <div className="flex gap-2">
            <form action={respondToInviteAction}>
              <input type="hidden" name="groupementId" value={groupement.id} />
              <input type="hidden" name="accept" value="true" />
              <button
                type="submit"
                className="text-sm font-medium rounded-lg px-4 py-2 bg-[var(--color-ok)] text-white hover:opacity-90 transition"
              >
                {t("accept")}
              </button>
            </form>
            <form action={respondToInviteAction}>
              <input type="hidden" name="groupementId" value={groupement.id} />
              <input type="hidden" name="accept" value="false" />
              <button
                type="submit"
                className="text-sm font-medium rounded-lg px-4 py-2 border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-urgent)] transition"
              >
                {t("decline")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Request to join (non-member, forming) */}
      {!myRow && !isAdmin && groupement.status === "forming" && myContractorId && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4 mb-5">
          <p className="text-sm font-semibold text-[var(--color-foreground)] mb-1">
            {t("joinTitle")}
          </p>
          <p className="text-sm text-[var(--color-muted)] mb-3">{t("joinHint")}</p>
          <form action={requestJoinAction} className="flex items-end gap-2 flex-wrap">
            <input type="hidden" name="groupementId" value={groupement.id} />
            <div>
              <label
                htmlFor="join-specialty"
                className="block text-xs text-[var(--color-muted)] mb-1"
              >
                {t("yourTrade")}
              </label>
              <select
                id="join-specialty"
                name="specialty"
                required
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
              >
                {(groupement.neededSpecialties.length > 0
                  ? groupement.neededSpecialties
                  : ["other"]
                ).map((s) => (
                  <option key={s} value={s}>
                    {tSpec(s)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="text-sm font-medium rounded-lg px-5 py-2 bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:bg-[var(--color-primary-mid)] transition"
            >
              {t("requestJoin")}
            </button>
          </form>
        </div>
      )}

      {/* Member list */}
      <section className="mb-5">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">
          {t("members")}
        </h2>
        <ul className="space-y-2">
          {activeMembers.map((m) => (
            <li
              key={m.id}
              className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {canViewWorkspace ? (
                      <Link
                        href={`/${locale}/entreprises/${m.contractorId}`}
                        className="font-semibold text-[var(--color-foreground)] hover:text-[var(--color-primary)] truncate"
                      >
                        {m.companyName}
                      </Link>
                    ) : (
                      <span className="font-semibold text-[var(--color-foreground)] truncate">
                        {m.companyName}
                      </span>
                    )}
                    {m.role === "mandataire" && (
                      <span
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        title={t("mandataireTitle")}
                      >
                        <Crown size={12} />
                        {t("mandataire")}
                      </span>
                    )}
                    {m.status === "invited" && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-warning)]/15 text-[var(--color-warning)]">
                        {t("pending")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-[var(--color-muted)] flex-wrap">
                    <span className="font-medium text-[var(--color-foreground)]">
                      {tSpec(m.specialty)}
                    </span>
                    {canViewWorkspace && (
                      <>
                        <span className="flex items-center gap-1">
                          <ShieldCheck size={13} />
                          {t("compliance")}: {m.complianceScore}%
                        </span>
                        {m.fnbtpCategory && (
                          <span className="flex items-center gap-1">
                            <Award size={13} />
                            {t(`fnbtp.${m.fnbtpCategory}`)}
                          </span>
                        )}
                        {m.estimatedShareCentimes != null && (
                          <span className="font-medium text-[var(--color-foreground)]">
                            {formatMAD(m.estimatedShareCentimes, moneyLocale)}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Mandataire confirms/declines pending members */}
                {amMandataire && m.status === "invited" && (
                  <div className="flex gap-1.5 shrink-0">
                    <form action={manageMemberAction}>
                      <input type="hidden" name="groupementId" value={groupement.id} />
                      <input type="hidden" name="memberContractorId" value={m.contractorId} />
                      <input type="hidden" name="accept" value="true" />
                      <button
                        type="submit"
                        className="text-xs font-medium rounded-lg px-3 py-1.5 bg-[var(--color-ok)] text-white hover:opacity-90 transition"
                      >
                        {t("confirm")}
                      </button>
                    </form>
                    <form action={manageMemberAction}>
                      <input type="hidden" name="groupementId" value={groupement.id} />
                      <input type="hidden" name="memberContractorId" value={m.contractorId} />
                      <input type="hidden" name="accept" value="false" />
                      <button
                        type="submit"
                        className="text-xs font-medium rounded-lg px-3 py-1.5 border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-urgent)] transition"
                      >
                        {t("decline")}
                      </button>
                    </form>
                  </div>
                )}

                {/* A cotraitant may leave (the mandataire withdraws instead) */}
                {amConfirmed && m.contractorId === myContractorId && m.role !== "mandataire" && (
                  <form action={leaveGroupementAction} className="shrink-0">
                    <input type="hidden" name="groupementId" value={groupement.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium rounded-lg px-3 py-1.5 border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-urgent)] transition"
                    >
                      {t("leave")}
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Workspace: status transitions + notes (confirmed members + admin only) */}
      {canViewWorkspace ? (
        <>
          {amMandataire && (
            <section className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5 mb-5">
              <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">
                {t("advanceStatus")}
              </h2>
              <StatusTransitions groupementId={groupement.id} allowed={allowed} missing={missing} />
            </section>
          )}

          <section className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5">
            <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">
              {t("workspaceNotes")}
            </h2>
            <NotesForm groupementId={groupement.id} initial={groupement.workspaceNotes ?? ""} />
          </section>
        </>
      ) : (
        <p className="text-sm text-[var(--color-muted)] bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5">
          {t("membersOnly")}
        </p>
      )}
    </div>
  );
}
