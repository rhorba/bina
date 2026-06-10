import type { Role, Session } from "./types.js";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function assertAuthenticated(session: Session | null): asserts session is Session {
  if (!session) throw new UnauthorizedError();
}

export function assertRole(session: Session, ...roles: Role[]): void {
  if (!roles.includes(session.role)) {
    throw new ForbiddenError(`Required role: ${roles.join(" or ")}`);
  }
}

export function assertContractor(
  session: Session
): asserts session is Session & { contractorId: string } {
  assertRole(session, "contractor");
  if (!session.contractorId) {
    throw new ForbiddenError("Contractor profile required");
  }
}

export function assertAdmin(session: Session): void {
  assertRole(session, "admin");
}

// assertOwnResource: ensure the actor owns the resource or is an admin.
export function assertOwnResource(session: Session, ownerId: string): void {
  if (session.role === "admin") return;
  if (session.userId !== ownerId) {
    throw new ForbiddenError("You can only access your own resources");
  }
}

// assertOwnContractor: ensure the actor is the contractor or admin.
export function assertOwnContractor(session: Session, contractorId: string): void {
  if (session.role === "admin") return;
  if (session.contractorId !== contractorId) {
    throw new ForbiddenError("You can only access your own contractor profile");
  }
}
