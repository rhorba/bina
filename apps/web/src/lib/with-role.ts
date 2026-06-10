import { getSession } from "@/auth/index.js";
import type { Role, Session } from "@bina/core";
import { ForbiddenError, UnauthorizedError, assertAuthenticated, assertRole } from "@bina/core";

// withRole: server action factory that enforces auth + role before executing the handler.
// Usage:
//   export const myAction = withRole(["contractor"], async (session, input) => { ... })
export function withRole<TInput, TOutput>(
  allowedRoles: Role[],
  handler: (session: Session, input: TInput) => Promise<TOutput>
) {
  return async (input: TInput): Promise<TOutput> => {
    const rawSession = await getSession();
    assertAuthenticated(rawSession as Session | null);
    assertRole(rawSession as Session, ...allowedRoles);
    return handler(rawSession as Session, input);
  };
}

// withAuth: for routes that just need authentication (any role).
export function withAuth<TInput, TOutput>(
  handler: (session: Session, input: TInput) => Promise<TOutput>
) {
  return withRole(["contractor", "admin"], handler);
}

export { UnauthorizedError, ForbiddenError };
