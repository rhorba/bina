import { describe, expect, it } from "vitest";
import {
  type GroupementStatus,
  TERMINAL_STATUSES,
  VALID_TRANSITIONS,
  allowedNextStatuses,
  allowedNextStatusesForActor,
  assertTransition,
  canTransition,
  isTerminalStatus,
  isTransitionValid,
  transitionActor,
} from "./state-machine.js";

describe("isTransitionValid", () => {
  it("accepts the happy path forming→formed→submitting→submitted→won", () => {
    expect(isTransitionValid("forming", "formed")).toBe(true);
    expect(isTransitionValid("formed", "submitting")).toBe(true);
    expect(isTransitionValid("submitting", "submitted")).toBe(true);
    expect(isTransitionValid("submitted", "won")).toBe(true);
    expect(isTransitionValid("submitted", "lost")).toBe(true);
  });

  it("allows withdrawal from any pre-submission state", () => {
    expect(isTransitionValid("forming", "withdrawn")).toBe(true);
    expect(isTransitionValid("formed", "withdrawn")).toBe(true);
    expect(isTransitionValid("submitting", "withdrawn")).toBe(true);
  });

  it("rejects skipping states and going backwards", () => {
    expect(isTransitionValid("forming", "submitted")).toBe(false);
    expect(isTransitionValid("formed", "forming")).toBe(false);
    expect(isTransitionValid("submitted", "forming")).toBe(false);
  });

  it("rejects transitions out of terminal states", () => {
    expect(isTransitionValid("won", "lost")).toBe(false);
    expect(isTransitionValid("lost", "won")).toBe(false);
    expect(isTransitionValid("withdrawn", "forming")).toBe(false);
    expect(isTransitionValid("submitted", "withdrawn")).toBe(false);
  });
});

describe("transitionActor", () => {
  it("attributes pre-submission transitions to the mandataire", () => {
    expect(transitionActor("forming", "formed")).toBe("mandataire");
    expect(transitionActor("submitting", "submitted")).toBe("mandataire");
    expect(transitionActor("formed", "withdrawn")).toBe("mandataire");
  });

  it("attributes result-recording to the system", () => {
    expect(transitionActor("submitted", "won")).toBe("system");
    expect(transitionActor("submitted", "lost")).toBe("system");
  });

  it("returns undefined for an invalid transition", () => {
    expect(transitionActor("forming", "won")).toBeUndefined();
  });
});

describe("allowedNextStatuses", () => {
  it("lists every valid next status", () => {
    expect(allowedNextStatuses("forming").sort()).toEqual(["formed", "withdrawn"]);
    expect(allowedNextStatuses("submitted").sort()).toEqual(["lost", "won"]);
  });

  it("returns empty for terminal states", () => {
    expect(allowedNextStatuses("won")).toEqual([]);
    expect(allowedNextStatuses("withdrawn")).toEqual([]);
  });
});

describe("allowedNextStatusesForActor", () => {
  it("gives the mandataire every pre-submission move", () => {
    expect(allowedNextStatusesForActor("forming", true).sort()).toEqual(["formed", "withdrawn"]);
  });

  it("hides mandataire-only moves from a non-mandataire", () => {
    expect(allowedNextStatusesForActor("forming", false)).toEqual([]);
    expect(allowedNextStatusesForActor("formed", false)).toEqual([]);
  });

  it("still surfaces system transitions to any actor", () => {
    expect(allowedNextStatusesForActor("submitted", false).sort()).toEqual(["lost", "won"]);
    expect(allowedNextStatusesForActor("submitted", true).sort()).toEqual(["lost", "won"]);
  });
});

describe("canTransition", () => {
  it("allows the mandataire to advance", () => {
    expect(canTransition("forming", "formed", true)).toEqual({ ok: true });
  });

  it("blocks a non-mandataire from a mandataire-only transition", () => {
    expect(canTransition("forming", "formed", false)).toEqual({
      ok: false,
      reason: "not_mandataire",
    });
  });

  it("rejects a no-op (same status)", () => {
    expect(canTransition("forming", "forming", true)).toEqual({
      ok: false,
      reason: "same_status",
    });
  });

  it("rejects an impossible transition", () => {
    expect(canTransition("forming", "submitted", true)).toEqual({
      ok: false,
      reason: "invalid_transition",
    });
  });

  it("allows a system transition regardless of mandataire flag", () => {
    expect(canTransition("submitted", "won", false)).toEqual({ ok: true });
  });
});

describe("assertTransition", () => {
  it("does not throw on a valid mandataire transition", () => {
    expect(() => assertTransition("forming", "formed", true)).not.toThrow();
  });

  it("throws with the reason on an invalid transition", () => {
    expect(() => assertTransition("forming", "submitted", true)).toThrow(/invalid_transition/);
    expect(() => assertTransition("forming", "formed", false)).toThrow(/not_mandataire/);
  });
});

describe("terminal states", () => {
  it("flags won/lost/withdrawn as terminal", () => {
    for (const s of TERMINAL_STATUSES) {
      expect(isTerminalStatus(s)).toBe(true);
    }
  });

  it("flags active states as non-terminal", () => {
    for (const s of ["forming", "formed", "submitting", "submitted"] as GroupementStatus[]) {
      expect(isTerminalStatus(s)).toBe(false);
    }
  });
});

describe("VALID_TRANSITIONS table", () => {
  it("has no duplicate from→to pairs", () => {
    const keys = VALID_TRANSITIONS.map((t) => `${t.from}->${t.to}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
