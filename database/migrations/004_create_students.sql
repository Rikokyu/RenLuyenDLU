CREATE TABLE IF NOT EXISTS students (
	student_id TEXT PRIMARY KEY,
	class_code TEXT NOT NULL REFERENCES classes(code) ON UPDATE CASCADE,
	gender TEXT NOT NULL DEFAULT '',
	birth_day DATE,
	last_name TEXT NOT NULL DEFAULT '',
	first_name TEXT NOT NULL DEFAULT '',
	is_in_class BOOLEAN NOT NULL DEFAULT TRUE,
	birth_place TEXT NOT NULL DEFAULT '',
	class_role_id INTEGER NOT NULL DEFAULT 0,
	study_program_id TEXT NOT NULL DEFAULT '',
	permanent_residence TEXT NOT NULL DEFAULT '',
	student_name TEXT NOT NULL DEFAULT '',
	synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_class_code ON students(class_code);