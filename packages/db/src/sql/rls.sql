-- Bina RLS setup — run AFTER migrations (pnpm --filter @bina/db rls)
-- Idempotent: policies are dropped and recreated on each run.
-- Uses standard postgres:16-alpine (no pgvector)

-- 1. App roles
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bina_app') THEN
    CREATE ROLE bina_app LOGIN PASSWORD 'bina_secret';
  END IF;
END $$;

-- 2. Grant schema + table access to app role
GRANT USAGE ON SCHEMA public TO bina_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bina_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bina_app;

-- 3. Enable RLS on user-scoped tables
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE groupement_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenders are PUBLIC — no RLS, all roles can SELECT
-- (public procurement data, acquisition hook)

-- 4. Helper: current app user
-- NULLIF guards the ''::uuid cast: once withUserContext SETs this GUC on a
-- pooled connection, it reverts to '' (not NULL) after the transaction, so a
-- later plain-db read would otherwise crash with "invalid input syntax for
-- type uuid: \"\"". Empty/unset → NULL → policies treat the caller as anonymous.
CREATE OR REPLACE FUNCTION current_app_user_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION current_app_user_role() RETURNS text AS $$
  SELECT current_setting('app.current_user_role', true);
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
  SELECT current_app_user_role() = 'admin';
$$ LANGUAGE sql STABLE;

-- 5. contractor_profiles — public read (trade directory + public profiles,
-- CLAUDE.md §7: "view other contractor profile: public fields only" — column
-- selection is the app layer's job), writes restricted to owner + admin.
DROP POLICY IF EXISTS contractor_profiles_select ON contractor_profiles;
CREATE POLICY contractor_profiles_select ON contractor_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS contractor_profiles_insert ON contractor_profiles;
CREATE POLICY contractor_profiles_insert ON contractor_profiles
  FOR INSERT WITH CHECK (user_id = current_app_user_id() OR is_admin());

DROP POLICY IF EXISTS contractor_profiles_update ON contractor_profiles;
CREATE POLICY contractor_profiles_update ON contractor_profiles
  FOR UPDATE USING (user_id = current_app_user_id() OR is_admin());

-- 6. compliance_documents — own contractor only + admin (PII)
DROP POLICY IF EXISTS compliance_documents_select ON compliance_documents;
CREATE POLICY compliance_documents_select ON compliance_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contractor_profiles cp
      WHERE cp.id = compliance_documents.contractor_id
        AND (cp.user_id = current_app_user_id() OR is_admin())
    )
  );

DROP POLICY IF EXISTS compliance_documents_insert ON compliance_documents;
CREATE POLICY compliance_documents_insert ON compliance_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM contractor_profiles cp
      WHERE cp.id = compliance_documents.contractor_id
        AND (cp.user_id = current_app_user_id() OR is_admin())
    )
  );

DROP POLICY IF EXISTS compliance_documents_update ON compliance_documents;
CREATE POLICY compliance_documents_update ON compliance_documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM contractor_profiles cp
      WHERE cp.id = compliance_documents.contractor_id
        AND (cp.user_id = current_app_user_id() OR is_admin())
    )
  );

DROP POLICY IF EXISTS compliance_documents_delete ON compliance_documents;
CREATE POLICY compliance_documents_delete ON compliance_documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM contractor_profiles cp
      WHERE cp.id = compliance_documents.contractor_id
        AND (cp.user_id = current_app_user_id() OR is_admin())
    )
  );

-- 7. tracked_tenders — own contractor + admin
DROP POLICY IF EXISTS tracked_tenders_select ON tracked_tenders;
CREATE POLICY tracked_tenders_select ON tracked_tenders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contractor_profiles cp
      WHERE cp.id = tracked_tenders.contractor_id
        AND (cp.user_id = current_app_user_id() OR is_admin())
    )
  );

DROP POLICY IF EXISTS tracked_tenders_insert ON tracked_tenders;
CREATE POLICY tracked_tenders_insert ON tracked_tenders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM contractor_profiles cp
      WHERE cp.id = tracked_tenders.contractor_id
        AND cp.user_id = current_app_user_id()
    )
  );

DROP POLICY IF EXISTS tracked_tenders_update ON tracked_tenders;
CREATE POLICY tracked_tenders_update ON tracked_tenders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM contractor_profiles cp
      WHERE cp.id = tracked_tenders.contractor_id
        AND (cp.user_id = current_app_user_id() OR is_admin())
    )
  );

-- 8. saved_searches — own contractor + admin
DROP POLICY IF EXISTS saved_searches_all ON saved_searches;
CREATE POLICY saved_searches_all ON saved_searches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM contractor_profiles cp
      WHERE cp.id = saved_searches.contractor_id
        AND (cp.user_id = current_app_user_id() OR is_admin())
    )
  );

-- 9. groupement_members — members of the groupement + admin
--
-- RLS recursion guard: a policy ON groupement_members must NOT read
-- groupement_members inline — Postgres re-applies the same policy to that inner
-- read, recursing forever ("infinite recursion detected in policy"). So every
-- membership/mandataire lookup goes through a SECURITY DEFINER function. These
-- functions run as their owner (the superuser that applies rls.sql), which
-- bypasses RLS, breaking the cycle. current_app_user_id() still reads the
-- per-request app.current_user_id GUC, so the check stays user-scoped.

