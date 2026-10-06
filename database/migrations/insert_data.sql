-- insert_data_10_rows.sql
-- User có 20 dòng để tách 10 giảng viên + 10 sinh viên.
-- Các bảng còn lại có ít nhất 10 dòng.

INSERT INTO Role VALUES
(1,'Quản trị viên',1),(2,'Giảng viên',1),(3,'Sinh viên',1),(4,'Cán bộ khoa',1),(5,'Cán bộ lớp',1),
(6,'Cố vấn học tập',1),(7,'Quản lý hoạt động',1),(8,'Kiểm duyệt minh chứng',1),(9,'Trợ lý đào tạo',1),(10,'Khách',1);

INSERT INTO "User" VALUES
(1,'Nguyễn','Văn A','Nam','1980-01-15','TP. Hồ Chí Minh','0901000001','gv01@university.edu.vn','2a12$01',1,2),
(2,'Trần Thị','Bình','Nữ','1982-02-20','Hà Nội','0901000002','gv02@university.edu.vn','2a12$02',1,2),
(3,'Lê Văn','Cường','Nam','1984-03-10','Bình Dương','0901000003','gv03@university.edu.vn','2a12$03',1,2),
(4,'Phạm Thị','Dung','Nữ','1985-04-12','Đồng Nai','0901000004','gv04@university.edu.vn','2a12$04',1,2),
(5,'Hoàng Văn','Em','Nam','1986-05-18','Cần Thơ','0901000005','gv05@university.edu.vn','2a12$05',1,2),
(6,'Nguyễn Thị','Hạnh','Nữ','1987-06-22','Đà Nẵng','0901000006','gv06@university.edu.vn','2a12$06',1,2),
(7,'Võ Văn','Khang','Nam','1983-07-08','Quảng Nam','0901000007','gv07@university.edu.vn','2a12$07',1,2),
(8,'Đỗ Thị','Lan','Nữ','1981-08-25','Gia Lai','0901000008','gv08@university.edu.vn','2a12$08',1,2),
(9,'Bùi Văn','Minh','Nam','1988-09-30','Nghệ An','0901000009','gv09@university.edu.vn','2a12$09',1,2),
(10,'Nguyễn Thị','Ngọc','Nữ','1989-10-11','Khánh Hòa','0901000010','gv10@university.edu.vn','2a12$10',1,2),
(11,'Nguyễn','Văn Nam','Nam','2003-01-10','TP. Hồ Chí Minh','0911000001','sv01@student.edu.vn','2a12$11',1,3),
(12,'Trần Thị','Oanh','Nữ','2003-02-12','Hà Nội','0911000002','sv02@student.edu.vn','2a12$12',1,3),
(13,'Lê Văn','Phúc','Nam','2003-03-14','Bình Dương','0911000003','sv03@student.edu.vn','2a12$13',1,3),
(14,'Phạm Thị','Quyên','Nữ','2003-04-16','Đồng Nai','0911000004','sv04@student.edu.vn','2a12$14',1,3),
(15,'Hoàng Văn','Sơn','Nam','2003-05-18','Cần Thơ','0911000005','sv05@student.edu.vn','2a12$15',1,3),
(16,'Nguyễn Thị','Trang','Nữ','2003-06-20','Đà Nẵng','0911000006','sv06@student.edu.vn','2a12$16',1,3),
(17,'Võ Văn','Tùng','Nam','2003-07-22','Quảng Nam','0911000007','sv07@student.edu.vn','2a12$17',1,3),
(18,'Đỗ Thị','Uyên','Nữ','2003-08-24','Gia Lai','0911000008','sv08@student.edu.vn','2a12$18',1,3),
(19,'Bùi Văn','Vinh','Nam','2003-09-26','Nghệ An','0911000009','sv09@student.edu.vn','2a12$19',1,3),
(20,'Nguyễn Thị','Yến','Nữ','2003-10-28','Khánh Hòa','0911000010','sv10@student.edu.vn','2a12$20',1,3);

INSERT INTO Faculty VALUES
(1,'CNTT','Công nghệ thông tin',1),(2,'KT','Kinh tế',1),(3,'NN','Ngoại ngữ',1),(4,'QTKD','Quản trị kinh doanh',1),
(5,'DL','Du lịch',1),(6,'KTCT','Kỹ thuật công trình',1),(7,'L','Luật',1),(8,'SP','Sư phạm',1),
(9,'TCNH','Tài chính - Ngân hàng',1),(10,'XH','Khoa học xã hội',1);

INSERT INTO Major VALUES
(1,'KTPM','Kỹ thuật phần mềm',1,1),(2,'HTTT','Hệ thống thông tin',1,1),(3,'TMĐT','Thương mại điện tử',1,2),
(4,'QTKD01','Quản trị kinh doanh',1,4),(5,'NNA','Ngôn ngữ Anh',1,3),(6,'DL01','Quản trị du lịch',1,5),
(7,'KTCT01','Kỹ thuật xây dựng',1,6),(8,'LKT','Luật kinh tế',1,7),(9,'TCNH01','Tài chính - Ngân hàng',1,9),
(10,'XH01','Công tác xã hội',1,10);

INSERT INTO Lecturer VALUES
(1,'GV001',1,1),(2,'GV002',2,2),(3,'GV003',3,3),(4,'GV004',4,4),(5,'GV005',5,5),
(6,'GV006',6,6),(7,'GV007',7,7),(8,'GV008',8,8),(9,'GV009',9,9),(10,'GV010',10,10);

