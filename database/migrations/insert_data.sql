-- Seed data for the legacy schema shared by User Management and Evidence.
-- Demo passwords use DLU@<MSSV-or-email-prefix>; the reset password is DLU@<current year>.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO Role VALUES
(1,'Admin',1),
(2,'Trợ lý công tác sinh viên',1),
(3,'Giảng viên chủ nhiệm / Ban cán sự',1),
(4,'Sinh viên',1);

INSERT INTO "User" VALUES
(1,'Nguyễn Trung','Hiệp','Nam','2003-01-10','Đà Lạt','0901000001','2312610@dlu.edu.vn',crypt('DLU@2312610',gen_salt('bf',10)),1,1),
(2,'Nguyễn Trọng','Hiếu','Nam','1980-01-15','Đà Lạt','0901000002','hieunt@dlu.edu.vn',crypt('DLU@hieunt',gen_salt('bf',10)),1,2),
(3,'Trần Văn','Phát','Nam','1982-02-20','Hà Nội','0901000003','phattv@dlu.edu.vn',crypt('DLU@phattv',gen_salt('bf',10)),1,2),
(4,'Lê Thị Minh','Châu','Nữ','1984-03-10','Bình Dương','0901000004','chault@dlu.edu.vn',crypt('DLU@chault',gen_salt('bf',10)),1,2),
(5,'Phạm Quốc','Bảo','Nam','1985-04-12','Đồng Nai','0901000005','baopq@dlu.edu.vn',crypt('DLU@baopq',gen_salt('bf',10)),1,2),
(6,'Võ Thị Thanh','Mai','Nữ','1986-05-18','Cần Thơ','0901000006','maivt@dlu.edu.vn',crypt('DLU@maivt',gen_salt('bf',10)),1,2),
(7,'Nguyễn Văn','An','Nam','1980-01-15','TP. Hồ Chí Minh','0901000007','annv@dlu.edu.vn',crypt('DLU@annv',gen_salt('bf',10)),1,3),
(8,'Trần Thị Bích','Hạnh','Nữ','1982-02-20','Hà Nội','0901000008','hanhtt@dlu.edu.vn',crypt('DLU@hanhtt',gen_salt('bf',10)),1,3),
(9,'Lê Minh','Quang','Nam','1984-03-10','Bình Dương','0901000009','quanglm@dlu.edu.vn',crypt('DLU@quanglm',gen_salt('bf',10)),1,3),
(10,'Đặng Hoàng','Long','Nam','1985-04-12','Đồng Nai','0901000010','longdh@dlu.edu.vn',crypt('DLU@longdh',gen_salt('bf',10)),1,3),
(11,'Bùi Thanh','Tùng','Nam','1986-05-18','Cần Thơ','0901000011','tungbt@dlu.edu.vn',crypt('DLU@tungbt',gen_salt('bf',10)),1,3),
(12,'Võ Thị Thu','Hà','Nữ','1987-06-22','Đà Nẵng','0901000012','havt@dlu.edu.vn',crypt('DLU@havt',gen_salt('bf',10)),1,3),
(13,'Đỗ Ngọc','Sơn','Nam','1983-07-08','Quảng Nam','0901000013','sondn@dlu.edu.vn',crypt('DLU@sondn',gen_salt('bf',10)),1,3),
(14,'Hoàng Minh','Đức','Nam','1981-08-25','Gia Lai','0901000014','duchm@dlu.edu.vn',crypt('DLU@duchm',gen_salt('bf',10)),1,3),
(15,'Vũ Anh','Tuấn','Nam','1988-09-30','Nghệ An','0901000015','tuanva@dlu.edu.vn',crypt('DLU@tuanva',gen_salt('bf',10)),1,3),
(16,'Dương Thị Ngọc','Lan','Nữ','1989-10-11','Khánh Hòa','0901000016','landt@dlu.edu.vn',crypt('DLU@landt',gen_salt('bf',10)),1,3),
(17,'Nguyễn Minh','Anh','Nữ','2003-01-10','Lâm Đồng','0911000001','2312621@dlu.edu.vn',crypt('DLU@2312621',gen_salt('bf',10)),1,3),
(18,'Trần Gia','Bảo','Nam','2003-02-12','Hà Nội','0911000002','2312622@dlu.edu.vn',crypt('DLU@2312622',gen_salt('bf',10)),1,3),
(19,'Lê Hoàng','Chi','Nữ','2003-03-14','Bình Dương','0911000003','2312623@dlu.edu.vn',crypt('DLU@2312623',gen_salt('bf',10)),1,3),
(20,'Phạm Quốc','Dũng','Nam','2003-04-16','Đồng Nai','0911000004','2312624@dlu.edu.vn',crypt('DLU@2312624',gen_salt('bf',10)),1,3),
(21,'Hoàng Ngọc','Em','Nữ','2003-05-18','Cần Thơ','0911000005','2312625@dlu.edu.vn',crypt('DLU@2312625',gen_salt('bf',10)),1,3),
(22,'Võ Thành','Đạt','Nam','2003-06-20','Đà Nẵng','0911000006','2312626@dlu.edu.vn',crypt('DLU@2312626',gen_salt('bf',10)),1,3),
(23,'Đỗ Thị Thu','Giang','Nữ','2003-07-22','Quảng Nam','0911000007','2312627@dlu.edu.vn',crypt('DLU@2312627',gen_salt('bf',10)),1,3),
(24,'Bùi Minh','Hải','Nam','2003-08-24','Gia Lai','0911000008','2312628@dlu.edu.vn',crypt('DLU@2312628',gen_salt('bf',10)),1,3),
(25,'Dương Khánh','Linh','Nữ','2003-09-26','Nghệ An','0911000009','2312629@dlu.edu.vn',crypt('DLU@2312629',gen_salt('bf',10)),1,3),
(26,'Phan Tuấn','Minh','Nam','2003-10-28','Khánh Hòa','0911000010','2312630@dlu.edu.vn',crypt('DLU@2312630',gen_salt('bf',10)),1,3),
(27,'Nguyễn Hoàng','Nam','Nam','2003-01-10','TP. Hồ Chí Minh','0921000001','2312631@dlu.edu.vn',crypt('DLU@2312631',gen_salt('bf',10)),1,3),
(28,'Trần Thị','Oanh','Nữ','2003-02-12','Hà Nội','0921000002','2312632@dlu.edu.vn',crypt('DLU@2312632',gen_salt('bf',10)),1,3),
(29,'Lê Văn','Phúc','Nam','2003-03-14','Bình Dương','0921000003','2312633@dlu.edu.vn',crypt('DLU@2312633',gen_salt('bf',10)),1,3),
(30,'Phạm Thị','Quyên','Nữ','2003-04-16','Đồng Nai','0921000004','2312634@dlu.edu.vn',crypt('DLU@2312634',gen_salt('bf',10)),1,3),
(31,'Hoàng Văn','Sơn','Nam','2003-05-18','Cần Thơ','0921000005','2312635@dlu.edu.vn',crypt('DLU@2312635',gen_salt('bf',10)),1,3),
(32,'Nguyễn Thị','Trang','Nữ','2003-06-20','Đà Nẵng','0921000006','2312636@dlu.edu.vn',crypt('DLU@2312636',gen_salt('bf',10)),1,3),
(33,'Võ Văn','Tùng','Nam','2003-07-22','Quảng Nam','0921000007','2312637@dlu.edu.vn',crypt('DLU@2312637',gen_salt('bf',10)),1,3),
(34,'Đỗ Thị','Uyên','Nữ','2003-08-24','Gia Lai','0921000008','2312638@dlu.edu.vn',crypt('DLU@2312638',gen_salt('bf',10)),1,3),
(35,'Bùi Văn','Vinh','Nam','2003-09-26','Nghệ An','0921000009','2312639@dlu.edu.vn',crypt('DLU@2312639',gen_salt('bf',10)),1,3),
(36,'Nguyễn Thị','Yến','Nữ','2003-10-28','Khánh Hòa','0921000010','2312640@dlu.edu.vn',crypt('DLU@2312640',gen_salt('bf',10)),1,3),
(37,'Nguyễn Gia','Hân','Nữ','2004-01-12','Lâm Đồng','0931000001','2312641@dlu.edu.vn',crypt('DLU@2312641',gen_salt('bf',10)),1,4),
(38,'Trần Minh','Khang','Nam','2004-02-14','Đồng Nai','0931000002','2312642@dlu.edu.vn',crypt('DLU@2312642',gen_salt('bf',10)),1,4),
(39,'Lê Thảo','My','Nữ','2004-03-16','Đắk Lắk','0931000003','2312643@dlu.edu.vn',crypt('DLU@2312643',gen_salt('bf',10)),1,4),
(40,'Phạm Quốc','Huy','Nam','2004-04-18','Gia Lai','0931000004','2312644@dlu.edu.vn',crypt('DLU@2312644',gen_salt('bf',10)),1,4),
(41,'Hoàng Ngọc','Mai','Nữ','2004-05-20','Khánh Hòa','0931000005','2312645@dlu.edu.vn',crypt('DLU@2312645',gen_salt('bf',10)),1,4),
(42,'Võ Anh','Tuấn','Nam','2004-06-22','Bình Thuận','0931000006','2312646@dlu.edu.vn',crypt('DLU@2312646',gen_salt('bf',10)),1,4),
(43,'Đỗ Khánh','Vy','Nữ','2004-07-24','Đồng Nai','0931000007','2312647@dlu.edu.vn',crypt('DLU@2312647',gen_salt('bf',10)),1,4),
(44,'Bùi Đức','Thịnh','Nam','2004-08-26','Lâm Đồng','0931000008','2312648@dlu.edu.vn',crypt('DLU@2312648',gen_salt('bf',10)),1,4),
(45,'Dương Thanh','Trúc','Nữ','2004-09-28','TP. Hồ Chí Minh','0931000009','2312649@dlu.edu.vn',crypt('DLU@2312649',gen_salt('bf',10)),1,4),
(46,'Phan Nhật','Nam','Nam','2004-10-30','Phú Yên','0931000010','2312650@dlu.edu.vn',crypt('DLU@2312650',gen_salt('bf',10)),1,4),
(47,'Nguyễn Hoài','An','Nữ','2004-01-14','Bình Định','0931000011','2312651@dlu.edu.vn',crypt('DLU@2312651',gen_salt('bf',10)),1,4),
(48,'Trần Quốc','Bảo','Nam','2004-02-16','Lâm Đồng','0931000012','2312652@dlu.edu.vn',crypt('DLU@2312652',gen_salt('bf',10)),1,4),
(49,'Lê Minh','Châu','Nữ','2004-03-18','Đắk Nông','0931000013','2312653@dlu.edu.vn',crypt('DLU@2312653',gen_salt('bf',10)),1,4),
(50,'Phạm Hoàng','Duy','Nam','2004-04-20','Ninh Thuận','0931000014','2312654@dlu.edu.vn',crypt('DLU@2312654',gen_salt('bf',10)),1,4),
(51,'Hoàng Thị','Giang','Nữ','2004-05-22','Lâm Đồng','0931000015','2312655@dlu.edu.vn',crypt('DLU@2312655',gen_salt('bf',10)),1,4),
(52,'Võ Thành','Long','Nam','2004-06-24','Đồng Nai','0931000016','2312656@dlu.edu.vn',crypt('DLU@2312656',gen_salt('bf',10)),1,4),
(53,'Đỗ Ngọc','Nhi','Nữ','2004-07-26','Gia Lai','0931000017','2312657@dlu.edu.vn',crypt('DLU@2312657',gen_salt('bf',10)),1,4),
(54,'Bùi Hoàng','Phúc','Nam','2004-08-28','Bình Thuận','0931000018','2312658@dlu.edu.vn',crypt('DLU@2312658',gen_salt('bf',10)),1,4),
(55,'Dương Khánh','Tiên','Nữ','2004-09-30','Lâm Đồng','0931000019','2312659@dlu.edu.vn',crypt('DLU@2312659',gen_salt('bf',10)),1,4),
(56,'Phan Minh','Quân','Nam','2004-10-12','Đắk Lắk','0931000020','2312660@dlu.edu.vn',crypt('DLU@2312660',gen_salt('bf',10)),1,4),
(57,'Sinh viên','Sư phạm','Nữ','2004-11-01','Lâm Đồng','0931000021','2312661@dlu.edu.vn',crypt('DLU@2312661',gen_salt('bf',10)),1,4);

