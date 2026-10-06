INSERT INTO roles (code, name) VALUES
    ('ADMIN', 'Quản trị viên'),
    ('STUDENT_AFFAIRS_ASSISTANT', 'Trợ lý Công tác Sinh viên'),
    ('HOMEROOM_TEACHER', 'Giảng viên chủ nhiệm'),
    ('CLASS_OFFICER', 'Ban cán sự lớp'),
    ('STUDENT', 'Sinh viên')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;