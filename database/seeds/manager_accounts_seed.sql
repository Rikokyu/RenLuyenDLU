CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO roles (code, name) VALUES
    ('ADMIN', 'Quản trị viên'),
    ('STUDENT_AFFAIRS_ASSISTANT', 'Trợ lý Công tác Sinh viên'),
    ('HOMEROOM_TEACHER', 'Giảng viên chủ nhiệm'),
    ('CLASS_OFFICER', 'Ban cán sự lớp'),
    ('STUDENT', 'Sinh viên')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO users (full_name, username, email, password_hash, role_id, unit)
SELECT
    'Nguyễn Trung Hiệp',
    '2312610',
    '2312610@dlu.edu.vn',
    crypt('abc123', gen_salt('bf', 10)),
    roles.id,
    'Quản trị hệ thống'
FROM roles
WHERE roles.code = 'ADMIN'
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    role_id = EXCLUDED.role_id,
    unit = EXCLUDED.unit,
    updated_at = NOW();

WITH seed_accounts(full_name, username, email, ordinal) AS (
    VALUES
        ('Trần Thị Minh Anh', 'ctsv01', 'ctsv01@dlu.edu.vn', 1),
        ('Lê Hoàng Bảo', 'ctsv02', 'ctsv02@dlu.edu.vn', 2),
        ('Phạm Ngọc Hà', 'ctsv03', 'ctsv03@dlu.edu.vn', 3),
        ('Võ Thành Nam', 'ctsv04', 'ctsv04@dlu.edu.vn', 4),
        ('Nguyễn Thùy Dương', 'ctsv05', 'ctsv05@dlu.edu.vn', 5)
)
INSERT INTO users (full_name, username, email, password_hash, role_id, unit)
SELECT seed_accounts.full_name, seed_accounts.username, seed_accounts.email,
       crypt('abc123', gen_salt('bf', 10)), roles.id, 'Phòng Công tác Sinh viên'
FROM seed_accounts
JOIN roles ON roles.code = 'STUDENT_AFFAIRS_ASSISTANT'
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    role_id = EXCLUDED.role_id,
    unit = EXCLUDED.unit,
    updated_at = NOW();

WITH seed_accounts(full_name, username, email, ordinal) AS (
    VALUES
        ('Nguyễn Văn An', 'gvcn01', 'gvcn01@dlu.edu.vn', 1),
        ('Trần Thị Bình', 'gvcn02', 'gvcn02@dlu.edu.vn', 2),
        ('Lê Minh Cường', 'gvcn03', 'gvcn03@dlu.edu.vn', 3),
        ('Phạm Thị Dung', 'gvcn04', 'gvcn04@dlu.edu.vn', 4),
        ('Hoàng Văn Em', 'gvcn05', 'gvcn05@dlu.edu.vn', 5),
        ('Nguyễn Thị Hạnh', 'gvcn06', 'gvcn06@dlu.edu.vn', 6),
        ('Võ Thành Khang', 'gvcn07', 'gvcn07@dlu.edu.vn', 7),
        ('Đỗ Thị Lan', 'gvcn08', 'gvcn08@dlu.edu.vn', 8),
        ('Bùi Văn Minh', 'gvcn09', 'gvcn09@dlu.edu.vn', 9),
        ('Nguyễn Thị Ngọc', 'gvcn10', 'gvcn10@dlu.edu.vn', 10)
), ordered_classes AS (
    SELECT code, ROW_NUMBER() OVER (ORDER BY code) AS ordinal
    FROM classes
)
INSERT INTO users (full_name, username, email, password_hash, role_id, unit, class_code)
SELECT seed_accounts.full_name, seed_accounts.username, seed_accounts.email,
       crypt('abc123', gen_salt('bf', 10)), roles.id, 'Cố vấn học tập', ordered_classes.code
FROM seed_accounts
JOIN ordered_classes USING (ordinal)
JOIN roles ON roles.code = 'HOMEROOM_TEACHER'
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    role_id = EXCLUDED.role_id,
    unit = EXCLUDED.unit,
    class_code = EXCLUDED.class_code,
    updated_at = NOW();

WITH seed_accounts(full_name, username, email, ordinal) AS (
    VALUES
        ('Lê Phương Thanh', 'bcs01', 'bcs01@dlu.edu.vn', 1),
        ('Vũ Ngọc Phi', 'bcs02', 'bcs02@dlu.edu.vn', 2),
        ('Lâm Phương Tân', 'bcs03', 'bcs03@dlu.edu.vn', 3),
        ('Phạm Quang Giang', 'bcs04', 'bcs04@dlu.edu.vn', 4),
        ('Trương Kim An', 'bcs05', 'bcs05@dlu.edu.vn', 5),
        ('Đoàn Mai Thông', 'bcs06', 'bcs06@dlu.edu.vn', 6),
        ('Hồ Thị Khanh', 'bcs07', 'bcs07@dlu.edu.vn', 7),
        ('Dương Anh Tài', 'bcs08', 'bcs08@dlu.edu.vn', 8),
        ('Đặng Lan Thiện', 'bcs09', 'bcs09@dlu.edu.vn', 9),
        ('Đỗ Hoàng Kỳ', 'bcs10', 'bcs10@dlu.edu.vn', 10)
), ordered_classes AS (
    SELECT code, ROW_NUMBER() OVER (ORDER BY code) AS ordinal
    FROM classes
), class_students AS (
    SELECT ordered_classes.code, ordered_classes.ordinal, students.student_id
    FROM ordered_classes
    LEFT JOIN LATERAL (
        SELECT student_id
        FROM students
        WHERE students.class_code = ordered_classes.code
        ORDER BY student_id
        LIMIT 1
    ) students ON TRUE
)
INSERT INTO users (full_name, username, email, password_hash, role_id, unit, class_code, student_id)
SELECT seed_accounts.full_name, seed_accounts.username, seed_accounts.email,
       crypt('abc123', gen_salt('bf', 10)), roles.id, 'Ban cán sự lớp', class_students.code,
       class_students.student_id
FROM seed_accounts
JOIN class_students USING (ordinal)
JOIN roles ON roles.code = 'CLASS_OFFICER'
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    role_id = EXCLUDED.role_id,
    unit = EXCLUDED.unit,
    class_code = EXCLUDED.class_code,
    student_id = EXCLUDED.student_id,
    updated_at = NOW();