UPDATE "User" SET Password = crypt('DLU@2026', gen_salt('bf', 10)), Password_Changed = FALSE;

UPDATE "User" SET IdRole = 2 WHERE ID BETWEEN 7 AND 11;
UPDATE "User" SET IdRole = 4 WHERE ID BETWEEN 17 AND 57;
UPDATE "User"
SET IdRole = 3
WHERE ID IN (12,13,14,15,16,17,18,22,23,24,27,28,29,32,33,39,40,41,43,45,47,49,51,55,57);

INSERT INTO Faculty VALUES
(1,'CT','Công nghệ thông tin',1),(2,'KT','Kinh tế',1),(3,'AV','Ngôn ngữ Anh',1),(4,'QT','Quản trị kinh doanh',1),
(5,'DL','Du lịch',1),(6,'KC','Kỹ thuật công trình',1),(7,'LU','Luật',1),(8,'SP','Sư phạm',1),
(9,'TC','Tài chính - Ngân hàng',1),(10,'XH','Công tác xã hội',1);

-- Major contains program/specialization options; class codes use a two-letter field prefix.
INSERT INTO Major VALUES
(1,'CT-PM','Công nghệ phần mềm',1,1),(2,'CT-MT','Mạng máy tính',1,1),(3,'TM-DT','Thương mại điện tử',1,2),
(4,'QT-KD','Quản trị kinh doanh',1,4),(5,'AV-NN','Ngôn ngữ Anh',1,3),(6,'DL-LH','Quản trị dịch vụ du lịch và lữ hành',1,5),
(7,'KC-XD','Kỹ thuật xây dựng',1,6),(8,'LU-KT','Luật kinh tế',1,7),(9,'TC-NH','Tài chính - Ngân hàng',1,9),
(10,'XH-CTXH','Công tác xã hội',1,10),(11,'KT-KT','Kế toán',1,2),(12,'QT-MK','Marketing',1,4),
(13,'CT-AT','An toàn thông tin',1,1),(14,'CT-KDL','Khoa học dữ liệu',1,1),(15,'CT-AI','Trí tuệ nhân tạo',1,1),
(16,'KT-PT','Kinh tế phát triển',1,2),(17,'AV-BD','Biên - phiên dịch tiếng Anh',1,3),
(18,'AV-GD','Giảng dạy tiếng Anh',1,3),(19,'DL-KS','Quản trị khách sạn',1,5),
(20,'DL-NH','Quản trị nhà hàng',1,5),(21,'TC-TD','Tài chính doanh nghiệp',1,9),
(22,'LU-TM','Luật thương mại',1,7),(23,'XH-PT','Phát triển cộng đồng',1,10),
(24,'QT-NL','Quản trị nguồn nhân lực',1,4),(25,'QT-KDQT','Kinh doanh quốc tế',1,4),
(26,'KT-KTKT','Kế toán - kiểm toán',1,2),(27,'KT-DT','Kinh tế đầu tư',1,2),
(28,'SP-GD','Sư phạm',1,8);

