import { describe, expect, it } from "vitest";
import {
  ForbiddenError,
  UnauthorizedError,
  assertAdmin,
  assertAuthenticated,
  assertContractor,
  assertOwnContractor,
  assertOwnResource,
  assertRole,
} from "./rbac.js";
import type { Session } from "./types.js";

const contractorSession: Session = {
  userId: "user-1",
  role: "contractor",
  contractorId: "contractor-1",
  email: "test@bina.ma",
};

const adminSession: Session = {
  userId: "admin-1",
  role: "admin",
  email: "admin@bina.ma",
};

describe("assertAuthenticated", () => {
  it("passes with a valid session", () => {
    expect(() => assertAuthenticated(contractorSession)).not.toThrow();
  });
  it("throws UnauthorizedError when session is null", () => {
    expect(() => assertAuthenticated(null)).toThrow(UnauthorizedError);
  });
});

describe("assertRole", () => {
  it("passes when role matches", () => {
    expect(() => assertRole(contractorSession, "contractor")).not.toThrow();
    expect(() => assertRole(adminSession, "admin")).not.toThrow();
  });
  it("throws ForbiddenError when role doesn't match", () => {
    expect(() => assertRole(contractorSession, "admin")).toThrow(ForbiddenError);
  });
  it("allows multiple roles", () => {
    expect(() => assertRole(contractorSession, "contractor", "admin")).not.toThrow();
  });
});

describe("assertContractor", () => {
  it("passes with a full contractor session", () => {
    expect(() => assertContractor(contractorSession)).not.toThrow();
  });
  it("throws ForbiddenError for admin session", () => {
    expect(() => assertContractor(adminSession)).toThrow(ForbiddenError);
  });
  it("throws ForbiddenError when contractorId is missing", () => {
    const noProfile: Session = { ...contractorSession, contractorId: undefined };
    expect(() => assertContractor(noProfile)).toThrow(ForbiddenError);
  });
});

describe("assertAdmin", () => {
  it("passes for admin", () => {
    expect(() => assertAdmin(adminSession)).not.toThrow();
  });
  it("throws ForbiddenError for contractor", () => {
    expect(() => assertAdmin(contractorSession)).toThrow(ForbiddenError);
  });
});

describe("assertOwnResource", () => {
  it("passes when userId matches", () => {
    expect(() => assertOwnResource(contractorSession, "user-1")).not.toThrow();
  });
  it("throws ForbiddenError when userId doesn't match", () => {
    expect(() => assertOwnResource(contractorSession, "user-2")).toThrow(ForbiddenError);
  });
  it("admin bypasses ownership check", () => {
    expect(() => assertOwnResource(adminSession, "any-user")).not.toThrow();
  });
});

describe("assertOwnContractor", () => {
  it("passes when contractorId matches", () => {
    expect(() => assertOwnContractor(contractorSession, "contractor-1")).not.toThrow();
  });
  it("throws ForbiddenError when contractorId doesn't match", () => {
    expect(() => assertOwnContractor(contractorSession, "contractor-2")).toThrow(ForbiddenError);
  });
  it("admin bypasses ownership check", () => {
    expect(() => assertOwnContractor(adminSession, "any-contractor")).not.toThrow();
  });
});
