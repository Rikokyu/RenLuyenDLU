package app

import "gorm.io/gorm"

// MigrateEvidenceUploads preserves existing evidence IDs and initializes the sequence once.
// The transaction lock also serializes migrations from multiple backend instances.
func MigrateEvidenceUploads(db *gorm.DB) error {
	return db.Transaction(func(tx *gorm.DB) error {
		statements := []string{
			`SELECT pg_advisory_xact_lock(710202601)`,
			`CREATE TABLE IF NOT EXISTS app_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
		}
		for _, statement := range statements {
			if err := tx.Exec(statement).Error; err != nil {
				return err
			}
		}
		var count int64
		if err := tx.Table("app_migrations").Where("name = ?", "20261010_evidence_uploads").Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			return migrateEvidenceObjectStorage(tx)
		}
		statements = []string{
			`LOCK TABLE evidence IN ACCESS EXCLUSIVE MODE`,
			`CREATE SEQUENCE IF NOT EXISTS evidence_id_seq`,
			`SELECT setval('evidence_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM evidence), 0), (SELECT last_value FROM evidence_id_seq), 1), true)`,
			`ALTER TABLE evidence ALTER COLUMN id SET DEFAULT nextval('evidence_id_seq')`,
			`ALTER SEQUENCE evidence_id_seq OWNED BY evidence.id`,
			`CREATE TABLE evidence_upload (
				evidence_id BIGINT PRIMARY KEY REFERENCES evidence(id) ON DELETE CASCADE,
				created_by BIGINT NOT NULL REFERENCES "User"(id),
				request_key TEXT NOT NULL,
				filename TEXT NOT NULL,
				mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png')),
				sha256 TEXT NOT NULL,
				content BYTEA CHECK (octet_length(content) BETWEEN 1 AND 5242880),
				UNIQUE(created_by, request_key)
			)`,
			`INSERT INTO app_migrations(name) VALUES ('20261010_evidence_uploads')`,
		}
		for _, statement := range statements {
			if err := tx.Exec(statement).Error; err != nil {
				return err
			}
		}
		return migrateEvidenceObjectStorage(tx)
	})
}

func migrateEvidenceObjectStorage(tx *gorm.DB) error {
	statements := []string{
		`ALTER TABLE evidence_upload ALTER COLUMN content DROP NOT NULL`,
		`ALTER TABLE evidence_upload ADD COLUMN IF NOT EXISTS object_key TEXT`,
	}
	for _, statement := range statements {
		if err := tx.Exec(statement).Error; err != nil {
			return err
		}
	}
	return tx.Exec(`
		INSERT INTO app_migrations(name)
		VALUES ('20261010_minio_evidence_objects')
		ON CONFLICT (name) DO NOTHING
	`).Error
}