INSERT INTO Lecturer VALUES
(1,'GV001',1,12),(2,'GV002',2,13),(3,'GV003',3,14),(4,'GV004',4,15),(5,'GV005',5,16);

INSERT INTO Class VALUES
(1,'CTK47A','Công nghệ thông tin khóa 47A',1,1,1),(2,'CTK47B','Công nghệ thông tin khóa 47B',1,2,1),
(3,'CTK47C','Công nghệ thông tin khóa 47C',1,13,1),(4,'CTK47D','Công nghệ thông tin khóa 47D',1,14,1),
(5,'CTK47E','Công nghệ thông tin khóa 47E',1,15,1),(6,'KTK50A','Kinh tế phát triển khóa 50A',1,16,2),
(7,'KTK50B','Kinh tế đầu tư khóa 50B',1,27,2),(8,'KTK50C','Kinh tế phát triển khóa 50C',1,16,2),
(9,'KTK50D','Kinh tế đầu tư khóa 50D',1,27,2),(10,'KTK50E','Kinh tế phát triển khóa 50E',1,16,2),
(11,'TMK50A','Thương mại điện tử khóa 50A',1,3,2),(12,'QTK50A','Quản trị kinh doanh khóa 50A',1,4,4),
(13,'AVK50A','Ngôn ngữ Anh khóa 50A',1,5,3),(14,'DLK50A','Du lịch khóa 50A',1,6,3),
(15,'KCK50A','Kỹ thuật công trình khóa 50A',1,7,1),(16,'LUK50A','Luật kinh tế khóa 50A',1,8,2),
(17,'TCK50A','Tài chính ngân hàng khóa 50A',1,9,4),(18,'XHK50A','Công tác xã hội khóa 50A',1,10,5),
(19,'KTK50F','Kế toán khóa 50F',1,11,2),(20,'MKK50A','Marketing khóa 50A',1,12,4),
(21,'SPK50A','Sư phạm khóa 50A',1,28,1);

