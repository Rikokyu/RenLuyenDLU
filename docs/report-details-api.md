# Danh sách chi tiết báo cáo

## Xuất và lưu Excel

Nút **Xuất Excel tất cả** tải toàn bộ danh sách thuộc quyền tài khoản khi chưa áp dụng bộ lọc. Sau khi bấm **Lọc dữ liệu**, nút **Xuất Excel đã lọc** xuất toàn bộ kết quả tương ứng, không chỉ trang hiện tại. Chỉnh combobox hoặc từ khóa nhưng chưa bấm Lọc không thay đổi dữ liệu xuất. Bấm **Đặt lại** để xuất toàn bộ. Các bộ lọc được chụp tại thời điểm bắt đầu xuất.

Frontend gọi `GET /api/v1/reports/details/export` với cùng `search`, `faculty_id`, `major_id`, `class_id`. Backend bỏ phân trang, giữ nguyên phân quyền, truy vấn read-only/repeatable-read; trả đầy đủ JSON từ một snapshot, không gom nhiều trang ở trình duyệt. Tối đa 50.000 dòng; vượt giới hạn trả HTTP 413 yêu cầu thu hẹp bộ lọc, không tự cắt dữ liệu. Phản hồi dùng `Cache-Control: no-store`.

ExcelJS tạo file `.xlsx` gồm sheet **Chi tiết minh chứng** đủ chín cột và sheet **Thông tin báo cáo** ghi phạm vi, thời điểm xuất, các bộ lọc và tổng số dòng. Mã sinh viên là chuỗi để giữ số 0 đầu; điểm là số (giữ 0); thời gian Excel là giờ Việt Nam và cột ghi UTC+7. Văn bản bắt đầu bằng dấu `=` được ghi dưới dạng chuỗi, không tạo công thức. Có cố định tiêu đề và bộ lọc Excel.

Tên file gồm `da-loc`/`tat-ca` và thời điểm xuất. Trình duyệt tải file về thư mục tải xuống hoặc hỏi vị trí tùy cài đặt. Danh sách rỗng vẫn xuất file có tiêu đề và thông tin tổng số 0. Nếu request lỗi hoặc dữ liệu thiếu, không tải file một phần. Hủy request khi rời trang.

Kiểm thử workbook: `node --test src/utils/reportExport.test.js` trong frontend, ghi/đọc lại XLSX để kiểm tra 25 dòng vượt một trang, mã sinh viên, điểm 0, giờ Việt Nam, văn bản giống công thức, dòng chưa nộp và kết quả rỗng. Kiểm thử PostgreSQL/handler kiểm tra export bỏ phân trang, giữ bộ lọc, phạm vi khoa và lỗi vượt giới hạn.

`GET /api/v1/reports/details` yêu cầu Bearer JWT. ADMIN xem toàn trường; trợ lý xem sinh viên và lựa chọn lớp trong khoa được phân công. Dùng phạm vi hiện có của dashboard; các tham số khoa/ngành/lớp chỉ thu hẹp phạm vi, không mở rộng quyền.

## Dữ liệu và bộ lọc

- `search`: tối đa 200 ký tự, tìm chuỗi con trong MSSV, họ tên, tên/mã hoạt động. `%`, `_` là ký tự thường, không phải wildcard.
- `faculty_id`, `major_id`, `class_id`: ID nguyên dương, áp dụng đồng thời.
- `page`: mặc định 1, tối đa 1.000.000; `page_size`: mặc định 10, tối đa 100.
- Danh sách toàn bộ thời gian, bộ lọc riêng với KPI/phân tích. Không tự áp dụng khoảng ngày hoạt động vào giờ nộp minh chứng.

Một dòng cho một cặp sinh viên–hoạt động: lấy đăng ký còn hiệu lực mới nhất (`registeredat DESC,id DESC`), rồi minh chứng mới nhất (`evidence.id DESC`). Loại hoạt động đã hủy (`status=0`), giữ cả đăng ký chưa nộp minh chứng. Không hiển thị đăng ký bị hủy. Sắp xếp giờ nộp giảm dần, chưa nộp cuối, ID đăng ký giảm dần để phân trang ổn định.

Chín cột lấy từ `student.student_code`, `User.firstname/lastname`, `class.class_code`, `major.name`, `faculty.name`, `activity.title`, `evidence.submitat`, `activity.score`, `evidence.status`. Thời gian timestamp của database được diễn giải theo giờ Việt Nam và trả ISO timestamp có múi giờ. Điểm 0 được giữ nguyên; điểm null hiển thị gạch ngang. Đây là điểm hoạt động, không phải điểm rèn luyện học kỳ.

Trạng thái minh chứng: 0 chờ duyệt, 1 đã duyệt, 2 từ chối, 3 cần bổ sung. `evidenceId=null` là chưa nộp. Minh chứng tồn tại nhưng thiếu ngày/trạng thái hiển thị chưa ghi nhận/chưa xác định, không tự coi là chưa nộp.

## Phản hồi

`{status:"success",data:{scopeName,items,classes,total,page,pageSize}}`

- `items`: `{id,studentId,studentName,className,major,faculty,eventName,submittedAt,activityScore,evidenceId,status}`. `id` là ID đăng ký, `studentId` là MSSV.
- `classes`: `{id,name,majorId,majorName,facultyId,facultyName}` cho các lớp thuộc phạm vi quản lý, gồm cả lớp chưa có sinh viên/minh chứng. Không phụ thuộc bộ lọc hoặc trang hiện tại. Frontend suy ra lựa chọn khoa/ngành từ quan hệ của các lớp này.
- Các danh sách rỗng trả `[]`; total vẫn đúng khi trang vượt số trang.

Frontend dùng `ReportDetails.jsx`. Chọn khoa đặt lại ngành/lớp; chọn ngành đặt lại lớp. Nút Lọc dữ liệu áp dụng bộ lọc và về trang 1; Đặt lại tải toàn bộ trong phạm vi. Có loading, lỗi/thử lại, dữ liệu rỗng và hủy request cũ. Nút Excel xuất toàn bộ danh sách của bộ lọc đã áp dụng; PDF chưa triển khai.

Truy vấn read-only, repeatable-read; không migration hoặc seed. Bộ kiểm thử `TestReportAnalyticsPostgres/report_details` dùng bảng tạm và rollback để kiểm tra lọc lớp/ngành/khoa, chống vượt phạm vi, tìm kiếm, bản ghi trùng, chưa nộp, múi giờ, điểm 0 và phân trang. `go test ./...` chạy thêm kiểm thử handler và Swagger. Đặt `TEST_DATABASE_URL` để chạy kiểm thử PostgreSQL.
