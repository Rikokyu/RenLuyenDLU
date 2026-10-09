# Đồ án chuyên ngành

## Thông tin sinh viên

| MSSV    | Thông tin sinh viên | Mail sinh viên     | Github sinh viên               |
| ------- | ------------------- | ------------------ | ------------------------------ |
| 2312610 | Nguyễn Trung Hiệp   | 2312610@dlu.edu.vn | https://github.com/Rikokyu     |
| 2300003 | Nguyễn Lê Anh Tuấn  | 2300003@dlu.edu.vn | https://github.com/anhtuan1101 |
| 2312565 | Nguyễn Văn An       | 2312565@dlu.edu.vn | https://github.com/nvanan124   |

## Phân công công việc

| MSSV    | Tên công việc                                                        | Ghi chú                      |
| ------- | -------------------------------------------------------------------- | ---------------------------- |
| 2312610 | Sidebar/Topbar/Trang phân quyền/Tạo tài khoản phía Admin/Trang login | Cả frontend/backend/database |
| 2300003 | Trang con minh chứng/Báo cáo thống kê/                               | Cả frontend/backend/database |
| 2312565 | Trang con Dashboard/Danh sách hoạt động/Hồ sơ lịch sử                | Cả frontend/backend/database |

Xem thông tin chi tiết tại đường link:
https://docs.google.com/document/d/1NztEl2wy_uD41xZYXd2gtm72u1FuYhcM8eno9RuG9Rc/edit?usp=sharing

# Rèn Luyện DLU

Website quản lý và theo dõi hoạt động rèn luyện sinh viên Trường Đại học Đà Lạt, được xây dựng trong khuôn khổ Đồ án chuyên ngành – Ngành Công nghệ thông tin, chuyên ngành Kỹ thuật phần mềm.

## 🎯 Mục tiêu

Hệ thống hỗ trợ sinh viên theo dõi quá trình rèn luyện, quản lý hoạt động, minh chứng và kết quả rèn luyện trên một nền tảng tập trung.

## 🛠️ Công nghệ

Frontend: React.js + Vite
Backend: Go
Database: PostgreSQL
Version Control: Git / GitHub

## Nguồn dữ liệu quản lý

Giao diện gọi API backend; backend truy vấn PostgreSQL. Danh sách người dùng trong mục Quản lý đọc toàn bộ bản ghi từ `"User"` và `role`; MSSV, lớp, khoa và thông tin giảng viên được nối từ `student`, `class`, `major`, `faculty`, `lecturer`. Đây là cùng schema cũ được dùng bởi chức năng Minh chứng, không đọc bảng `users` hay dữ liệu seed tài khoản quản lý.

Thông tin tài khoản, vai trò và mật khẩu trong mục người dùng cũng được đọc/ghi vào `"User"` và `role`. Xóa/khóa người dùng sẽ đặt trạng thái không hoạt động thay vì xóa vật lý, để giữ nguyên lịch sử và các quan hệ liên quan. Mục quản lý sinh viên/lớp dùng các bảng `student`, `class`, `major`, `faculty` cùng schema đó.

Mười tài khoản trợ lý mẫu được gán lần lượt cho mười khoa bởi `database/migrations/zzz_assistant_faculty_assignments.sql`: `hieunt`–CT, `phattv`–KT, `chault`–AV, `baopq`–QT, `maivt`–DL, `annv`–KC, `hanhtt`–LU, `quanglm`–SP, `longdh`–TC và `tungbt`–XH. Với database đã khởi tạo trước đó, chạy migration này một lần để cập nhật trường `responsiblefaculty`.

Seed `database/migrations/insert_data.sql` tạo tài khoản mẫu; mật khẩu khởi tạo là `DLU@2026` và được băm trong PostgreSQL. Sinh viên đăng nhập bằng MSSV; giảng viên và trợ lý công tác sinh viên dùng tên tài khoản được cấp (phần trước `@dlu.edu.vn`). Người dùng có thể đổi mật khẩu sau khi đăng nhập.

Khi backend khởi động, migration xác thực sẽ tự thêm cột còn thiếu và đặt mật khẩu mặc định `DLU@2026` cho các tài khoản chưa đổi mật khẩu (chạy một lần, có đánh dấu trong database). Không chạy thủ công `database/migrations/zz_authentication.sql` sau khi người dùng đã đổi mật khẩu vì script này đặt lại mật khẩu tất cả tài khoản. Các file SQL khởi tạo chỉ tự chạy khi PostgreSQL được khởi tạo lần đầu. Volume Docker đã tồn tại không tự nạp lại seed khi pull code mới.

### Đăng nhập và kiểm thử API

- Sao chép `.env.example` thành `.env` và đặt `JWT_SECRET` thành một chuỗi ngẫu nhiên dài tối thiểu 32 ký tự.
- Khởi động lại backend với `docker compose up --build -d backend` để áp dụng cấu hình kết nối nội bộ `postgres:5432` và migration database.
- Để bật Google Sign-In, cấu hình Google OAuth Web Client ID ở cả `.env` (`GOOGLE_CLIENT_ID`) và `frontend/.env` (`VITE_GOOGLE_CLIENT_ID`). Backend chỉ chấp nhận ID token đã xác minh, đúng Client ID và email `@dlu.edu.vn` có trong hệ thống.
- Mở `http://localhost:8080/swagger` để dùng Swagger UI; tài liệu OpenAPI JSON ở `/swagger/openapi.json`. Tài liệu bao gồm các API hồ sơ, quản lý tài khoản/sinh viên/lớp và đọc/cập nhật minh chứng, ngoài API xác thực. Swagger không dùng chung phiên đăng nhập của giao diện web: gọi `/api/v1/auth/login`, sao chép trường `token` trong phản hồi, rồi dán token vào nút **Authorize** để thử endpoint yêu cầu JWT.
- Không có API đăng ký công khai. Tạo tài khoản vẫn được giới hạn trong mục quản lý người dùng có phân quyền.

## 📌 Chức năng chính

🔐 Đăng nhập và xác thực người dùng
📊 Dashboard điều hành
📋 Quản lý danh sách hoạt động
📄 Quản lý minh chứng sinh viên
📈 Báo cáo và thống kê
👤 Hồ sơ và lịch sử rèn luyện

## 📁 Cấu trúc dự án

DoAnChuyenNganh_WebsiteRenLuyenDLU/
├── frontend/ # Giao diện React.js
├── backend/ # API và xử lý nghiệp vụ Go
├── database/ # PostgreSQL, SQL scripts
└── docs/ # Tài liệu đồ án

## 👨‍💻 Mục đích

Dự án được thực hiện nhằm áp dụng kiến thức về kỹ thuật phần mềm, phát triển web, thiết kế giao diện, quản lý cơ sở dữ liệu và xây dựng hệ thống phần mềm vào một sản phẩm thực tế.
