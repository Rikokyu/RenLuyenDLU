-- Run once on an existing database to enable login for the accounts already seeded.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS ResponsibleFaculty TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS Password_Changed BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE "User"
SET Password = crypt('DLU@2026', gen_salt('bf', 10)),
    Password_Changed = FALSE;
