// Sprint 4: groupement state machine + workspace logic
// Moroccan procurement law (Décret 2-12-349): one mandataire per groupement.
// DB enforces this via partial unique index.

export type GroupementTransition = {
  from: string;
  to: string;
  allowedBy: "mandataire" | "any_member" | "system";
};

export const VALID_TRANSITIONS: GroupementTransition[] = [
  { from: "forming", to: "formed", allowedBy: "mandataire" },
  { from: "formed", to: "submitting", allowedBy: "mandataire" },
  { from: "submitting", to: "submitted", allowedBy: "mandataire" },
  { from: "submitted", to: "won", allowedBy: "system" },
  { from: "submitted", to: "lost", allowedBy: "system" },
  { from: "forming", to: "withdrawn", allowedBy: "mandataire" },
  { from: "formed", to: "withdrawn", allowedBy: "mandataire" },
  { from: "submitting", to: "withdrawn", allowedBy: "mandataire" },
];

export function isTransitionValid(from: string, to: string): boolean {
  return VALID_TRANSITIONS.some((t) => t.from === from && t.to === to);
}
