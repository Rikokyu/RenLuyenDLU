import React, { useState } from 'react';
import DetailForLec from './DetailForLec';
import './Evidence.css';

const initialData = [
  { id: 1, name: 'Nguyễn Văn A', studentId: '20120001', facultyClass: 'CNTT - K65A', event: 'Mùa hè xanh 2026', proof: 'Minh chứng đã tải lên', score: 10, status: 'Chờ phê duyệt' },
  { id: 2, name: 'Trần Thị B', studentId: '20120002', facultyClass: 'Kinh tế - K65B', event: 'Hiến máu nhân đạo', proof: 'Minh chứng đã tải lên', score: 5, status: 'Chờ phê duyệt' },
  { id: 3, name: 'Lê Văn C', studentId: '20120003', facultyClass: 'Ngoại ngữ - K64C', event: 'Hội thảo Khoa học', proof: 'Minh chứng đã tải lên', score: 8, status: 'Đã phê duyệt' },
  { id: 4, name: 'Phạm Văn D', studentId: '20120004', facultyClass: 'CNTT - K65A', event: 'Giải bóng đá Sinh viên', proof: 'Minh chứng đã tải lên', score: 5, status: 'Đã từ chối' },
];

export default function Evidence() {
  const [data, setData] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedProof, setSelectedProof] = useState(null);

  // Thống kê
  const totalCount = data.length;
  const pendingCount = data.filter((item) => item.status === 'Chờ phê duyệt').length;
  const approvedCount = data.filter((item) => item.status === 'Đã phê duyệt').length;
  const rejectedCount = data.filter((item) => item.status === 'Đã từ chối').length;

  // Lọc dữ liệu theo Từ khóa + Trạng thái Combobox
  const filteredData = data.filter((item) => {
    const matchesQuery =
      item.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.studentId.includes(searchQuery);

    const matchesStatus = selectedStatus ? item.status === selectedStatus : true;

    return matchesQuery && matchesStatus;
  });

  // Nút "Duyệt" ở màn hình chính: Chỉ chuyển trạng thái hàng loạt/tìm kiếm, KHÔNG mở giao diện
  const handleQuickApprove = () => {
    setData((prevData) =>
      prevData.map((item) => {
        const matchesQuery =
          item.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.studentId.includes(searchQuery);

        const matchesStatus = selectedStatus ? item.status === selectedStatus : true;

        if (matchesQuery && matchesStatus && item.status === 'Chờ phê duyệt') {
          return { ...item, status: 'Đã phê duyệt' };
        }
        return item;
      })
    );
  };

  // Duyệt trong DetailForLec
  const handleDetailApprove = (id) => {
    setData((prevData) =>
      prevData.map((item) => (item.id === id ? { ...item, status: 'Đã phê duyệt' } : item))
    );
    setSelectedProof(null);
  };

  // Hủy trong DetailForLec
  const handleDetailReject = (id) => {
    setData((prevData) =>
      prevData.map((item) => (item.id === id ? { ...item, status: 'Đã từ chối' } : item))
    );
    setSelectedProof(null);
  };

  return (
    <div className="evidence-container">
      {/* Khung tìm kiếm & Thống kê */}
      <div className="evidence-header-card">
        <h1 className="text-large text-white font-bold">
          NỘP MINH CHỨNG VÀ PHÊ DUYỆT MINH CHỨNG ĐÃ THAM GIA
        </h1>
        <p className="text-small text-white subtitle">
          Ghi nhận minh chứng hình ảnh và phê duyệt điểm rèn luyện
        </p>

        {/* Thống kê 4 ô */}
        <div className="stats-container">
          <div className="stat-box">
            <span className="text-small text-black font-bold">Tất cả minh chứng</span>
            <span className="text-large text-black font-bold">{totalCount}</span>
          </div>
          <div className="stat-box">
            <span className="text-small text-orange font-bold">Chờ phê duyệt</span>
            <span className="text-large text-black font-bold">{pendingCount}</span>
          </div>
          <div className="stat-box">
            <span className="text-small text-green font-bold">Đã phê duyệt</span>
            <span className="text-large text-black font-bold">{approvedCount}</span>
          </div>
          <div className="stat-box">
            <span className="text-small text-red font-bold">Đã từ chối</span>
            <span className="text-large text-black font-bold">{rejectedCount}</span>
          </div>
        </div>

        {/* Khung Bộ lọc */}
        <div className="filter-wrapper">
          <div className="filter-row">
            <input
              type="text"
              className="input-custom flex-grow"
              placeholder="Tìm kiếm theo tên hoặc mã hoạt động"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select className="input-custom select-faculty">
              <option>Tất cả khoa</option>
            </select>
          </div>

          <div className="filter-row">
            {/* Nút Tìm nền màu trắng */}
            <button className="btn-custom btn-white-bg text-black font-bold">
              Tìm
            </button>

            {/* Thay thế button Trạng thái bằng Combobox (Select) */}
            <select
              className="input-custom select-status font-bold"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Trạng thái</option>
              <option value="Chờ phê duyệt">Chờ phê duyệt</option>
              <option value="Đã phê duyệt">Đã phê duyệt</option>
              <option value="Đã từ chối">Đã từ chối</option>
            </select>

            <div className="date-picker-group text-small text-white">
              <span>Ngày</span>
              <input type="text" className="input-custom date-input" />
              <span>đến</span>
              <input type="text" className="input-custom date-input" />
            </div>

            <select className="input-custom select-class">
              <option>Tất cả lớp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Nút Duyệt trực tiếp không bật giao diện */}
      <div className="action-row">
        <button className="btn-custom btn-green btn-white-text" onClick={handleQuickApprove}>
          Duyệt
        </button>
      </div>

      {/* Bảng Danh Sách Minh Chứng */}
      <div className="table-wrapper">
        <table className="evidence-table">
          <thead>
            <tr>
              <th className="text-large">Sinh viên</th>
              <th className="text-large">Hoạt động</th>
              <th className="text-large">Minh chứng</th>
              <th className="text-large">Điểm</th>
              <th className="text-large">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => (
              <tr
                key={item.id}
                className={`row-item ${index % 2 === 0 ? 'bg-gray' : 'bg-white'}`}
                onClick={() => setSelectedProof(item)}
              >
                <td className="text-small">{item.name}</td>
                <td className="text-small">{item.event}</td>
                <td className="text-small">{item.proof}</td>
                <td className="text-small">{item.score}</td>
                <td
                  className="text-small font-bold"
                  style={{
                    color:
                      item.status === 'Đã phê duyệt'
                        ? '#00a859'
                        : item.status === 'Đã từ chối'
                        ? '#ff0000'
                        : '#f26522',
                  }}
                >
                  {item.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DetailForLec */}
      {selectedProof && (
        <DetailForLec
          proof={selectedProof}
          onClose={() => setSelectedProof(null)}
          onApprove={handleDetailApprove}
          onReject={handleDetailReject}
        />
      )}
    </div>
  );
}