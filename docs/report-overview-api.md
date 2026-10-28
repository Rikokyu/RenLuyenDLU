# API tổng quan báo cáo quản lý

`GET /api/v1/reports/overview` — JWT Bearer bắt buộc.

- `ADMIN`: toàn trường.
- `STUDENT_AFFAIRS_ASSISTANT`: sinh viên thuộc khoa được phân công; hoạt động theo cùng phạm vi dashboard hiện có (do trợ lý tổ chức, do giảng viên khoa tổ chức hoặc có sinh viên khoa đăng ký còn hiệu lực).
- Vai trò khác: HTTP 403. Không cho client tự chọn khoa hoặc user để vượt phạm vi.

## Khoảng thống kê

Không truyền tham số: học kỳ hiện tại theo giờ Việt Nam, tháng 8–1 hoặc tháng 2–7; so sánh với học kỳ liền trước. Đây là quy ước lịch vì bảng `school_year` chưa có ngày bắt đầu/kết thúc học kỳ.

Truyền **cả** `from_date` và `to_date` dạng `YYYY-MM-DD`, tối đa 366 ngày. Ngày cuối được tính trọn ngày. Kỳ trước là khoảng liền trước có cùng số ngày. Ví dụ `?from_date=2026-08-01&to_date=2026-08-31` so sánh với 01–31/07/2026.

Hoạt động được xếp kỳ theo `activity.timeend`, phải đã kết thúc tại thời điểm gọi API và `status <> 0`. Vì vậy kỳ hiện tại chưa kết thúc có thể thấp hơn toàn bộ kỳ trước. Thống kê lịch sử dùng trạng thái đăng ký/minh chứng **hiện tại**, không phải bản chụp tại ngày kết thúc kỳ.

## Công thức được sử dụng

Theo lựa chọn của người dùng: quy đổi từ minh chứng đã duyệt và thời lượng hoạt động, không thêm schema hay tự tạo dữ liệu check-in.

1. Một lượt là một cặp sinh viên–hoạt động. Nếu dữ liệu có nhiều đăng ký còn hiệu lực (`status = 1`) cho cùng cặp, lấy đăng ký mới nhất theo `registeredat DESC, id DESC`.
2. Minh chứng mới nhất theo `evidence.id DESC` của đăng ký được chọn phải có `status = 1`. Minh chứng cũ đã duyệt nhưng minh chứng mới bị từ chối/chờ duyệt không được tính.
3. **Sinh viên tham gia**: số sinh viên khác nhau có ít nhất một lượt được xác nhận. Tỷ lệ = số này / tổng sinh viên trong phạm vi × 100. Tổng sinh viên lấy từ `student` hiện tại, không có số lượng sinh viên lịch sử từng kỳ.
4. **Sự kiện đã tổ chức**: số hoạt động đã kết thúc trong phạm vi, kể cả không có đăng ký. Cấp Trường: người tạo có `idrole = 1`; cấp Khoa: người tạo có `idrole = 2` hoặc có hồ sơ giảng viên thuộc khoa; còn lại chưa phân loại. Đây là quy ước suy ra từ người tạo vì chưa có trường cấp tổ chức chính thức.
5. **Tỷ lệ check-in quy đổi** = số lượt được xác nhận / số lượt đăng ký còn hiệu lực của các hoạt động đã kết thúc × 100. Không phải số liệu quét mã/check-in trực tiếp.
6. **Giờ tình nguyện quy đổi** = tổng `(timeend - timebegin)` tính bằng giờ, cho từng lượt được xác nhận. Cộng toàn bộ thời lượng, kể cả hoạt động nhiều ngày. Schema chưa phân loại hoạt động tình nguyện hay lưu giờ CTXH được công nhận nên đây là giờ quy đổi từ tất cả hoạt động, chưa phải giờ CTXH chính thức.
7. Thay đổi số sinh viên/giờ = `(hiện tại - trước) / trước × 100`; sự kiện = chênh lệch số lượng; tỷ lệ check-in = chênh lệch **điểm phần trăm**. Mẫu số bằng 0 trả `null`, không trả tăng 100% hoặc NaN. Tỷ lệ làm tròn 1 chữ số; giờ 2 chữ số.

## Dữ liệu trả về

Envelope: `{ "status": "success", "data": { ... } }`.

- `scopeName`: tên khoa hoặc `Toàn trường`.
- `period`, `previousPeriod`: `{fromDate, toDate}`.
- `current`, `previous`: `totalStudents`, `participatingStudents`, `participationRate`, `organizedEvents`, `schoolEvents`, `facultyEvents`, `unclassifiedEvents`, `registrations`, `confirmedParticipations`, `checkInRate`, `volunteerHours`.
- `changes`: `participatingStudentsPercent`, `organizedEvents`, `checkInPercentagePoints`, `volunteerHoursPercent`.
- `attendanceBasis`: `latest_approved_evidence`.
- `hoursBasis`: `activity_duration_per_confirmed_student`.

HTTP 400 khi ngày không hợp lệ; 401 chưa đăng nhập; 403 sai vai trò; 500 khi lỗi database hoặc chưa xác định được khoa phân công. Chi tiết lỗi database chỉ được ghi vào log server.

## Frontend và phạm vi thay đổi

`ReportOverview.jsx` gọi API, có bộ lọc ngày, nút học kỳ hiện tại, trạng thái đang tải/lỗi/thử lại, số liệu rỗng và chênh lệch tăng/giảm. Hủy request khi đổi bộ lọc hoặc rời trang. Bộ lọc ngày đồng thời điều khiển khoảng hoạt động tầng 2; phần này dùng API riêng được mô tả tại [report-analytics-api.md](report-analytics-api.md). Bảng chi tiết tầng 3 dùng API riêng, xem [report-details-api.md](report-details-api.md). Các nút xuất báo cáo chưa triển khai.

Không thay đổi migration, seed, API hoạt động hay API minh chứng. Các thay đổi giao diện sẵn có trong `Reports.jsx` và `Reports.css` được giữ; chỉ thay khối KPI mẫu bằng component mới và bỏ nhãn học kỳ cố định.

## Kiểm thử

```powershell
cd backend
go test ./...
# Chỉ dùng DSN database thử nghiệm hoặc local được cho phép:
$env:TEST_DATABASE_URL = 'host=localhost port=5433 user=postgres password=postgres dbname=renluyen_dlu sslmode=disable'
go test ./internal/repository -run TestReportOverviewPostgres -v -count=1
```

Kiểm thử PostgreSQL chạy truy vấn trên schema thật, sau đó dùng bảng TEMP trong transaction cho dữ liệu biên; tất cả được rollback, không sửa dữ liệu sinh viên đang có. Kiểm tra minh chứng trùng, đăng ký trùng/hủy, minh chứng mới bị từ chối, hoạt động hủy/tương lai, ngày cuối kỳ, phân quyền khoa, kỳ trước, dữ liệu rỗng.

Frontend: chạy `npm.cmd run build` trong `frontend` (máy hiện tại có lỗi launcher `npm` của PowerShell).
