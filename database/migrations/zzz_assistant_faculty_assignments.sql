BEGIN;

DO $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM "User"
        WHERE idrole = 2
          AND split_part(email, '@', 1) IN (
              'hieunt', 'phattv', 'chault', 'baopq', 'maivt',
              'annv', 'hanhtt', 'quanglm', 'longdh', 'tungbt'
          )
    ) <> 10 THEN
        RAISE EXCEPTION 'Expected all 10 seeded student affairs assistants before assigning faculties';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM faculty
        WHERE faculty_code IN ('CT', 'KT', 'AV', 'QT', 'DL', 'KC', 'LU', 'SP', 'TC', 'XH')
    ) <> 10 THEN
        RAISE EXCEPTION 'Expected all 10 seeded faculties before assigning assistants';
    END IF;
END $$;

UPDATE "User" AS u
SET responsiblefaculty = f.name
FROM (
    VALUES
        ('hieunt', 'CT'),
        ('phattv', 'KT'),
        ('chault', 'AV'),
        ('baopq', 'QT'),
        ('maivt', 'DL'),
        ('annv', 'KC'),
        ('hanhtt', 'LU'),
        ('quanglm', 'SP'),
        ('longdh', 'TC'),
        ('tungbt', 'XH')
) AS assignment(username, faculty_code)
JOIN faculty AS f ON f.faculty_code = assignment.faculty_code
WHERE split_part(u.email, '@', 1) = assignment.username
  AND u.idrole = 2;

COMMIT;