INSERT INTO Student VALUES
(1,'2312631',1,27),(2,'2312632',2,28),(3,'2312633',3,29),(4,'2312634',4,30),(5,'2312635',5,31),
(6,'2312636',6,32),(7,'2312637',7,33),(8,'2312638',8,34),(9,'2312639',9,35),(10,'2312640',10,36),
(11,'2312621',1,17),(12,'2312622',2,18),(13,'2312623',3,19),(14,'2312624',4,20),(15,'2312625',5,21),
(16,'2312626',6,22),(17,'2312627',7,23),(18,'2312628',8,24),(19,'2312629',9,25),(20,'2312630',10,26),
(21,'2312610',NULL,1),
(22,'2312641',11,37),(23,'2312642',11,38),(24,'2312643',12,39),(25,'2312644',12,40),
(26,'2312645',13,41),(27,'2312646',13,42),(28,'2312647',14,43),(29,'2312648',14,44),
(30,'2312649',15,45),(31,'2312650',15,46),(32,'2312651',16,47),(33,'2312652',16,48),
(34,'2312653',17,49),(35,'2312654',17,50),(36,'2312655',18,51),(37,'2312656',18,52),
(38,'2312657',19,53),(39,'2312658',19,54),(40,'2312659',20,55),(41,'2312660',20,56),
(42,'2312661',21,57);

