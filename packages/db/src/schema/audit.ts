import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "join",
  "leave",
  "submit",
  "upload",
  "download",
  "delete",
]);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: uuid("actor_user_id").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull(),
    action: auditActionEnum("action").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    ipAddress: text("ip_address"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_actor_idx").on(t.actorUserId),
    index("audit_logs_entity_idx").on(t.entity, t.entityId),
    index("audit_logs_at_idx").on(t.at),
  ]
);
