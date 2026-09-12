import React from 'react';

export default function DetailForStu({ data, onClose, onDelete }) {
  const item = data || {
    studentName: 'Nguyễn Văn A',
    studentId: '20120001',
    facultyClass: 'CNTT - K65A',
    event: 'Tên sự kiện mẫu',
    status: 'Chờ phê duyệt',
    proofName: 'Minh chứng đã tải lên',
    score: 0,
    description: 'Thông tin cơ bản của sự kiện',
  };

  return (
    <div className="modal-overlay-stu">
      <div className="modal-content-stu">
        {/* Khung 1: Thông tin Sinh viên */}
        <div className="detail-box-border">
          <div className="info-row-stu">
            <span className="info-label-stu">Tên:</span>
            <div className="pill-placeholder">{item.studentName}</div>
          </div>
          <div className="info-row-stu">
            <span className="info-label-stu">Mã số sinh viên:</span>
            <div className="pill-placeholder">{item.studentId}</div>
          </div>
          <div className="info-row-stu">
            <span className="info-label-stu">Khoa - lớp:</span>
            <div className="pill-placeholder">{item.facultyClass}</div>
          </div>
        </div>

        {/* Khung 2: Thông tin Sự kiện & Minh chứng */}
        <div className="detail-box-border">
          <h3 className="text-large font-bold">{item.event || 'Tên sự kiện'}</h3>
          <p className="text-large font-bold">Tình trạng của minh chứng</p>
          
          <div className="pill-placeholder">
            {item.proofName || 'Minh chứng đã tải lên'}
          </div>

          <p className="text-large font-bold">
            Điểm rèn luyện: <span className="text-large">{item.score || 0}</span>
          </p>

          <p className="text-large font-bold">
            {item.description || 'Thông tin cơ bản của sự kiện'}
          </p>

          <button
            className="btn-stu btn-orange btn-delete-evidence"
            onClick={() => onDelete && onDelete(item.id)}
          >
            Xóa minh chứng
          </button>
        </div>

        {/* Nhóm nút góc dưới bên phải */}
        <div className="modal-actions-right">
          <button className="btn-stu btn-orange" onClick={onClose}>
            Thoát
          </button>
          <button className="btn-stu btn-green" onClick={onClose}>
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}