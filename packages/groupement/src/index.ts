// @bina/groupement — groupement state machine + membership rules + db glue.
// Moroccan procurement law (Décret 2-12-349): one mandataire per groupement.
// The DB enforces this via the partial unique index `one_mandataire_per_groupement`.

export * from "./state-machine.js";
export * from "./membership.js";
export * from "./query.js";
export * from "./mutations.js";
