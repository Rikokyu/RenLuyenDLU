-- =========================================================
-- FILE: create_table.sql
-- Database: PostgreSQL
-- BBRY / Student Activity Management System
-- =========================================================

-- Xóa bảng nếu đã tồn tại (theo thứ tự phụ thuộc)
DROP TABLE IF EXISTS User_Permission CASCADE;
DROP TABLE IF EXISTS Permission_Detail CASCADE;
DROP TABLE IF EXISTS Permission CASCADE;
DROP TABLE IF EXISTS Address_Activity CASCADE;
DROP TABLE IF EXISTS Address_Detail CASCADE;
DROP TABLE IF EXISTS Address CASCADE;
DROP TABLE IF EXISTS Evidence CASCADE;
DROP TABLE IF EXISTS Activity_Registration CASCADE;
DROP TABLE IF EXISTS Activity CASCADE;
DROP TABLE IF EXISTS User_Post CASCADE;
DROP TABLE IF EXISTS Post CASCADE;
DROP TABLE IF EXISTS TrainingPoint CASCADE;
DROP TABLE IF EXISTS Class_Year CASCADE;
DROP TABLE IF EXISTS School_Year CASCADE;
DROP TABLE IF EXISTS Student CASCADE;
DROP TABLE IF EXISTS Class CASCADE;
DROP TABLE IF EXISTS Major CASCADE;
DROP TABLE IF EXISTS Lecturer CASCADE;
DROP TABLE IF EXISTS Faculty CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS Role CASCADE;

-- =========================================================
-- 1. ROLE
-- =========================================================
CREATE TABLE Role (
    ID BIGINT PRIMARY KEY,
    Name TEXT NOT NULL,
    Status INT DEFAULT 1
);

-- =========================================================
-- 2. USER
-- "User" được đặt trong dấu ngoặc kép vì USER là từ khóa
-- đặc biệt trong PostgreSQL.
-- =========================================================
CREATE TABLE "User" (
    ID BIGINT PRIMARY KEY,
    FirstName TEXT NOT NULL,
    LastName TEXT NOT NULL,
    Gender TEXT NOT NULL,
    DOB DATE NOT NULL,
    BirthPlace TEXT,
    Phone TEXT NOT NULL,
    Email TEXT NOT NULL UNIQUE,
    Password TEXT NOT NULL,
    Status INT DEFAULT 1,
    IdRole BIGINT,
    CONSTRAINT fk_user_role
        FOREIGN KEY (IdRole) REFERENCES Role(ID)
);

-- =========================================================
-- 3. FACULTY
-- =========================================================
CREATE TABLE Faculty (
    ID BIGINT PRIMARY KEY,
    Faculty_Code TEXT NOT NULL,
    Name TEXT NOT NULL,
    Status INT DEFAULT 1
);

-- =========================================================
-- 4. MAJOR
-- =========================================================
CREATE TABLE Major (
    ID BIGINT PRIMARY KEY,
    Major_Code TEXT NOT NULL,
    Name TEXT NOT NULL,
    Status INT DEFAULT 1,
    IdFaculty BIGINT,
    CONSTRAINT fk_major_faculty
        FOREIGN KEY (IdFaculty) REFERENCES Faculty(ID)
);

-- =========================================================
-- 5. LECTURER
-- =========================================================
CREATE TABLE Lecturer (
    ID BIGINT PRIMARY KEY,
    Lecturer_Code TEXT NOT NULL,
    IdFaculty BIGINT,
    IdUser BIGINT,
    CONSTRAINT fk_lecturer_faculty
        FOREIGN KEY (IdFaculty) REFERENCES Faculty(ID),
    CONSTRAINT fk_lecturer_user
        FOREIGN KEY (IdUser) REFERENCES "User"(ID)
);

-- =========================================================
-- 6. CLASS
-- =========================================================
CREATE TABLE Class (
    ID BIGINT PRIMARY KEY,
    Class_Code TEXT NOT NULL,
    Name TEXT NOT NULL,
    Status INT DEFAULT 1,
    IdMajor BIGINT,
    IdLecturer BIGINT,
    CONSTRAINT fk_class_major
        FOREIGN KEY (IdMajor) REFERENCES Major(ID),
    CONSTRAINT fk_class_lecturer
        FOREIGN KEY (IdLecturer) REFERENCES Lecturer(ID)
);

-- =========================================================
-- 7. STUDENT
-- =========================================================
CREATE TABLE Student (
    ID BIGINT PRIMARY KEY,
    Student_Code TEXT NOT NULL,
    IdClass BIGINT,
    IdUser BIGINT,
    CONSTRAINT fk_student_class
        FOREIGN KEY (IdClass) REFERENCES Class(ID),
    CONSTRAINT fk_student_user
        FOREIGN KEY (IdUser) REFERENCES "User"(ID)
);

-- =========================================================
-- 8. SCHOOL_YEAR
-- =========================================================
CREATE TABLE School_Year (
    ID BIGINT PRIMARY KEY,
    Year TEXT NOT NULL,
    Semester INT NOT NULL
);

-- =========================================================
-- 9. CLASS_YEAR
-- =========================================================
CREATE TABLE Class_Year (
    IdClass BIGINT NOT NULL,
    IdYear BIGINT NOT NULL,
    Status INT DEFAULT 1,
    PRIMARY KEY (IdClass, IdYear),
    CONSTRAINT fk_class_year_class
        FOREIGN KEY (IdClass) REFERENCES Class(ID),
    CONSTRAINT fk_class_year_year
        FOREIGN KEY (IdYear) REFERENCES School_Year(ID)
);

