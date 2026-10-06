import React from 'react';
import './Evidence.css';

export default function DetailForLec({ proof, onClose, onApprove, onReject }) {
  if (!proof) return null;

  const displayValue = (value) => value === undefined || value === null || value === '' ? 'Chưa cập nhật' : value;

  return (
    <div className="modal-backdrop">
      <div className="detail-modal-container">
        {/* Khung 1: Thông tin sinh viên */}
        <div className="detail-card-box">
          <h2 className="text-large font-bold title-margin">Thông tin sinh viên</h2>
          <div className="detail-row">
            <span className="text-large font-bold label-width">Tên đầy đủ:</span>
            <div className="value-placeholder text-small">{proof.name}</div>
          </div>

          <div className="detail-row">
            <span className="text-large font-bold label-width">Mã số sinh viên:</span>
            <div className="value-placeholder text-small">{proof.studentId}</div>
          </div>

          <div className="detail-row">
            <span className="text-large font-bold label-width">Khoa - lớp:</span>
            <div className="value-placeholder text-small">{proof.facultyClass}</div>
          </div>

          <h2 className="text-large font-bold title-margin academic-info-heading">Thông tin học tập</h2>
          <div className="academic-info-grid">
            <div className="academic-info-item"><span>Chuyên ngành</span><strong>{displayValue(proof.major)}</strong></div>
            <div className="academic-info-item"><span>Năm học</span><strong>{displayValue(proof.academicYear)}</strong></div>
            <div className="academic-info-item"><span>Học kỳ</span><strong>{proof.semester != null ? `Học kỳ ${proof.semester}` : 'Chưa cập nhật'}</strong></div>
          </div>
        </div>

        {/* Khung 2: Thông tin sự kiện và minh chứng */}
        <div className="detail-card-box">
          <h2 className="text-large font-bold title-margin">
            Tên sự kiện: {proof.event}
          </h2>

          <h2 className="text-large font-bold title-margin">
            Tình trạng của minh chứng
          </h2>

          <div className="uploaded-box text-small">
            {proof.proof || 'Minh chứng đã tải lên'}
          </div>

          <h2 className="text-large font-bold title-margin">
            Điểm rèn luyện: {proof.score}
          </h2>

          <h2 className="text-large font-bold title-margin">
            Thông tin cơ bản của sự kiện
          </h2>

          {/* Các nút hành động bên trong Khung 2 */}
          <div className="inner-btn-group">
            <button
              className="btn-custom btn-orange btn-white-text"
              onClick={() => onReject(proof.id)}
            >
              Hủy minh chứng
            </button>
            <button
              className="btn-custom btn-green btn-white-text"
              onClick={() => onApprove(proof.id)}
            >
              Duyệt
            </button>
          </div>
        </div>

        {/* Các nút Thoát / Xong góc dưới bên phải */}
        <div className="outer-btn-group">
          <button className="btn-custom btn-orange btn-white-text" onClick={onClose}>
            Thoát
          </button>
          <button className="btn-custom btn-green btn-white-text" onClick={onClose}>
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}