INSERT INTO School_Year VALUES
(1,'2025-2026',1),(2,'2025-2026',2),(3,'2025-2026',3),(4,'2026-2027',1),(5,'2026-2027',2),
(6,'2026-2027',3),(7,'2027-2028',1),(8,'2027-2028',2),(9,'2027-2028',3),(10,'2028-2029',1);

INSERT INTO Class_Year VALUES
(1,1,1),(2,1,1),(3,2,1),(4,2,1),(5,3,1),(6,3,1),(7,4,1),(8,4,1),(9,5,1),(10,5,1),
(11,4,1),(12,4,1),(13,5,1),(14,5,1),(15,6,1),(16,6,1),(17,7,1),(18,7,1),(19,8,1),(20,8,1),
(21,4,1);

INSERT INTO TrainingPoint VALUES
(1,80,85,85,85,1,1,1),(2,90,90,92,91,1,2,1),(3,75,78,78,78,1,3,2),
(4,88,86,87,87,1,4,2),(5,92,90,91,91,1,5,3),(6,70,75,73,73,1,6,3),
(7,84,82,83,83,1,7,4),(8,95,94,93,94,1,8,4),(9,79,80,81,80,1,9,5),(10,87,89,88,88,1,10,5);

INSERT INTO Post VALUES
(1,'Giảng viên chủ nhiệm',1),(2,'Lớp trưởng',1),(3,'Bí thư lớp',1),(4,'Bí thư khoa',1);

INSERT INTO User_Post VALUES
(12,1),(13,1),(14,1),(15,1),(16,1),
(27,2),(28,2),(32,2),(33,2),(39,2),
(17,3),(18,3),(22,3),(23,3),(40,3),
(29,4),(24,4),(41,4),(55,4),(43,4),(45,4),(47,4),(49,4),(51,4),(57,4);