-- =========================================================
-- 10. TRAINING_POINT
-- =========================================================
CREATE TABLE TrainingPoint (
    ID BIGINT PRIMARY KEY,
    ScoreYourself INT DEFAULT 0,
    ScoreClass INT DEFAULT 0,
    ScoreFaculty INT DEFAULT 0,
    LastScore INT DEFAULT 0,
    Status INT DEFAULT 1,
    IdStudent BIGINT,
    IdYear BIGINT,
    CONSTRAINT fk_training_point_student
        FOREIGN KEY (IdStudent) REFERENCES Student(ID),
    CONSTRAINT fk_training_point_year
        FOREIGN KEY (IdYear) REFERENCES School_Year(ID)
);

-- =========================================================
-- 11. POST
-- =========================================================
CREATE TABLE Post (
    ID BIGINT PRIMARY KEY,
    Name TEXT NOT NULL,
    Status INT DEFAULT 1
);

-- =========================================================
-- 12. USER_POST
-- =========================================================
CREATE TABLE User_Post (
    IdUser BIGINT NOT NULL,
    IdPost BIGINT NOT NULL,
    PRIMARY KEY (IdUser, IdPost),
    CONSTRAINT fk_user_post_user
        FOREIGN KEY (IdUser) REFERENCES "User"(ID),
    CONSTRAINT fk_user_post_post
        FOREIGN KEY (IdPost) REFERENCES Post(ID)
);

-- =========================================================
-- 13. ACTIVITY
-- =========================================================
CREATE TABLE Activity (
    ID BIGINT PRIMARY KEY,
    Activity_Code TEXT NOT NULL,
    Title TEXT NOT NULL,
    TimeBegin TIMESTAMP NOT NULL,
    TimeEnd TIMESTAMP NOT NULL,
    Slot INT CHECK (Slot > 0),
    Detail TEXT,
    Score INT DEFAULT 0,
    Status INT DEFAULT 1,
    IdUser BIGINT,
    CONSTRAINT fk_activity_user
        FOREIGN KEY (IdUser) REFERENCES "User"(ID),
    CONSTRAINT chk_activity_time
        CHECK (TimeEnd > TimeBegin)
);

-- =========================================================
-- 14. ACTIVITY_REGISTRATION
-- =========================================================
CREATE TABLE Activity_Registration (
    ID BIGINT PRIMARY KEY,
    RegisteredAt TIMESTAMP NOT NULL,
    Status INT DEFAULT 1,
    IdStudent BIGINT,
    IdActivity BIGINT,
    CONSTRAINT fk_activity_registration_student
        FOREIGN KEY (IdStudent) REFERENCES Student(ID),
    CONSTRAINT fk_activity_registration_activity
        FOREIGN KEY (IdActivity) REFERENCES Activity(ID)
);

-- =========================================================
-- 15. EVIDENCE
-- =========================================================
CREATE TABLE Evidence (
    ID BIGINT PRIMARY KEY,
    SubmitAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Data TEXT NOT NULL,
    Status INT DEFAULT 0,
    IdAcRegis BIGINT,
    CONSTRAINT fk_evidence_activity_registration
        FOREIGN KEY (IdAcRegis) REFERENCES Activity_Registration(ID)
);

-- =========================================================
-- 16. ADDRESS
-- =========================================================
CREATE TABLE Address (
    ID BIGINT PRIMARY KEY,
    Number TEXT NOT NULL,
    Street TEXT NOT NULL,
    Ward TEXT,
    District TEXT,
    City TEXT,
    Status INT DEFAULT 1
);

-- =========================================================
-- 17. ADDRESS_DETAIL
-- =========================================================
CREATE TABLE Address_Detail (
    ID BIGINT PRIMARY KEY,
    Building TEXT,
    Note TEXT,
    IdAddress BIGINT,
    CONSTRAINT fk_address_detail_address
        FOREIGN KEY (IdAddress) REFERENCES Address(ID)
);

-- =========================================================
-- 18. ADDRESS_ACTIVITY
-- =========================================================
CREATE TABLE Address_Activity (
    IdActivity BIGINT NOT NULL,
    IdAdd_Detail BIGINT NOT NULL,
    PRIMARY KEY (IdActivity, IdAdd_Detail),
    CONSTRAINT fk_address_activity_activity
        FOREIGN KEY (IdActivity) REFERENCES Activity(ID),
    CONSTRAINT fk_address_activity_detail
        FOREIGN KEY (IdAdd_Detail) REFERENCES Address_Detail(ID)
);

-- =========================================================
-- 19. PERMISSION
-- =========================================================
CREATE TABLE Permission (
    ID BIGINT PRIMARY KEY,
    Name TEXT NOT NULL
);

-- =========================================================
-- 20. PERMISSION_DETAIL
-- =========================================================
CREATE TABLE Permission_Detail (
    ID BIGINT PRIMARY KEY,
    ActionName TEXT NOT NULL,
    ActionCode TEXT NOT NULL,
    CheckAction BOOLEAN DEFAULT TRUE,
    IdPermission BIGINT,
    CONSTRAINT fk_permission_detail_permission
        FOREIGN KEY (IdPermission) REFERENCES Permission(ID)
);

-- =========================================================
-- 21. USER_PERMISSION
-- =========================================================
CREATE TABLE User_Permission (
    IdUser BIGINT NOT NULL,
    IdPermission BIGINT NOT NULL,
    Licensed BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (IdUser, IdPermission),
    CONSTRAINT fk_user_permission_user
        FOREIGN KEY (IdUser) REFERENCES "User"(ID),
    CONSTRAINT fk_user_permission_permission
        FOREIGN KEY (IdPermission) REFERENCES Permission(ID)
);