-- Is the current app user a CONFIRMED member of this groupement?
CREATE OR REPLACE FUNCTION is_groupement_member(gid uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM groupement_members gm
    JOIN contractor_profiles cp ON cp.id = gm.contractor_id
    WHERE gm.groupement_id = gid
      AND gm.status = 'confirmed'
      AND cp.user_id = current_app_user_id()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Is the current app user the active mandataire of this groupement?
-- (Décret 2-12-349 — the lead firm drives membership + status changes.)
CREATE OR REPLACE FUNCTION is_groupement_mandataire(gid uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM groupement_members gm
    JOIN contractor_profiles cp ON cp.id = gm.contractor_id
    WHERE gm.groupement_id = gid
      AND gm.role = 'mandataire'
      AND gm.status = 'confirmed'
      AND cp.user_id = current_app_user_id()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Does a contractor row belong to the current app user? (Own invite / own row.)
-- Reads contractor_profiles, never groupement_members — no recursion — but go
-- through a definer function too so the lookup ignores contractor_profiles RLS.
CREATE OR REPLACE FUNCTION owns_contractor(cid uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM contractor_profiles cp
    WHERE cp.id = cid
      AND cp.user_id = current_app_user_id()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- SELECT: confirmed members see the whole roster; an invited firm sees its own
-- row (so it can accept/decline). Admin always.
DROP POLICY IF EXISTS groupement_members_select ON groupement_members;
CREATE POLICY groupement_members_select ON groupement_members
  FOR SELECT USING (
    is_admin()
    OR is_groupement_member(groupement_members.groupement_id)
    OR owns_contractor(groupement_members.contractor_id)
  );

-- INSERT: a contractor adds their OWN row (the initiator joining as mandataire),
-- or the active mandataire invites another firm as cotraitant. Admin always.
DROP POLICY IF EXISTS groupement_members_insert ON groupement_members;
CREATE POLICY groupement_members_insert ON groupement_members
  FOR INSERT WITH CHECK (
    is_admin()
    OR owns_contractor(groupement_members.contractor_id)
    OR is_groupement_mandataire(groupement_members.groupement_id)
  );

-- UPDATE: a member changes their OWN row (respond to invite / leave), or the
-- mandataire updates a member (shares, status). Admin always.
DROP POLICY IF EXISTS groupement_members_update ON groupement_members;
CREATE POLICY groupement_members_update ON groupement_members
  FOR UPDATE USING (
    is_admin()
    OR owns_contractor(groupement_members.contractor_id)
    OR is_groupement_mandataire(groupement_members.groupement_id)
  );

-- 10. project_references — own contractor (write) + public (read)
DROP POLICY IF EXISTS project_references_select ON project_references;
CREATE POLICY project_references_select ON project_references
  FOR SELECT USING (true); -- public: visible on contractor profiles

DROP POLICY IF EXISTS project_references_insert ON project_references;
CREATE POLICY project_references_insert ON project_references
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM contractor_profiles cp
      WHERE cp.id = project_references.contractor_id
        AND cp.user_id = current_app_user_id()
    )
  );

DROP POLICY IF EXISTS project_references_update ON project_references;
CREATE POLICY project_references_update ON project_references
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM contractor_profiles cp
      WHERE cp.id = project_references.contractor_id
        AND (cp.user_id = current_app_user_id() OR is_admin())
    )
  );

DROP POLICY IF EXISTS project_references_delete ON project_references;
CREATE POLICY project_references_delete ON project_references
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM contractor_profiles cp
      WHERE cp.id = project_references.contractor_id
        AND (cp.user_id = current_app_user_id() OR is_admin())
    )
  );

-- 11. notifications — SELECT/UPDATE owner-scoped; INSERT open to the app.
-- A contractor's server action (e.g. inviting a cotraitant) and the worker
-- sweeps must be able to create a notification TARGETED AT another user. Reading
-- and marking-read stay strictly owner-scoped, so a user still only ever sees
-- their own notifications. Mirrors the audit_logs INSERT-open pattern below.
DROP POLICY IF EXISTS notifications_all ON notifications; -- legacy FOR ALL policy
DROP POLICY IF EXISTS notifications_select ON notifications;
CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (user_id = current_app_user_id() OR is_admin());

DROP POLICY IF EXISTS notifications_insert ON notifications;
CREATE POLICY notifications_insert ON notifications
  FOR INSERT WITH CHECK (true); -- system/server-generated, owner-readable only

DROP POLICY IF EXISTS notifications_update ON notifications;
CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (user_id = current_app_user_id() OR is_admin());

-- 12. audit_logs — admin read only; insert open to app (logged by triggers)
DROP POLICY IF EXISTS audit_logs_select ON audit_logs;
CREATE POLICY audit_logs_select ON audit_logs
  FOR SELECT USING (is_admin() OR actor_user_id = current_app_user_id());

DROP POLICY IF EXISTS audit_logs_insert ON audit_logs;
CREATE POLICY audit_logs_insert ON audit_logs
  FOR INSERT WITH CHECK (true); -- app inserts audit logs for all actions