INSERT INTO Activity VALUES
(1,'ACT01','Chiến dịch Mùa hè xanh','2026-07-01 07:00:00','2026-07-15 17:00:00',50,'Hỗ trợ cộng đồng',20,1,7),
(2,'ACT02','Hội thảo AI trong giáo dục','2026-09-10 08:00:00','2026-09-10 11:30:00',100,'Ứng dụng AI trong học tập',5,1,8),
(3,'ACT03','Ngày hội việc làm','2026-09-20 08:00:00','2026-09-20 16:30:00',200,'Kết nối doanh nghiệp',10,1,9),
(4,'ACT04','Hiến máu nhân đạo','2026-10-05 07:30:00','2026-10-05 11:30:00',150,'Hiến máu tình nguyện',15,1,10),
(5,'ACT05','Cuộc thi lập trình','2026-10-15 08:00:00','2026-10-15 17:00:00',80,'Thi phát triển phần mềm',25,1,11),
(6,'ACT06','Seminar kỹ năng mềm','2026-10-20 13:30:00','2026-10-20 16:30:00',120,'Kỹ năng giao tiếp',5,1,12),
(7,'ACT07','Ngày hội văn hóa','2026-11-01 08:00:00','2026-11-01 16:00:00',300,'Giao lưu văn hóa',10,1,13),
(8,'ACT08','Tập huấn an toàn thông tin','2026-11-10 08:00:00','2026-11-10 11:00:00',100,'An toàn thông tin',5,1,14),
(9,'ACT09','Giải chạy sinh viên','2026-11-20 05:30:00','2026-11-20 09:30:00',500,'Rèn luyện thể chất',10,1,15),
(10,'ACT10','Tọa đàm nghề nghiệp','2026-12-01 08:00:00','2026-12-01 11:30:00',180,'Định hướng nghề nghiệp',5,1,16);

INSERT INTO Activity_Registration VALUES
(1,'2026-06-15 08:30:00',1,1,1),(2,'2026-06-16 09:15:00',1,2,2),
(3,'2026-08-20 14:00:00',1,3,3),(4,'2026-09-01 10:00:00',1,4,4),
(5,'2026-09-02 10:30:00',1,5,5),(6,'2026-09-05 11:00:00',1,6,6),
(7,'2026-09-06 13:15:00',1,7,7),(8,'2026-09-07 14:20:00',1,8,8),
(9,'2026-09-08 15:10:00',1,9,9),(10,'2026-09-09 16:00:00',1,10,10);

INSERT INTO Evidence (ID,Data,SubmitAt,Status,IdAcRegis) VALUES
(1,'https://storage.university.edu.vn/evidence/sv001_act01.jpg','2026-07-16 08:30:00',1,1),
(2,'https://storage.university.edu.vn/evidence/sv002_act02.pdf','2026-09-10 12:00:00',1,2),
(3,'https://storage.university.edu.vn/evidence/sv003_act03.png','2026-09-21 09:00:00',1,3),
(4,'https://storage.university.edu.vn/evidence/sv004_act04.jpg','2026-10-06 08:15:00',1,4),
(5,'https://storage.university.edu.vn/evidence/sv005_act05.pdf','2026-10-16 09:20:00',1,5),
(6,'https://storage.university.edu.vn/evidence/sv006_act06.jpg','2026-10-21 08:45:00',0,6),
(7,'https://storage.university.edu.vn/evidence/sv007_act07.png','2026-11-02 10:30:00',0,7),
(8,'https://storage.university.edu.vn/evidence/sv008_act08.pdf','2026-11-11 11:00:00',0,8),
(9,'https://storage.university.edu.vn/evidence/sv009_act09.jpg','2026-11-21 08:00:00',0,9),
(10,'https://storage.university.edu.vn/evidence/sv010_act10.pdf','2026-12-02 09:00:00',0,10);

INSERT INTO Address VALUES
(1,'280','An Dương Vương','Phường 4','Quận 5','TP. Hồ Chí Minh',1),
(2,'135','Nam Kỳ Khởi Nghĩa','Phường Bến Thành','Quận 1','TP. Hồ Chí Minh',1),
(3,'01','Nguyễn Tất Thành','Phường 8','Tuy Hòa','Phú Yên',1),
(4,'268','Lý Thường Kiệt','Phường 14','Quận 10','TP. Hồ Chí Minh',1),
(5,'12','Trần Phú','Phường Hải Châu','Hải Châu','Đà Nẵng',1),
(6,'45','Nguyễn Huệ','Phường Bến Nghé','Quận 1','TP. Hồ Chí Minh',1),
(7,'78','Điện Biên Phủ','Phường 17','Bình Thạnh','TP. Hồ Chí Minh',1),
(8,'100','Hoàng Diệu','Phường Minh An','Hội An','Quảng Nam',1),
(9,'56','Lê Duẩn','Phường Thạch Thang','Hải Châu','Đà Nẵng',1),
(10,'22','Nguyễn Văn Linh','Phường Tân Phong','Quận 7','TP. Hồ Chí Minh',1);

