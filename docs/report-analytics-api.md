# API phân tích tầng 2 báo cáo quản lý

`GET /api/v1/reports/analytics` — Bearer JWT. Chỉ `ADMIN` (toàn trường) và `STUDENT_AFFAIRS_ASSISTANT` (khoa được phân công). Phạm vi sinh viên và hoạt động dùng chung với dashboard/tổng quan báo cáo; client không được mở rộng phạm vi qua user/khoa truyền lên.

## Tham số

| Tham số | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `from_date`, `to_date` | Học kỳ hiện tại tháng 8–1 hoặc 2–7 | Truyền cả hai ngày `YYYY-MM-DD`, tối đa 366 ngày, bao gồm hết ngày cuối. Chọn hoạt động theo ngày kết thúc, chỉ hoạt động đã kết thúc tại lúc truy vấn. |
| `school_year_id` | Học kỳ tương ứng ngày bắt đầu khoảng hoạt động | ID trong `school_year`, chỉ ảnh hưởng phân loại điểm. Danh sách học kỳ trả trong `semesters`. Không tồn tại: 400. Tự chọn không có học kỳ tương ứng: `scores.semester=null`, không suy đoán điểm từ kỳ khác. |
| `page` | 1 | Trang danh sách sự kiện; 1–1.000.000. |
| `page_size` | 5 | 1–100; `eventTotal` đếm tất cả sự kiện trong phạm vi, không chỉ trang hiện tại. |
| `sort` | `attended` | `attended`: lượt xác nhận giảm dần; `registered`: đăng ký giảm dần; `no_show`: tỷ lệ no-show giảm dần. Sự kiện không có đăng ký đặt cuối khi xếp no-show. ID làm tiêu chí cuối để thứ tự ổn định. |
| `top_limit` | 5 | 1–50 sinh viên. Không chịu ảnh hưởng phân trang/sắp xếp sự kiện. |

Ví dụ: `/api/v1/reports/analytics?from_date=2026-08-01&to_date=2027-01-31&school_year_id=4&sort=no_show&page=1&page_size=5&top_limit=5`.

Không có lịch ngày chính thức trong `school_year`: quy ước mặc định tháng 8–1 là HK1 của năm bắt đầu tháng 8, tháng 2–7 là HK2. HK3 vẫn chọn được **cho điểm**, nhưng không tự suy ra khoảng hoạt động. UI hiển thị rõ học kỳ điểm và khoảng ngày hoạt động độc lập.

## Phân loại điểm

- Lấy `trainingpoint.lastscore` của bản ghi có ID lớn nhất cho mỗi sinh viên và học kỳ được chọn; `status=1` là bản ghi được sử dụng, không tự diễn giải thành quy trình chốt điểm chưa có trong hệ thống.
- Phân loại theo các mốc của giao diện: Xuất sắc 90–100, Tốt 80–89, Khá 65–79, Trung bình 50–64, Yếu/Kém 0–49.
- Không có bản ghi, điểm null hoặc trạng thái khác 1: `ungradedStudents`. Điểm ngoài 0–100: `invalidScores`. Không tự biến điểm thiếu thành 0 và không lấy điểm cũ khi bản ghi mới nhất không còn hiệu lực.
- Mỗi sinh viên tính một lần. Tỷ lệ nhóm = số sinh viên nhóm / `gradedStudents` × 100; chưa có điểm hợp lệ trả tỷ lệ null.
- Tổng sinh viên là danh sách `student` hiện tại trong phạm vi khoa, không phải ảnh chụp sĩ số lịch sử. Không suy ra điểm rèn luyện từ tổng điểm hoạt động.

## Check-in quy đổi / no-show theo sự kiện

Chỉ `activity.status <> 0`, đã kết thúc trong khoảng ngày. Một lượt đăng ký = một cặp sinh viên–hoạt động, chọn đăng ký còn hiệu lực (`status=1`) mới nhất theo `registeredat DESC, id DESC`. Minh chứng mới nhất theo `id DESC` phải có `status=1` mới xác nhận tham gia. Tránh đếm nhiều lần do đăng ký hoặc minh chứng trùng.

