import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: "contractor" | "admin";
    contractorId?: string;
  }

  interface Session {
    user: {
      id: string;
      role?: "contractor" | "admin";
      contractorId?: string;
    } & DefaultSession["user"];
  }
}