INSERT INTO Address_Detail VALUES
(1,'Tòa nhà B','Hội trường B.601',1),(2,'Khu A','Sân trung tâm',2),(3,'Tòa nhà C','Phòng C.201',3),
(4,'Tòa nhà D','Phòng D.302',4),(5,'Nhà đa năng','Sảnh chính',5),(6,'Tòa nhà E','Hội trường E.101',6),
(7,'Tòa nhà F','Phòng F.305',7),(8,'Khu thể thao','Sân bóng số 1',8),(9,'Tòa nhà G','Phòng G.202',9),
(10,'Tòa nhà H','Hội trường H.501',10);

INSERT INTO Address_Activity VALUES
(1,2),(2,1),(3,3),(4,4),(5,5),(6,6),(7,7),(8,8),(9,9),(10,10);

INSERT INTO Permission VALUES
(1,'Quản trị hệ thống'),(2,'Quản lý hoạt động'),(3,'Tham gia hoạt động'),(4,'Nộp minh chứng'),
(5,'Duyệt minh chứng'),(6,'Quản lý người dùng'),(7,'Quản lý sinh viên'),(8,'Quản lý giảng viên'),
(9,'Xem báo cáo'),(10,'Quản lý quyền');

INSERT INTO Permission_Detail VALUES
(1,'Xem bảng tin / Tin tức hệ thống','DASHBOARD_NEWS',TRUE,1),
(2,'Xem tổng quan số lượng hoạt động, tỷ lệ tham gia','DASHBOARD_OVERVIEW',TRUE,9),
(3,'Xem cảnh báo điểm rèn luyện','DASHBOARD_SCORE_ALERT',TRUE,9),
(4,'Xem danh sách hoạt động (đang / sắp diễn ra)','ACTIVITY_LIST',TRUE,2),
(5,'Thêm, Xóa, Sửa thông tin hoạt động','ACTIVITY_MANAGE',TRUE,2),
(6,'Đăng ký tham gia hoạt động','ACTIVITY_REGISTER',TRUE,3),
(7,'Xem danh sách sinh viên tham gia hoạt động','ACTIVITY_PARTICIPANTS',TRUE,2),
(8,'Xuất danh sách hoạt động mới nhất','ACTIVITY_EXPORT',TRUE,2),
(9,'Xem / Lọc danh sách người dùng','USER_LIST',TRUE,6),
(10,'Thêm, Xóa, Sửa thông tin Khoa, Lớp','FACULTY_CLASS_MANAGE',TRUE,7),
(11,'Thêm, Xóa, Sửa người dùng','USER_MANAGE',TRUE,6),
(12,'Phân quyền hệ thống / Gán Role','ROLE_ASSIGN',TRUE,10),
(13,'Nộp minh chứng','EVIDENCE_SUBMIT',TRUE,4),
(14,'Xem thông tin minh chứng','EVIDENCE_VIEW',TRUE,5),
(15,'Duyệt / Từ chối minh chứng','EVIDENCE_REVIEW',TRUE,5),
(16,'Xem / Xuất báo cáo số lượng, tỷ lệ tham gia','REPORT_PARTICIPATION',TRUE,9),
(17,'Xuất danh sách đánh dấu hoạt động của một sinh viên','REPORT_STUDENT_ACTIVITY',TRUE,9),
(18,'Xem và cập nhật hồ sơ cá nhân','PROFILE_MANAGE',TRUE,1);

INSERT INTO User_Permission (IdUser, IdPermission, Licensed)
SELECT u.ID, role_permissions.permission_id, TRUE
FROM "User" u
JOIN (VALUES
    (1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
    (1, 6), (1, 7), (1, 8), (1, 9), (1, 10),
    (2, 2), (2, 5), (2, 6), (2, 7), (2, 8), (2, 9),
    (3, 2), (3, 7), (3, 9),
    (4, 2), (4, 3), (4, 4)
) AS role_permissions(role_id, permission_id) ON role_permissions.role_id = u.IdRole;