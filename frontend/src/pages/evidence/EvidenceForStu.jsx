import React, { useEffect, useState } from 'react';
import SubmitEvidence from './SubmitEvidence';
import DetailForStu from './DetailForStu';
import { getProfile } from '../../services/authService';
import { getCurrentUser } from '../../store/authStore';
import './EvidenceStu.css';

export default function EvidenceForStu() {
  const user = getCurrentUser();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [evidenceList, setEvidenceList] = useState([]);
  const [loadError, setLoadError] = useState('');
  const facultyClass = [user?.faculty, user?.classCode].filter(Boolean).join(' - ');

  useEffect(() => {
    let active = true;
    getProfile()
      .then((profile) => {
        if (!active) return;
        setEvidenceList(
          profile.activities.map((activity, index) => ({
            id: `${activity.title}-${index}`,
            studentName: profile.user.name,
            studentId: profile.user.studentId,
            facultyClass: [profile.user.faculty, profile.user.classCode]
              .filter(Boolean)
              .join(' - '),
            event: activity.title,
            proofName:
              activity.evidenceStatus === 'Chưa nộp'
                ? 'Chưa nộp minh chứng'
                : 'Minh chứng đã nộp',
            score: activity.score,
            status:
              activity.evidenceStatus === 'Đã duyệt'
                ? 'Đã phê duyệt'
                : activity.evidenceStatus === 'Đã từ chối'
                  ? 'Đã từ chối'
                  : activity.evidenceStatus === 'Chưa nộp'
                    ? 'Chưa nộp minh chứng'
                    : 'Chờ phê duyệt',
          })),
        );
      })
      .catch((error) => {
        if (active) {
          setLoadError(
            error.response?.data?.message || 'Không thể tải minh chứng cá nhân.',
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Thống kê số lượng
  const totalCount = evidenceList.length;
  const pendingCount = evidenceList.filter((i) => i.status === 'Chờ phê duyệt').length;
  const approvedCount = evidenceList.filter((i) => i.status === 'Đã phê duyệt').length;
  const rejectedCount = evidenceList.filter((i) => i.status === 'Đã từ chối').length;
  const needMoreCount = evidenceList.filter((i) => i.status === 'Cần bổ sung').length;

  // Thêm minh chứng mới
  const handleAddEvidence = (newProof) => {
    const newItem = {
      id: Date.now(),
      studentName: user?.name || '',
      studentId: user?.studentId || '',
      facultyClass,
      event: newProof.event,
      proofName: newProof.proof,
      score: 0,
      status: 'Chờ phê duyệt',
    };
    setEvidenceList((current) => [newItem, ...current]);
  };

  // Xóa minh chứng
  const handleDeleteEvidence = (id) => {
    setEvidenceList(evidenceList.filter((item) => item.id !== id));
    setSelectedEvidence(null);
  };

  return (
    <div className="evidence-stu-container">
      {/* Khung Header chính */}
      <div className="header-card-stu">
        <h1 className="text-large font-bold">
          NỘP MINH CHỨNG VÀ PHÊ DUYỆT MINH CHỨNG ĐÃ THAM GIA
        </h1>
        <p className="text-small header-subtitle">
          Ghi nhận minh chứng hình ảnh và phê duyệt điểm rèn luyện
        </p>

        {/* 5 ô thống kê */}
        <div className="stats-grid-stu">
          <div className="stat-card-stu">
            <span className="stat-title" style={{ color: '#000000' }}>Tất cả minh chứng</span>
            <span className="stat-num">{totalCount}</span>
          </div>
          <div className="stat-card-stu">
            <span className="stat-title" style={{ color: '#ff6a38' }}>Chờ phê duyệt</span>
            <span className="stat-num">{pendingCount}</span>
          </div>
          <div className="stat-card-stu">
            <span className="stat-title" style={{ color: '#00a859' }}>Đã phê duyệt</span>
            <span className="stat-num">{approvedCount}</span>
          </div>
          <div className="stat-card-stu">
            <span className="stat-title" style={{ color: '#ff0000' }}>Đã từ chối</span>
            <span className="stat-num">{rejectedCount}</span>
          </div>
          <div className="stat-card-stu">
            <span className="stat-title" style={{ color: '#a855f7' }}>Cần bổ sung</span>
            <span className="stat-num">{needMoreCount}</span>
          </div>
        </div>

        {/* Thanh Tìm kiếm & Chọn khoa lớp */}
        <div className="filter-bar-stu">
          <input
            type="text"
            className="input-stu filter-input-search"
            placeholder="Tìm kiếm theo tên hoặc mã hoạt động"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select className="input-stu filter-select-stu">
            <option>Tất cả khoa - lớp</option>
          </select>
          <button className="btn-stu btn-white font-bold">Tìm</button>
        </div>
      </div>

      {/* Nút Nộp minh chứng */}
      <div className="btn-add-evidence">
        <button
          className="btn-stu btn-green"
          onClick={() => setShowSubmitModal(true)}
        >
          + Nộp minh chứng
        </button>
      </div>

      {/* Bảng Danh sách minh chứng */}
      <div className="table-container-stu">
        {loadError && <p role="alert">{loadError}</p>}
        <table className="table-stu">
          <thead>
            <tr>
              <th>Sinh viên</th>
              <th>Hoạt động</th>
              <th>Minh chứng</th>
              <th>Điểm</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {evidenceList.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '40px' }}>Chưa có minh chứng nào</td>
              </tr>
            ) : (
              evidenceList.map((item, index) => (
                <tr
                  key={item.id}
                  className={`row-stu-clickable ${index % 2 === 0 ? 'row-stu-gray' : 'row-stu-white'}`}
                  onClick={() => setSelectedEvidence(item)}
                >
                  <td>{item.studentName}</td>
                  <td>{item.event}</td>
                  <td>{item.proofName}</td>
                  <td>{item.score}</td>
                  <td
                    style={{
                      color:
                        item.status === 'Đã phê duyệt'
                          ? '#00a859'
                          : item.status === 'Đã từ chối'
                          ? '#ff0000'
                          : item.status === 'Cần bổ sung'
                          ? '#a855f7'
                          : '#ff6a38',
                      fontWeight: 'bold',
                    }}
                  >
                    {item.status}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Hiển thị Modal Nộp Minh Chứng (Hình 2) */}
      {showSubmitModal && (
        <SubmitEvidence
          onClose={() => setShowSubmitModal(false)}
          onSubmitSuccess={handleAddEvidence}
        />
      )}

      {/* Hiển thị Modal Chi Tiết Minh Chứng (Hình 3) */}
      {selectedEvidence && (
        <DetailForStu
          data={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
          onDelete={handleDeleteEvidence}
        />
      )}
    </div>
  );
}