- `registered`: tổng lượt hợp lệ.
- `attended`: lượt có minh chứng mới nhất được duyệt.
- `pending`: lượt có minh chứng mới nhất trạng thái 0 hoặc 3 (chờ duyệt/cần bổ sung).
- `noShow = registered - attended`.
- `checkInRate = attended / registered × 100`.
- `noShowRate = noShow / registered × 100`.

No-show là **ước tính**, bao gồm chưa nộp minh chứng, đang chờ xử lý và bị từ chối; không kết luận vắng mặt thực tế. Sự kiện 0 đăng ký vẫn có trong danh sách nhưng hai tỷ lệ trả null. Hiển thị cả số lượt và tỷ lệ để tránh đánh giá sự kiện 1/1 cao hơn sự kiện có hàng trăm người chỉ dựa vào tỷ lệ.

## Vinh danh sinh viên

Chỉ xếp sinh viên có ít nhất một lượt được xác nhận trong khoảng hoạt động. Sắp xếp: số hoạt động giảm dần → tổng giờ quy đổi giảm dần → ID sinh viên tăng dần. `rank` là vị trí thứ tự sau các tiêu chí này, không dùng thứ hạng đồng hạng. Giờ = toàn bộ thời lượng từng hoạt động được xác nhận, như API tổng quan. Không cộng từ đăng ký hủy hay minh chứng cũ đã duyệt nhưng minh chứng mới bị từ chối.

Trả ID, MSSV, tên, lớp, khoa, số sự kiện, giờ và thứ hạng. Các tên trùng không gộp sinh viên với nhau.

## Phản hồi

Envelope `{status:"success", data:{scopeName,period,semesters,scores,events,eventTotal,page,pageSize,topStudents,attendanceBasis}}`.

- `scores`: `{semester,totalStudents,gradedStudents,ungradedStudents,invalidScores,bands}`; mỗi band `{key,label,count,percentage}`.
- Mỗi sự kiện `{id,code,title,registered,attended,pending,noShow,checkInRate,noShowRate}`.
- Mỗi sinh viên `{id,studentCode,name,faculty,classCode,events,hours,rank}`.
- Các danh sách rỗng trả `[]`, tỷ lệ không xác định trả `null`, tỷ lệ làm tròn 1 chữ số và giờ 2 chữ số.
- 400: tham số sai; 401: chưa xác thực; 403: sai vai trò; 500: lỗi dữ liệu/phạm vi khoa. Không trả chi tiết kết nối database cho client.

Các truy vấn chạy trong transaction read-only, repeatable-read để cả ba phần dùng cùng một ảnh dữ liệu. Không cần migration/seed, không sửa API minh chứng hoặc hoạt động.

## Kiểm thử và giao diện

`go test ./...` kiểm tra handler, tham số, phân quyền và Swagger. Đặt `TEST_DATABASE_URL` để chạy `go test ./internal/repository -run 'TestReport(Analytics|Overview)Postgres' -v -count=1`. Kiểm thử PostgreSQL đọc schema thật rồi tạo bảng tạm trong transaction rollback; không thay dữ liệu thật. Bao phủ các biên điểm, điểm thiếu/sai, bản ghi trùng, học kỳ khác, sự kiện hủy/tương lai, đăng ký hủy, minh chứng mới bị từ chối, quyền khoa, thứ hạng, phân trang và mẫu số 0.

`ReportAnalytics.jsx` thay dữ liệu mẫu tầng 2. Bộ lọc ngày tầng 1 điều khiển khoảng hoạt động tầng 2 sau khi tải thành công. Học kỳ điểm chọn riêng, với nhãn rõ ràng. Có tải/lỗi/thử lại/dữ liệu rỗng và hủy yêu cầu cũ khi thay đổi bộ lọc. Bảng chi tiết tầng 3 đã có API riêng, xem [report-details-api.md](report-details-api.md).
