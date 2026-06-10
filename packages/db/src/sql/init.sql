-- Database initialization — run as superuser before migrations
-- Compatible with standard postgres:16-alpine (no extensions needed)

-- Create database if not exists (run separately as superuser)
-- CREATE DATABASE bina;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- Create app role for RLS
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bina_app') THEN
    CREATE ROLE bina_app LOGIN PASSWORD 'bina_secret';
  END IF;
END $$;

-- NOTE: the one-mandataire-per-groupement partial unique index lives in the
-- Drizzle migration (0000_init.sql) — it cannot be created here because this
-- file runs at first container boot, before migrations create the tables.
