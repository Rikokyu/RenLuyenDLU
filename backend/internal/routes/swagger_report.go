package routes

const reportOpenAPIPaths = `
    "/reports/details/export": {
      "get": {
        "tags":["Báo cáo"],
        "summary":"Lấy toàn bộ danh sách đã lọc hoặc chưa lọc để tạo Excel",
        "description":"Cùng quyền và bộ lọc với /reports/details, bỏ phân trang. Trả JSON đầy đủ trong một snapshot database, frontend tạo file .xlsx bằng ExcelJS. Giới hạn 50.000 dòng; vượt giới hạn trả 413 và không cắt dữ liệu.",
        "security":[{"BearerAuth":[]}],
        "parameters":[
          {"name":"search","in":"query","schema":{"type":"string","maxLength":200}},
          {"name":"faculty_id","in":"query","schema":{"type":"integer","minimum":1}},
          {"name":"major_id","in":"query","schema":{"type":"integer","minimum":1}},
          {"name":"class_id","in":"query","schema":{"type":"integer","minimum":1}}
        ],
        "responses":{"200":{"description":"Toàn bộ items và thông tin phạm vi/bộ lọc"},"400":{"description":"Tham số sai"},"401":{"description":"Chưa đăng nhập"},"403":{"description":"Không có quyền"},"413":{"description":"Hơn 50.000 dòng, cần thu hẹp bộ lọc"},"500":{"description":"Không thể tải dữ liệu"}}
      }
    },
    "/reports/details": {
      "get": {
        "tags": ["Báo cáo"],
        "summary": "Danh sách chi tiết minh chứng và lựa chọn khoa/ngành/lớp từ database",
        "description": "ADMIN toàn trường, trợ lý giới hạn khoa. Một dòng cho mỗi cặp sinh viên-hoạt động: đăng ký còn hiệu lực mới nhất và minh chứng mới nhất; chưa nộp trả evidenceId/status/submittedAt=null. Chỉ hoạt động chưa hủy. Không giới hạn ngày. Các bộ lọc áp dụng đồng thời; danh sách lớp không bị giới hạn theo trang hiện tại.",
        "security": [{"BearerAuth": []}],
        "parameters": [
          {"name":"search","in":"query","schema":{"type":"string","maxLength":200}},
          {"name":"faculty_id","in":"query","schema":{"type":"integer","format":"int64","minimum":1}},
          {"name":"major_id","in":"query","schema":{"type":"integer","format":"int64","minimum":1}},
          {"name":"class_id","in":"query","schema":{"type":"integer","format":"int64","minimum":1}},
          {"name":"page","in":"query","schema":{"type":"integer","minimum":1,"maximum":1000000,"default":1}},
          {"name":"page_size","in":"query","schema":{"type":"integer","minimum":1,"maximum":100,"default":10}}
        ],
        "responses": {
          "200":{"description":"status=success; data gồm scopeName, items, classes, total, page, pageSize. Các trường items: id (đăng ký), studentId (MSSV), studentName, className, major, faculty, eventName, submittedAt, activityScore, evidenceId, status. classes: id,name,majorId,majorName,facultyId,facultyName."},
          "400":{"description":"Tham số không hợp lệ"},"401":{"description":"Chưa đăng nhập"},"403":{"description":"Không có quyền báo cáo quản lý"},"500":{"description":"Không thể tải dữ liệu"}
        }
      }
    },
    "/reports/details": {
      "get": {
        "tags": ["Báo cáo"],
        "summary": "Danh sách chi tiết minh chứng và lựa chọn khoa/ngành/lớp từ database",
        "description": "ADMIN toàn trường, trợ lý giới hạn khoa. Một dòng cho mỗi cặp sinh viên-hoạt động: đăng ký còn hiệu lực mới nhất và minh chứng mới nhất; chưa nộp trả evidenceId/status/submittedAt=null. Chỉ hoạt động chưa hủy. Không giới hạn ngày. Các bộ lọc áp dụng đồng thời; danh sách lớp không bị giới hạn theo trang hiện tại.",
        "security": [{"BearerAuth": []}],
        "parameters": [
          {"name":"search","in":"query","schema":{"type":"string","maxLength":200}},
          {"name":"faculty_id","in":"query","schema":{"type":"integer","format":"int64","minimum":1}},
          {"name":"major_id","in":"query","schema":{"type":"integer","format":"int64","minimum":1}},
          {"name":"class_id","in":"query","schema":{"type":"integer","format":"int64","minimum":1}},
          {"name":"page","in":"query","schema":{"type":"integer","minimum":1,"maximum":1000000,"default":1}},
          {"name":"page_size","in":"query","schema":{"type":"integer","minimum":1,"maximum":100,"default":10}}
        ],
        "responses": {
          "200":{"description":"status=success; data gồm scopeName, items, classes, total, page, pageSize. Các trường items: id (đăng ký), studentId (MSSV), studentName, className, major, faculty, eventName, submittedAt, activityScore, evidenceId, status. classes: id,name,majorId,majorName,facultyId,facultyName."},
          "400":{"description":"Tham số không hợp lệ"},"401":{"description":"Chưa đăng nhập"},"403":{"description":"Không có quyền báo cáo quản lý"},"500":{"description":"Không thể tải dữ liệu"}
        }
      }
    },
    "/reports/analytics": {
      "get": {
        "tags": ["Báo cáo"],
        "summary": "Tầng 2: phân loại điểm, chuyển đổi tham gia theo sự kiện và Top sinh viên",
        "description": "ADMIN toàn trường; trợ lý giới hạn khoa. Điểm dùng lastscore của bản ghi mới nhất trong học kỳ, status=1, hợp lệ 0–100. Thiếu điểm tách riêng. No-show là ước tính từ lượt chưa có minh chứng mới nhất được duyệt, bao gồm chờ xử lý. Top xếp số hoạt động xác nhận giảm dần, giờ quy đổi giảm dần, ID tăng dần. Khoảng ngày chỉ lọc hoạt động; school_year_id chọn học kỳ điểm độc lập. Xem docs/report-analytics-api.md.",
        "security": [{"BearerAuth": []}],
        "parameters": [
          {"name":"from_date","in":"query","schema":{"type":"string","format":"date"}},
          {"name":"to_date","in":"query","schema":{"type":"string","format":"date"}},
          {"name":"school_year_id","in":"query","schema":{"type":"integer","format":"int64","minimum":1}},
          {"name":"page","in":"query","schema":{"type":"integer","minimum":1,"maximum":1000000,"default":1}},
          {"name":"page_size","in":"query","schema":{"type":"integer","minimum":1,"maximum":100,"default":5}},
          {"name":"top_limit","in":"query","schema":{"type":"integer","minimum":1,"maximum":50,"default":5}},
          {"name":"sort","in":"query","schema":{"type":"string","enum":["attended","registered","no_show"],"default":"attended"}}
        ],
        "responses": {
          "200":{"description":"status=success; data gồm scopeName, period, semesters, scores (semester, totalStudents, gradedStudents, ungradedStudents, invalidScores, bands), events, eventTotal, page, pageSize, topStudents, attendanceBasis"},
          "400":{"description":"Tham số không hợp lệ hoặc học kỳ không tồn tại"},
          "401":{"description":"Chưa đăng nhập"},
          "403":{"description":"Không có quyền báo cáo quản lý"},
          "500":{"description":"Không truy vấn được dữ liệu hoặc chưa xác định khoa phụ trách"}
        }
      }
    },
    "/reports/overview": {
      "get": {
        "tags": ["Báo cáo"],
        "summary": "Bốn KPI quản lý từ PostgreSQL, so sánh với kỳ trước",
        "description": "ADMIN: toàn trường; STUDENT_AFFAIRS_ASSISTANT: khoa được phân công. Chỉ tính hoạt động đã kết thúc và không bị hủy, theo ngày kết thúc. Tham gia = minh chứng mới nhất được duyệt; giờ quy đổi = thời lượng hoạt động trên mỗi sinh viên được xác nhận. Không phải check-in trực tiếp. Cấp tổ chức suy ra từ vai trò người tạo. Không truyền ngày: học kỳ tháng 8–1 hoặc 2–7 và học kỳ trước. Truyền cả hai ngày: so sánh khoảng liền trước có cùng số ngày (tối đa 366 ngày). Tỷ lệ null khi mẫu số bằng 0; thay đổi tỷ lệ check-in tính bằng điểm phần trăm. Chi tiết hợp đồng: docs/report-overview-api.md.",
        "security": [{"BearerAuth": []}],
        "parameters": [
          {"name": "from_date", "in": "query", "schema": {"type": "string", "format": "date"}},
          {"name": "to_date", "in": "query", "schema": {"type": "string", "format": "date"}}
        ],
        "responses": {
          "200": {"description": "status=success; data gồm scopeName, period, previousPeriod, current, previous, changes, attendanceBasis và hoursBasis"},
          "400": {"description": "Khoảng ngày không hợp lệ"},
          "401": {"description": "Chưa đăng nhập"},
          "403": {"description": "Không có quyền báo cáo quản lý"},
          "500": {"description": "Không truy vấn được dữ liệu hoặc chưa xác định được khoa phụ trách"}
        }
      }
    },
`
