-- Runs after the base schema and seed scripts in docker-entrypoint-initdb.d.
ALTER TABLE IF EXISTS "User"
ADD COLUMN IF NOT EXISTS password_changed BOOLEAN NOT NULL DEFAULT FALSE;
