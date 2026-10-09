package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

const openAPIDocument = `{
  "openapi": "3.0.3",
  "info": {
    "title": "Ren Luyen DLU API",
    "version": "1.0.0",
    "description": "API đăng nhập, hồ sơ, dữ liệu quản lý và minh chứng. Để thử API bảo vệ trong Swagger, đăng nhập trước, sao chép trường token trong phản hồi rồi chọn Authorize và dán token; Swagger không tự dùng phiên đăng nhập của giao diện web. Các thao tác ghi sẽ cập nhật dữ liệu trong cơ sở dữ liệu."
  },
  "servers": [{"url": "/api/v1"}],
  "paths": {
    "/auth/login": {
      "post": {
        "tags": ["Xác thực"],
        "summary": "Đăng nhập bằng mã tài khoản",
        "requestBody": {"required": true, "content": {"application/json": {"schema": {"$ref": "#/components/schemas/LoginRequest"}}}},
        "responses": {
          "200": {"description": "Đăng nhập thành công"},
          "400": {"description": "Yêu cầu không hợp lệ"},
          "401": {"description": "Sai thông tin đăng nhập"},
          "500": {"description": "Lỗi xử lý"}
        }
      }
    },
    "/auth/google": {
      "post": {
        "tags": ["Xác thực"],
        "summary": "Đăng nhập bằng Google @dlu.edu.vn",
        "requestBody": {"required": true, "content": {"application/json": {"schema": {"$ref": "#/components/schemas/GoogleLoginRequest"}}}},
        "responses": {"200": {"description": "Đăng nhập thành công"}, "400": {"description": "Yêu cầu không hợp lệ"}, "401": {"description": "Tài khoản Google không hợp lệ"}}
      }
    },
    "/auth/me": {
      "get": {
        "tags": ["Hồ sơ"],
        "summary": "Lấy hồ sơ, điểm rèn luyện và lịch sử hoạt động của tài khoản hiện tại",
        "security": [{"BearerAuth": []}],
        "responses": {"200": {"description": "Thông tin người dùng và dữ liệu hiển thị hồ sơ"}, "401": {"description": "Chưa đăng nhập"}}
      }
    },
    "/auth/password": {
      "put": {
        "tags": ["Xác thực"],
        "summary": "Đổi mật khẩu và lưu vào cơ sở dữ liệu",
        "security": [{"BearerAuth": []}],
        "requestBody": {"required": true, "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ChangePasswordRequest"}}}},
        "responses": {"200": {"description": "Đổi mật khẩu thành công"}, "400": {"description": "Yêu cầu không hợp lệ"}, "401": {"description": "Mật khẩu hiện tại không đúng"}}
      }
    },
    "/manager/students": {
      "get": {
        "tags": ["Quản lý"],
        "summary": "Lấy danh sách sinh viên hiển thị trong trang quản lý",
        "security": [{"BearerAuth": []}],
        "parameters": [
          {"name": "search", "in": "query", "schema": {"type": "string"}},
          {"name": "class_code", "in": "query", "schema": {"type": "string"}}
        ],
        "responses": {"200": {"description": "Danh sách sinh viên"}, "401": {"description": "Chưa đăng nhập"}, "403": {"description": "Không đủ quyền"}}
      },
      "post": {
        "tags": ["Quản lý"],
        "summary": "Tạo sinh viên và cập nhật dữ liệu cơ sở dữ liệu",
        "security": [{"BearerAuth": []}],
        "requestBody": {"required": true, "content": {"application/json": {"schema": {"$ref": "#/components/schemas/StudentMutation"}}}},
        "responses": {"200": {"description": "Đã lưu sinh viên"}, "400": {"description": "Dữ liệu không hợp lệ"}, "403": {"description": "Không đủ quyền"}}
      }
    },
    "/manager/students/{id}": {
      "parameters": [{"name": "id", "in": "path", "required": true, "schema": {"type": "string", "example": "2312660"}}],
      "put": {
        "tags": ["Quản lý"],
        "summary": "Cập nhật sinh viên trong cơ sở dữ liệu",
        "security": [{"BearerAuth": []}],
        "requestBody": {"required": true, "content": {"application/json": {"schema": {"$ref": "#/components/schemas/StudentMutation"}}}},
        "responses": {"200": {"description": "Đã lưu sinh viên"}, "400": {"description": "Dữ liệu không hợp lệ"}, "403": {"description": "Không đủ quyền"}}
      },
      "delete": {
        "tags": ["Quản lý"],
        "summary": "Xóa sinh viên",
        "security": [{"BearerAuth": []}],
        "responses": {"204": {"description": "Đã xóa"}, "400": {"description": "Mã sinh viên không hợp lệ"}, "403": {"description": "Không đủ quyền"}}
      }
    },
    "/manager/classes": {
      "get": {
        "tags": ["Quản lý"],
        "summary": "Lấy danh sách lớp hiển thị trong trang quản lý",
        "security": [{"BearerAuth": []}],
        "responses": {"200": {"description": "Danh sách lớp"}, "401": {"description": "Chưa đăng nhập"}, "403": {"description": "Không đủ quyền"}}
      },
      "post": {
        "tags": ["Quản lý"],
        "summary": "Tạo lớp trong cơ sở dữ liệu",
        "security": [{"BearerAuth": []}],
        "requestBody": {"required": true, "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ClassMutation"}}}},
        "responses": {"200": {"description": "Đã lưu lớp"}, "400": {"description": "Dữ liệu không hợp lệ"}, "403": {"description": "Không đủ quyền"}}
      }
    },
    "/manager/classes/{code}": {
      "parameters": [{"name": "code", "in": "path", "required": true, "schema": {"type": "string", "example": "MKK50A"}}],
      "put": {
        "tags": ["Quản lý"],
        "summary": "Cập nhật lớp trong cơ sở dữ liệu",
        "security": [{"BearerAuth": []}],
        "requestBody": {"required": true, "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ClassMutation"}}}},
        "responses": {"200": {"description": "Đã lưu lớp"}, "400": {"description": "Dữ liệu không hợp lệ"}, "403": {"description": "Không đủ quyền"}}
      },
      "delete": {
        "tags": ["Quản lý"],
        "summary": "Xóa lớp",
        "security": [{"BearerAuth": []}],
        "responses": {"204": {"description": "Đã xóa"}, "400": {"description": "Dữ liệu không hợp lệ"}, "403": {"description": "Không đủ quyền"}}
      }
    },
    "/manager/accounts": {
      "get": {
        "tags": ["Quản lý"],
        "summary": "Lấy danh sách tài khoản hiển thị trong trang quản lý",
        "security": [{"BearerAuth": []}],
        "responses": {"200": {"description": "Danh sách tài khoản"}, "401": {"description": "Chưa đăng nhập"}, "403": {"description": "Không đủ quyền"}}
      },
      "post": {
        "tags": ["Quản lý"],
        "summary": "Tạo tài khoản trong cơ sở dữ liệu (không phải đăng ký công khai)",
        "security": [{"BearerAuth": []}],
        "requestBody": {"required": true, "content": {"application/json": {"schema": {"$ref": "#/components/schemas/AccountMutation"}}}},
        "responses": {"200": {"description": "Đã lưu tài khoản"}, "400": {"description": "Dữ liệu không hợp lệ"}, "403": {"description": "Không đủ quyền"}}
      }
    },
    "/manager/accounts/{id}": {
      "parameters": [{"name": "id", "in": "path", "required": true, "schema": {"type": "integer", "format": "int64"}}],
      "put": {
        "tags": ["Quản lý"],
        "summary": "Cập nhật tài khoản trong cơ sở dữ liệu",
        "security": [{"BearerAuth": []}],
        "requestBody": {"required": true, "content": {"application/json": {"schema": {"$ref": "#/components/schemas/AccountMutation"}}}},
        "responses": {"200": {"description": "Đã lưu tài khoản"}, "400": {"description": "Dữ liệu không hợp lệ"}, "403": {"description": "Không đủ quyền"}}
      },
      "delete": {
        "tags": ["Quản lý"],
        "summary": "Xóa tài khoản",
        "security": [{"BearerAuth": []}],
        "responses": {"204": {"description": "Đã xóa"}, "400": {"description": "Mã tài khoản không hợp lệ"}, "403": {"description": "Không đủ quyền"}}
      }
    },
    "/manager/accounts/{id}/reset-password": {
      "post": {
        "tags": ["Quản lý"],
        "summary": "Đặt lại mật khẩu về mặc định DLU@2026",
        "security": [{"BearerAuth": []}],
        "parameters": [{"name": "id", "in": "path", "required": true, "schema": {"type": "integer", "format": "int64"}}],
        "responses": {"200": {"description": "Đã đặt lại mật khẩu mặc định"}, "400": {"description": "Mã tài khoản không hợp lệ"}, "403": {"description": "Không đủ quyền"}}
      }
    },
    "/manager/roles": {
      "get": {
        "tags": ["Quản lý"],
        "summary": "Lấy danh sách vai trò dùng trong biểu mẫu quản lý",
        "security": [{"BearerAuth": []}],
        "responses": {"200": {"description": "Danh sách vai trò"}, "401": {"description": "Chưa đăng nhập"}, "403": {"description": "Không đủ quyền"}}
      }
    },
    "/evidences": {
      "get": {
        "tags": ["Minh chứng"],
        "summary": "Lấy danh sách minh chứng hiển thị trên màn hình, hỗ trợ bộ lọc",
        "security": [{"BearerAuth": []}],
        "parameters": [
          {"name": "search", "in": "query", "schema": {"type": "string"}},
          {"name": "status", "in": "query", "schema": {"type": "integer", "description": "1: đã duyệt, 2: từ chối; các trạng thái khác tùy dữ liệu"}},
          {"name": "faculty_id", "in": "query", "schema": {"type": "integer", "format": "int64"}},
          {"name": "major_id", "in": "query", "schema": {"type": "integer", "format": "int64"}},
          {"name": "class_id", "in": "query", "schema": {"type": "integer", "format": "int64"}},
          {"name": "from_date", "in": "query", "schema": {"type": "string", "format": "date"}},
          {"name": "to_date", "in": "query", "schema": {"type": "string", "format": "date"}}
        ],
        "responses": {"200": {"description": "Danh sách minh chứng"}, "400": {"description": "Bộ lọc không hợp lệ"}, "401": {"description": "Chưa đăng nhập"}, "403": {"description": "Không đủ quyền"}}
      }
    },
    "/evidences/stats": {
      "get": {
        "tags": ["Minh chứng"],
        "summary": "Lấy số liệu thống kê minh chứng hiển thị trên trang",
        "security": [{"BearerAuth": []}],
        "responses": {"200": {"description": "Tổng số, chờ duyệt, đã duyệt và từ chối"}, "401": {"description": "Chưa đăng nhập"}, "403": {"description": "Không đủ quyền"}}
      }
    },
    "/evidences/filters": {
      "get": {
        "tags": ["Minh chứng"],
        "summary": "Lấy các lựa chọn bộ lọc khoa, ngành và lớp",
        "security": [{"BearerAuth": []}],
        "responses": {"200": {"description": "Tùy chọn bộ lọc"}, "401": {"description": "Chưa đăng nhập"}, "403": {"description": "Không đủ quyền"}}
      }
    },
    "/evidences/detail": {
      "get": {
        "tags": ["Minh chứng"],
        "summary": "Lấy dữ liệu chi tiết minh chứng",
        "security": [{"BearerAuth": []}],
        "parameters": [{"name": "evidence_id", "in": "query", "required": true, "schema": {"type": "integer", "format": "int64", "minimum": 1}}],
        "responses": {"200": {"description": "Chi tiết minh chứng"}, "400": {"description": "Mã minh chứng không hợp lệ"}, "404": {"description": "Không tìm thấy"}, "403": {"description": "Không đủ quyền"}}
      }
    },
    "/evidences/status": {
      "put": {
        "tags": ["Minh chứng"],
        "summary": "Cập nhật trạng thái minh chứng và lưu vào cơ sở dữ liệu",
        "security": [{"BearerAuth": []}],
        "requestBody": {"required": true, "content": {"application/json": {"schema": {"$ref": "#/components/schemas/EvidenceStatusMutation"}}}},
        "responses": {"200": {"description": "Đã cập nhật trạng thái"}, "400": {"description": "Dữ liệu hoặc trạng thái không hợp lệ"}, "403": {"description": "Không đủ quyền"}}
      }
    },
    "/evidences/approve": {
      "put": {
        "tags": ["Minh chứng"],
        "summary": "Duyệt danh sách minh chứng và lưu vào cơ sở dữ liệu",
        "security": [{"BearerAuth": []}],
        "requestBody": {"required": true, "content": {"application/json": {"schema": {"$ref": "#/components/schemas/EvidenceApproveMutation"}}}},
        "responses": {"200": {"description": "Đã duyệt danh sách; phản hồi gồm số bản ghi cập nhật"}, "400": {"description": "Danh sách không hợp lệ"}, "403": {"description": "Không đủ quyền"}}
      }
    }
  },
  "components": {
    "securitySchemes": {"BearerAuth": {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}},
    "schemas": {
      "LoginRequest": {"type": "object", "required": ["username", "password"], "properties": {"username": {"type": "string", "example": "2312610"}, "password": {"type": "string", "example": "DLU@2026"}}},
      "GoogleLoginRequest": {"type": "object", "required": ["credential"], "properties": {"credential": {"type": "string", "description": "Google Identity Services ID token"}}},
      "ChangePasswordRequest": {"type": "object", "required": ["oldPassword", "newPassword"], "properties": {"oldPassword": {"type": "string"}, "newPassword": {"type": "string", "minLength": 8}}},
      "StudentMutation": {"type": "object", "properties": {"studentId": {"type": "string", "example": "2312660"}, "email": {"type": "string"}, "classCode": {"type": "string", "example": "MKK50A"}, "faculty": {"type": "string"}, "gender": {"type": "string"}, "birthDay": {"type": "string", "example": "2005-01-15"}, "firstName": {"type": "string"}, "lastName": {"type": "string"}, "studentName": {"type": "string"}, "isInClass": {"type": "boolean"}, "birthPlace": {"type": "string"}, "phone": {"type": "string"}, "classRoleId": {"type": "integer"}, "studyProgramId": {"type": "string"}, "permanentResidence": {"type": "string"}, "hometownCountry": {"type": "string"}, "hometownProvince": {"type": "string"}, "hometownCity": {"type": "string"}, "hometownAddress": {"type": "string"}}},
      "ClassMutation": {"type": "object", "properties": {"code": {"type": "string", "example": "MKK50A"}, "faculty": {"type": "string"}, "academicYear": {"type": "string"}}},
      "AccountMutation": {"type": "object", "properties": {"name": {"type": "string"}, "username": {"type": "string"}, "email": {"type": "string"}, "password": {"type": "string", "description": "Không gửi để giữ nguyên mật khẩu khi cập nhật"}, "gender": {"type": "string"}, "birthDay": {"type": "string"}, "phone": {"type": "string"}, "roleCode": {"type": "string"}, "unit": {"type": "string"}, "classCode": {"type": "string"}, "position": {"type": "string"}, "active": {"type": "boolean"}}},
      "EvidenceStatusMutation": {"type": "object", "required": ["evidence_id", "status"], "properties": {"evidence_id": {"type": "integer", "format": "int64", "minimum": 1}, "status": {"type": "integer", "description": "1: duyệt, 2: từ chối"}}},
      "EvidenceApproveMutation": {"type": "object", "required": ["evidence_ids"], "properties": {"evidence_ids": {"type": "array", "minItems": 1, "items": {"type": "integer", "format": "int64", "minimum": 1}}}}
    }
  }
}`

const swaggerUI = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Swagger UI - Ren Luyen DLU API</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>SwaggerUIBundle({url: "/swagger/openapi.json", dom_id: "#swagger-ui", persistAuthorization: true});</script>
  </body>
</html>`

func MapSwaggerRoutes(r *gin.Engine) {
	r.GET("/swagger", showSwaggerUI)
	r.GET("/swagger/", showSwaggerUI)
	r.GET("/swagger/index.html", showSwaggerUI)
	r.GET("/swagger/openapi.json", func(c *gin.Context) {
		c.Data(http.StatusOK, "application/json; charset=utf-8", []byte(openAPIDocument))
	})
}

func showSwaggerUI(c *gin.Context) {
	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(swaggerUI))
}
