ALTER TABLE students
    ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS hometown_country TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS hometown_province TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS hometown_city TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS hometown_address TEXT NOT NULL DEFAULT '';

UPDATE students
SET hometown_country = CASE
    WHEN birth_place <> '' AND (
        hometown_country = '' OR
        hometown_country = U&'Vi\00E1\00BB\2021t Nam'
    ) THEN U&'Vi\1EC7t Nam'
        ELSE hometown_country
    END,
    hometown_address = CASE
        WHEN hometown_address = '' THEN birth_place
        ELSE hometown_address
    END
WHERE birth_place <> '';