INSERT INTO Class VALUES
(1,'KTPM01','Kỹ thuật phần mềm 01',1,1,1),(2,'HTTT01','Hệ thống thông tin 01',1,2,2),
(3,'TMĐT01','Thương mại điện tử 01',1,3,3),(4,'QTKD01','Quản trị kinh doanh 01',1,4,4),
(5,'NNA01','Ngôn ngữ Anh 01',1,5,5),(6,'DL01','Du lịch 01',1,6,6),
(7,'KTCT01','Kỹ thuật xây dựng 01',1,7,7),(8,'LKT01','Luật kinh tế 01',1,8,8),
(9,'TCNH01','Tài chính ngân hàng 01',1,9,9),(10,'XH01','Công tác xã hội 01',1,10,10);

INSERT INTO Student VALUES
(1,'SV001',1,11),(2,'SV002',2,12),(3,'SV003',3,13),(4,'SV004',4,14),(5,'SV005',5,15),
(6,'SV006',6,16),(7,'SV007',7,17),(8,'SV008',8,18),(9,'SV009',9,19),(10,'SV010',10,20);

INSERT INTO School_Year VALUES
(1,'2025-2026',1),(2,'2025-2026',2),(3,'2025-2026',3),(4,'2026-2027',1),(5,'2026-2027',2),
(6,'2026-2027',3),(7,'2027-2028',1),(8,'2027-2028',2),(9,'2027-2028',3),(10,'2028-2029',1);

INSERT INTO Class_Year VALUES
(1,1,1),(2,1,1),(3,2,1),(4,2,1),(5,3,1),(6,3,1),(7,4,1),(8,4,1),(9,5,1),(10,5,1);

INSERT INTO TrainingPoint VALUES
(1,80,85,85,85,1,1,1),(2,90,90,92,91,1,2,1),(3,75,78,78,78,1,3,2),
(4,88,86,87,87,1,4,2),(5,92,90,91,91,1,5,3),(6,70,75,73,73,1,6,3),
(7,84,82,83,83,1,7,4),(8,95,94,93,94,1,8,4),(9,79,80,81,80,1,9,5),(10,87,89,88,88,1,10,5);

INSERT INTO Post VALUES
(1,'Trưởng khoa',1),(2,'Phó khoa',1),(3,'Lớp trưởng',1),(4,'Bí thư Chi đoàn',1),(5,'Phó lớp trưởng',1),
(6,'Cố vấn học tập',1),(7,'Trưởng bộ môn',1),(8,'Thư ký khoa',1),(9,'Cán bộ đoàn',1),(10,'Cán bộ lớp',1);

INSERT INTO User_Post VALUES
(1,1),(2,2),(3,3),(4,4),(5,5),(6,6),(7,7),(8,8),(9,9),(10,10);

INSERT INTO Activity VALUES
(1,'ACT01','Chiến dịch Mùa hè xanh','2026-07-01 07:00:00','2026-07-15 17:00:00',50,'Hỗ trợ cộng đồng',20,1,1),
(2,'ACT02','Hội thảo AI trong giáo dục','2026-09-10 08:00:00','2026-09-10 11:30:00',100,'Ứng dụng AI trong học tập',5,1,2),
(3,'ACT03','Ngày hội việc làm','2026-09-20 08:00:00','2026-09-20 16:30:00',200,'Kết nối doanh nghiệp',10,1,3),
(4,'ACT04','Hiến máu nhân đạo','2026-10-05 07:30:00','2026-10-05 11:30:00',150,'Hiến máu tình nguyện',15,1,4),
(5,'ACT05','Cuộc thi lập trình','2026-10-15 08:00:00','2026-10-15 17:00:00',80,'Thi phát triển phần mềm',25,1,5),
(6,'ACT06','Seminar kỹ năng mềm','2026-10-20 13:30:00','2026-10-20 16:30:00',120,'Kỹ năng giao tiếp',5,1,6),
(7,'ACT07','Ngày hội văn hóa','2026-11-01 08:00:00','2026-11-01 16:00:00',300,'Giao lưu văn hóa',10,1,7),
(8,'ACT08','Tập huấn an toàn thông tin','2026-11-10 08:00:00','2026-11-10 11:00:00',100,'An toàn thông tin',5,1,8),
(9,'ACT09','Giải chạy sinh viên','2026-11-20 05:30:00','2026-11-20 09:30:00',500,'Rèn luyện thể chất',10,1,9),
(10,'ACT10','Tọa đàm nghề nghiệp','2026-12-01 08:00:00','2026-12-01 11:30:00',180,'Định hướng nghề nghiệp',5,1,10);

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
(1,'Tạo hoạt động','ACT_CREATE',TRUE,2),(2,'Duyệt minh chứng','EVI_APPROVE',TRUE,5),
(3,'Đăng ký hoạt động','ACT_REGISTER',TRUE,3),(4,'Nộp minh chứng','EVI_SUBMIT',TRUE,4),
(5,'Quản lý người dùng','USER_MANAGE',TRUE,6),(6,'Quản lý sinh viên','STUDENT_MANAGE',TRUE,7),
(7,'Quản lý giảng viên','LECTURER_MANAGE',TRUE,8),(8,'Xem báo cáo','REPORT_VIEW',TRUE,9),
(9,'Quản lý quyền','PERMISSION_MANAGE',TRUE,10),(10,'Xem hoạt động','ACT_VIEW',TRUE,2);

INSERT INTO User_Permission VALUES
(1,1,TRUE),(2,2,TRUE),(3,2,TRUE),(4,5,TRUE),(5,5,TRUE),
(6,2,TRUE),(7,8,TRUE),(8,9,TRUE),(9,6,TRUE),(10,10,TRUE);