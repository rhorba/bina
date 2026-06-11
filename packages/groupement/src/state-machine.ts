// Groupement state machine — Moroccan procurement law (Décret 2-12-349).
//
//   forming ──→ formed ──→ submitting ──→ submitted ──→ won
//      │           │            │              └────────→ lost
//      └───────────┴────────────┴──────────────────────→ withdrawn
//
// Status transitions driven by the mandataire (the legally-responsible lead),
// except win/loss which is recorded by the system once the result is published.

export type GroupementStatus =
  | "forming"
  | "formed"
  | "submitting"
  | "submitted"
  | "won"
  | "lost"
  | "withdrawn";

export type TransitionActor = "mandataire" | "system";

export type GroupementTransition = {
  from: GroupementStatus;
  to: GroupementStatus;
  allowedBy: TransitionActor;
};

export const VALID_TRANSITIONS: GroupementTransition[] = [
  { from: "forming", to: "formed", allowedBy: "mandataire" },
  { from: "formed", to: "submitting", allowedBy: "mandataire" },
  { from: "submitting", to: "submitted", allowedBy: "mandataire" },
  { from: "submitted", to: "won", allowedBy: "system" },
  { from: "submitted", to: "lost", allowedBy: "system" },
  // The mandataire may withdraw the groupement before the bid is submitted.
  { from: "forming", to: "withdrawn", allowedBy: "mandataire" },
  { from: "formed", to: "withdrawn", allowedBy: "mandataire" },
  { from: "submitting", to: "withdrawn", allowedBy: "mandataire" },
];

// Terminal states — no transition leaves them.
export const TERMINAL_STATUSES: readonly GroupementStatus[] = ["won", "lost", "withdrawn"];

export function isTerminalStatus(status: GroupementStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function isTransitionValid(from: GroupementStatus, to: GroupementStatus): boolean {
  return VALID_TRANSITIONS.some((t) => t.from === from && t.to === to);
}

// Who is permitted to perform a given transition, or undefined if invalid.
export function transitionActor(
  from: GroupementStatus,
  to: GroupementStatus
): TransitionActor | undefined {
  return VALID_TRANSITIONS.find((t) => t.from === from && t.to === to)?.allowedBy;
}

export function allowedNextStatuses(from: GroupementStatus): GroupementStatus[] {
  return VALID_TRANSITIONS.filter((t) => t.from === from).map((t) => t.to);
}

// The statuses a given actor (the mandataire, or the system result-recorder)
// is allowed to move this groupement into — drives the UI status dropdown.
export function allowedNextStatusesForActor(
  from: GroupementStatus,
  isMandataire: boolean
): GroupementStatus[] {
  return VALID_TRANSITIONS.filter(
    (t) => t.from === from && (t.allowedBy === "mandataire" ? isMandataire : true)
  ).map((t) => t.to);
}

export type TransitionCheck = { ok: true } | { ok: false; reason: string };

// Validate a requested transition for a member-initiated action. `system`
// transitions (won/lost) are not allowed through this contractor-facing path.
export function canTransition(
  from: GroupementStatus,
  to: GroupementStatus,
  isMandataire: boolean
): TransitionCheck {
  if (from === to) return { ok: false, reason: "same_status" };
  const actor = transitionActor(from, to);
  if (!actor) return { ok: false, reason: "invalid_transition" };
  if (actor === "mandataire" && !isMandataire) return { ok: false, reason: "not_mandataire" };
  return { ok: true };
}

export function assertTransition(
  from: GroupementStatus,
  to: GroupementStatus,
  isMandataire: boolean
): void {
  const check = canTransition(from, to, isMandataire);
  if (!check.ok) {
    throw new Error(`Invalid groupement transition ${from} → ${to}: ${check.reason}`);
  }
}
