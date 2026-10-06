# Quản lý Manager theo schema nhóm

Backend Manager đọc và ghi theo schema trong `create_table.sql`: tài khoản ở `"User"`/`Role`, sinh viên ở `Student` và liên kết bằng `Student.IdUser`, giảng viên ở `Lecturer` và liên kết bằng `Lecturer.IdUser`, lớp ở `Class`/`Major`/`Faculty`. Tài khoản sinh viên trong danh sách được truy vấn từ chính liên kết `Student`–`User`; không dùng bộ bảng lowercase `users`/`roles`.

## Khởi tạo database mới

Trên database mới, chạy lần lượt:

1. [`create_table.sql`](../database/migrations/create_table.sql)
2. [`insert_data.sql`](../database/migrations/insert_data.sql)

`insert_data.sql` chứa dữ liệu nền và tài khoản mẫu; tài khoản sinh viên/cán bộ lớp và cố vấn được liên kết bằng các khóa `IdUser` tương ứng. Email tài khoản sinh viên theo `Student_Code@dlu.edu.vn`, trợ lý theo `ctsvNN@dlu.edu.vn` và giảng viên theo `gvNN@dlu.edu.vn`; mật khẩu seed lưu dạng hash.

**Không chạy `create_table.sql` trên database đang có dữ liệu:** script có `DROP TABLE`. `insert_data.sql` cũng dành cho khởi tạo mới, không phải migration chạy lặp trên dữ liệu đang dùng.

## Kiểm tra dữ liệu

Trong pgAdmin, chọn database, mở **Tools → Query Tool** và chạy:

```sql
SELECT r.id, r.name, COUNT(u.id) AS account_count
FROM role r
LEFT JOIN "User" u ON u.idrole = r.id
GROUP BY r.id, r.name
ORDER BY r.id;

SELECT u.id, CONCAT_WS(' ', u.firstname, u.lastname) AS name,
	   u.email, r.name AS role, s.student_code
FROM "User" u
LEFT JOIN role r ON r.id = u.idrole
LEFT JOIN student s ON s.iduser = u.id
ORDER BY u.id;
```

## Chạy backend

Đặt `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` và `DB_SSLMODE` trong `backend/.env` để trỏ tới đúng database đã khởi tạo, sau đó chạy `go run ./cmd/server` từ thư mục `backend`. Không commit file `.env` chứa mật khẩu.

Các endpoint Manager đọc danh sách từ schema canonical và CRUD cập nhật trực tiếp các bảng này. Bảng role ánh xạ theo `Role.ID` trong `create_table.sql`.
