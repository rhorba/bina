CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'join', 'leave', 'submit', 'upload', 'download', 'delete');--> statement-breakpoint
CREATE TYPE "public"."doc_status" AS ENUM('valid', 'expiring_soon', 'expired', 'pending_renewal');--> statement-breakpoint
CREATE TYPE "public"."doc_type" AS ENUM('attestation_fiscale', 'quitus_cnss', 'assurance_decennale', 'rc_pro', 'registre_commerce', 'statuts', 'qualification_fnbtp', 'reference_chantier', 'other');--> statement-breakpoint
CREATE TYPE "public"."company_size" AS ENUM('micro', 'tpe', 'pme', 'eti');--> statement-breakpoint
CREATE TYPE "public"."fnbtp_category" AS ENUM('premiere', 'deuxieme', 'troisieme', 'non_qualifie');--> statement-breakpoint
CREATE TYPE "public"."trade_specialty" AS ENUM('genie_civil', 'batiment', 'second_oeuvre', 'plomberie', 'electricite', 'courants_faibles', 'hvac', 'charpente', 'peinture', 'architecture', 'bureau_etudes', 'routes', 'hydraulique', 'equipment_supplier', 'other');--> statement-breakpoint
CREATE TYPE "public"."groupement_member_role" AS ENUM('mandataire', 'cotraitant');--> statement-breakpoint
CREATE TYPE "public"."groupement_member_status" AS ENUM('invited', 'confirmed', 'declined', 'left');--> statement-breakpoint
CREATE TYPE "public"."groupement_status" AS ENUM('forming', 'formed', 'submitting', 'submitted', 'won', 'lost', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('new_tender_match', 'tender_deadline', 'groupement_invite', 'groupement_update', 'doc_expiry', 'system');--> statement-breakpoint
CREATE TYPE "public"."maitre_d_ouvrage_type" AS ENUM('commune', 'ministere', 'etablissement_public', 'prive');--> statement-breakpoint
CREATE TYPE "public"."tender_status" AS ENUM('open', 'closing_soon', 'closed', 'awarded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."tender_type" AS ENUM('travaux', 'fournitures', 'services', 'conception_realisation');--> statement-breakpoint
CREATE TYPE "public"."tracked_tender_status" AS ENUM('watching', 'bidding', 'submitted', 'won', 'lost', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('contractor', 'admin');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" "audit_action" NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"ip_address" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_id" uuid NOT NULL,
	"type" "doc_type" NOT NULL,
	"file_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size_bytes" text,
	"issued_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"status" "doc_status" DEFAULT 'valid' NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contractor_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_name" text NOT NULL,
	"ice" text,
	"rc" text,
	"specialties" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"regions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"company_size" "company_size" DEFAULT 'tpe' NOT NULL,
	"employee_count" integer,
	"max_contract_value_centimes" bigint,
	"fnbtp_category" "fnbtp_category",
	"fnbtp_number" text,
	"avg_rating" numeric(3, 2) DEFAULT '0' NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"completed_tenders" integer DEFAULT 0 NOT NULL,
	"compliance_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contractor_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "groupement_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"groupement_id" uuid NOT NULL,
	"contractor_id" uuid NOT NULL,
	"specialty" text NOT NULL,
	"estimated_share_centimes" bigint,
	"role" "groupement_member_role" NOT NULL,
	"status" "groupement_member_status" DEFAULT 'invited' NOT NULL,
	"joined_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groupements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tender_id" uuid NOT NULL,
	"lot_id" uuid,
	"initiator_id" uuid NOT NULL,
	"title" text NOT NULL,
	"target_budget_centimes" bigint,
	"status" "groupement_status" DEFAULT 'forming' NOT NULL,
	"needed_specialties" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"workspace_notes" text,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"link_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_id" uuid NOT NULL,
	"title" text NOT NULL,
	"maitre_d_ouvrage" text NOT NULL,
	"contract_value_centimes" bigint,
	"completed_at" timestamp with time zone NOT NULL,
	"specialty" text NOT NULL,
	"description" text,
	"photo_keys" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"certificate_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tender_lots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tender_id" uuid NOT NULL,
	"lot_number" integer NOT NULL,
	"lot_title" text NOT NULL,
	"estimated_budget_centimes" bigint,
	"required_specialties" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "tenders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text NOT NULL,
	"title" text NOT NULL,
	"maitre_d_ouvrage" text NOT NULL,
	"maitre_d_ouvrage_type" "maitre_d_ouvrage_type" NOT NULL,
	"type" "tender_type" NOT NULL,
	"region" text NOT NULL,
	"estimated_budget_min_centimes" bigint,
	"estimated_budget_max_centimes" bigint,
	"published_at" timestamp with time zone NOT NULL,
	"submission_deadline" timestamp with time zone NOT NULL,
	"opening_date" timestamp with time zone,
	"required_specialties" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"required_fnbtp_category" text,
	"description" text,
	"dossier_url" text,
	"status" "tender_status" DEFAULT 'open' NOT NULL,
	"search_vector" text,
	"scraped_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenders_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_id" uuid NOT NULL,
	"name" text NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"alert_enabled" boolean DEFAULT true NOT NULL,
	"last_alert_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracked_tenders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_id" uuid NOT NULL,
	"tender_id" uuid NOT NULL,
	"status" "tracked_tender_status" DEFAULT 'watching' NOT NULL,
	"dossier_submitted_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text,
	"role" "role" DEFAULT 'contractor' NOT NULL,
	"phone" text,
	"city" text,
	"region" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "compliance_documents" ADD CONSTRAINT "compliance_documents_contractor_id_contractor_profiles_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractor_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractor_profiles" ADD CONSTRAINT "contractor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groupement_members" ADD CONSTRAINT "groupement_members_groupement_id_groupements_id_fk" FOREIGN KEY ("groupement_id") REFERENCES "public"."groupements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groupement_members" ADD CONSTRAINT "groupement_members_contractor_id_contractor_profiles_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractor_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groupements" ADD CONSTRAINT "groupements_tender_id_tenders_id_fk" FOREIGN KEY ("tender_id") REFERENCES "public"."tenders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groupements" ADD CONSTRAINT "groupements_lot_id_tender_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."tender_lots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groupements" ADD CONSTRAINT "groupements_initiator_id_contractor_profiles_id_fk" FOREIGN KEY ("initiator_id") REFERENCES "public"."contractor_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_references" ADD CONSTRAINT "project_references_contractor_id_contractor_profiles_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractor_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tender_lots" ADD CONSTRAINT "tender_lots_tender_id_tenders_id_fk" FOREIGN KEY ("tender_id") REFERENCES "public"."tenders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_contractor_id_contractor_profiles_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractor_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracked_tenders" ADD CONSTRAINT "tracked_tenders_contractor_id_contractor_profiles_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractor_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracked_tenders" ADD CONSTRAINT "tracked_tenders_tender_id_tenders_id_fk" FOREIGN KEY ("tender_id") REFERENCES "public"."tenders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_at_idx" ON "audit_logs" USING btree ("at");--> statement-breakpoint
CREATE UNIQUE INDEX "one_mandataire_per_groupement" ON "groupement_members" USING btree ("groupement_id") WHERE "groupement_members"."role" = 'mandataire' AND "groupement_members"."status" IN ('invited', 'confirmed');--> statement-breakpoint
CREATE INDEX "groupement_members_groupement_idx" ON "groupement_members" USING btree ("groupement_id");--> statement-breakpoint
CREATE INDEX "groupement_members_contractor_idx" ON "groupement_members" USING btree ("contractor_id");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tenders_status_deadline_idx" ON "tenders" USING btree ("status","submission_deadline");--> statement-breakpoint
CREATE INDEX "tenders_region_idx" ON "tenders" USING btree ("region");--> statement-breakpoint
CREATE INDEX "tenders_type_idx" ON "tenders" USING btree ("type");--> statement-breakpoint
CREATE INDEX "tenders_published_at_idx" ON "tenders" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "tenders_search_idx" ON "tenders" USING gin (to_tsvector('french', "title" || ' ' || coalesce("description", '')));--> statement-breakpoint
CREATE INDEX "tracked_tenders_contractor_idx" ON "tracked_tenders" USING btree ("contractor_id");--> statement-breakpoint
CREATE INDEX "tracked_tenders_tender_idx" ON "tracked_tenders" USING btree ("tender_id");