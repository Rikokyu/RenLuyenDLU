import React, { useState } from 'react';

export default function SubmitEvidence({ onClose, onSubmitSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchEvent, setSearchEvent] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = () => {
    if (onSubmitSuccess) {
      onSubmitSuccess({
        event: searchEvent || 'Hội thảo Khoa học Sinh viên 2026',
        proof: selectedFile ? selectedFile.name : 'Minh chứng đã tải lên',
      });
    }
    onClose();
  };

  return (
    <div className="modal-overlay-stu">
      <div className="modal-content-stu">
        {/* Tiêu đề */}
        <h2 className="text-large font-bold">Chọn sự kiện muốn nộp minh chứng:</h2>

        {/* Ô tìm kiếm sự kiện */}
        <input
          type="text"
          className="input-stu"
          placeholder="Tìm kiếm theo tên hoặc mã hoạt động"
          value={searchEvent}
          onChange={(e) => setSearchEvent(e.target.value)}
        />

        {/* Khung kéo/thả file */}
        <div className="dropzone-box">
          <span className="dropzone-text">
            {selectedFile ? selectedFile.name : 'Kéo hoặc tải lên tệp lên đây'}
          </span>
          <button
            type="button"
            className="btn-stu btn-orange btn-delete-file"
            onClick={handleClearFile}
          >
            Xóa
          </button>
        </div>

        {/* Ghi chú định dạng */}
        <p className="note-text-red">* Chỉ chấp nhận các loại tệp .jpg, .png</p>

        {/* Thanh tiến trình */}
        <div className="progress-bar-container">
          <div className="progress-bar-fill"></div>
        </div>

        {/* Nút Chọn tệp ở giữa */}
        <div className="modal-actions-center">
          <label className="btn-stu btn-green" style={{ cursor: 'pointer' }}>
            Chọn tệp
            <input
              type="file"
              accept=".jpg,.png"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* Nhóm nút góc dưới bên phải */}
        <div className="modal-actions-right">
          <button className="btn-stu btn-orange" onClick={onClose}>
            Thoát
          </button>
          <button className="btn-stu btn-green" onClick={handleSubmit}>
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}