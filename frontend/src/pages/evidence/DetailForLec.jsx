import React from 'react';
import './Evidence.css';

export default function DetailForLec({ proof, onClose, onApprove, onReject }) {
  if (!proof) return null;

  return (
    <div className="modal-backdrop">
      <div className="detail-modal-container">
        {/* Khung 1: Thông tin Sinh viên */}
        <div className="detail-card-box">
          <div className="detail-row">
            <span className="text-large font-bold label-width">Tên:</span>
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