import { beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";

type MockUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: Date | null;
};

type MockProfile = { id: string; userId: string; companyName: string };

const { state, resetState } = vi.hoisted(() => {
  const state = {
    users: [] as MockUser[],
    contractorProfiles: [] as MockProfile[],
    nextId: 1,
  };
  const resetState = () => {
    state.users = [];
    state.contractorProfiles = [];
    state.nextId = 1;
  };
  return { state, resetState };
});

vi.mock("drizzle-orm", () => ({
  eq: (column: string, value: unknown) => ({ column, value }),
}));

vi.mock("@bina/db", () => {
  const usersTable = { email: "email", id: "id" };
  const contractorProfilesTable = { userId: "userId", id: "id" };

  const matches = (row: Record<string, unknown>, where: { column: string; value: unknown }) =>
    row[where.column] === where.value;

  const db = {
    query: {
      users: {
        findFirst: async ({ where }: { where: { column: string; value: unknown } }) =>
          state.users.find((u) => matches(u, where)),
      },
      contractorProfiles: {
        findFirst: async ({ where }: { where: { column: string; value: unknown } }) =>
          state.contractorProfiles.find((p) => matches(p, where)),
      },
    },
    insert: (table: unknown) => ({
      // Real drizzle inserts execute on `.values(...)` itself — `.returning()`
      // only shapes what comes back. provision.ts calls `.values()` bare for
      // the contractor-profile insert, so the mock's side effect must happen
      // here too, not lazily inside `.returning()`.
      values: (vals: Record<string, unknown>) => {
        const row =
          table === usersTable
            ? ({ id: `user-${state.nextId++}`, lastLoginAt: null, ...vals } as MockUser)
            : ({ id: `profile-${state.nextId++}`, ...vals } as MockProfile);
        if (table === usersTable) {
          state.users.push(row as MockUser);
        } else {
          state.contractorProfiles.push(row as MockProfile);
        }
        return { returning: async () => [row] };
      },
    }),
    update: (_table: unknown) => ({
      set: (vals: Record<string, unknown>) => ({
        where: async (where: { column: string; value: unknown }) => {
          const row = state.users.find((u) => matches(u, where));
          if (row) Object.assign(row, vals);
        },
      }),
    }),
  };

  const withUserContext = async (
    _userId: string,
    _role: string,
    fn: (tx: typeof db) => Promise<unknown>
  ) => fn(db);

  return { db, users: usersTable, contractorProfiles: contractorProfilesTable, withUserContext };
});

const { provisionOAuthUser } = await import("./provision.js");

beforeEach(() => {
  resetState();
});

describe("provisionOAuthUser", () => {
  it("creates a user + contractor profile on first Google sign-in", async () => {
    const identity = await provisionOAuthUser("New.User@Example.com", "New User");

    expect(identity).not.toBeNull();
    expect(state.users).toHaveLength(1);
    expect(state.users[0]?.email).toBe("new.user@example.com");
    expect(state.users[0]?.role).toBe("contractor");
    expect(state.contractorProfiles).toHaveLength(1);
    expect(state.contractorProfiles[0]?.userId).toBe(identity?.id);
    expect(identity?.contractorId).toBe(state.contractorProfiles[0]?.id);
    expect(identity?.role).toBe("contractor");
  });

  it("reuses the existing user on a second Google sign-in — no duplicate row", async () => {
    const first = await provisionOAuthUser("repeat@example.com", "Repeat User");
    const second = await provisionOAuthUser("repeat@example.com", "Repeat User");

    expect(state.users).toHaveLength(1);
    expect(state.contractorProfiles).toHaveLength(1);
    expect(second?.id).toBe(first?.id);
    expect(second?.contractorId).toBe(first?.contractorId);
  });

  it("links to an existing active account by email instead of duplicating it", async () => {
    state.users.push({
      id: "existing-user",
      email: "hassan@demo.bina.ma",
      name: "Hassan",
      role: "contractor",
      isActive: true,
      emailVerified: false,
      lastLoginAt: null,
    });
    state.contractorProfiles.push({
      id: "existing-profile",
      userId: "existing-user",
      companyName: "Hassan Plomberie",
    });

    const identity = await provisionOAuthUser("hassan@demo.bina.ma", "Hassan Google");

    expect(state.users).toHaveLength(1);
    expect(identity?.id).toBe("existing-user");
    expect(identity?.contractorId).toBe("existing-profile");
  });

  it("rejects sign-in for a deactivated account", async () => {
    state.users.push({
      id: "banned-user",
      email: "banned@example.com",
      name: "Banned",
      role: "contractor",
      isActive: false,
      emailVerified: true,
      lastLoginAt: null,
    });

    const identity = await provisionOAuthUser("banned@example.com", "Banned");

    expect(identity).toBeNull();
    expect(state.users).toHaveLength(1);
  });

  it("stamps lastLoginAt on the resolved user", async () => {
    const identity = await provisionOAuthUser("timestamp@example.com", "Time User");

    const row = state.users.find((u) => u.id === identity?.id);
    expect(row?.lastLoginAt).toBeInstanceOf(Date);
  });

  it("falls back to the email as the company/display name when Google supplies no name", async () => {
    const identity = await provisionOAuthUser("noname@example.com", null);

    const row = state.users.find((u) => u.id === identity?.id);
    expect(row?.name).toBe("noname@example.com");
    const profile = state.contractorProfiles.find((p) => p.userId === identity?.id);
    expect(profile?.companyName).toBe("noname@example.com");
  });
});
