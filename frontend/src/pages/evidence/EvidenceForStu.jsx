import React, { useEffect, useRef, useState } from 'react';
import { evidenceApi } from '../../services/evidenceService';
import { useCurrentUser } from '../../hooks/useAuth';
import DetailForStu from './DetailForStu';
import SubmitEvidence from './SubmitEvidence';
import './EvidenceStu.css';

export default function EvidenceForStu() {
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [sortBy, setSortBy] = useState('score');

  const user = useCurrentUser();
  const userId = ['ADMIN', 'STUDENT_AFFAIRS_ASSISTANT'].includes(user?.role) ? 27 : user?.id;
  const [evidenceList, setEvidenceList] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, needMore: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appliedSort, setAppliedSort] = useState({ by: 'score', order: 'asc' });
  const [appliedFilters, setAppliedFilters] = useState({});
  const requestVersion = useRef(0);
  const statuses = ['Cho phe duyet', 'Da phe duyet', 'Da tu choi', 'Can bo sung'];

  async function loadEvidence(filters, sort) {
    const version = ++requestVersion.current;
    setLoading(true);
    setEvidenceList([]);
    setError('');
    try {
      const result = await evidenceApi.getStudentEvidences({ user_id: userId, ...filters, sort_by: sort.by, sort_order: sort.order });
      if (version !== requestVersion.current) return;
      setEvidenceList(result.data.map(item => ({ ...item, status: statuses[item.statusCode] || 'Khong xac dinh' })));
      setStats(result.stats);
    } catch (err) {
      if (version === requestVersion.current) setError(err.response?.data?.message || 'Khong the tai minh chung. Vui long thu lai.');
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }

  useEffect(() => {
    loadEvidence({}, { by: 'score', order: 'asc' });
    setAppliedSort({ by: 'score', order: 'asc' });
    setAppliedFilters({});
    return () => { requestVersion.current += 1; };
  }, [userId]);

  function handleSearch(applySort = false, status = appliedFilters.status ?? '') {
    if (fromDate && toDate && fromDate > toDate) {
      setError('Ngay bat dau khong duoc sau ngay ket thuc.');
      return;
    }
    const sort = applySort ? { by: sortBy, order: sortOrder } : appliedSort;
    if (applySort) setAppliedSort(sort);
    const filters = { search: searchQuery.trim(), from_date: fromDate, to_date: toDate };
    if (status !== '') filters.status = status;
    setAppliedFilters(filters);
    loadEvidence(filters, sort);
  }

  function handleSubmitSuccess() {
    // Reload danh sach sau khi nop thanh cong
    loadEvidence(appliedFilters, appliedSort);
  }

  const totalCount = stats.total;
  const pendingCount = stats.pending;
  const approvedCount = stats.approved;
  const rejectedCount = stats.rejected;
  const needMoreCount = stats.needMore;

  return (
    <div className="evidence-stu-container">
      {/* Header */}
      <div className="header-card-stu">
        <h1 className="text-large font-bold">
          NOP MINH CHUNG VA PHE DUYET MINH CHUNG DA THAM GIA
        </h1>
        <p className="text-small header-subtitle">
          Ghi nhan minh chung hinh anh va phe duyet diem ren luyen
          {userId === 27 && <span> &middot; Nguyen Hoang Nam &mdash; 2312631</span>}
        </p>

        {/* 5 o thong ke */}
        <div className="stats-grid-stu">
          {[
            { status: '', title: 'Tất cả minh chứng', count: totalCount, color: '#000000' },
            { status: 0, title: 'Chờ phê duyệt', count: pendingCount, color: '#ff6a38' },
            { status: 1, title: 'Đã phê duyệt', count: approvedCount, color: '#00a859' },
            { status: 2, title: 'Đã từ chối', count: rejectedCount, color: '#ff0000' },
            { status: 3, title: 'Cần bổ sung', count: needMoreCount, color: '#a855f7' },
          ].map(({ status, title, count, color }) => (
            <button
              key={status}
              type="button"
              className="stat-card-stu"
              aria-pressed={(appliedFilters.status ?? '') === status}
              onClick={() => handleSearch(false, status)}
            >
              <span className="stat-title" style={{ color }}>{title}</span>
              <span className="stat-num">{count}</span>
            </button>
          ))}
        </div>

        {/* Thanh Tim kiem & Loc */}
        <div className="filter-bar-stu">
          <div className="filter-row-top">
            <input
              type="text"
              className="input-stu filter-input-search"
              aria-label="Ten hoac ma hoat dong"
              placeholder="Tim kiem theo ten hoac ma hoat dong"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="filter-label">Ngay</span>
            <input
              type="date"
              className="input-stu input-date"
              aria-label="Tu ngay nop"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <span className="filter-label">den</span>
            <input
              type="date"
              className="input-stu input-date"
              aria-label="Den ngay nop"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="filter-row-bottom">
            <button className="btn-stu btn-white font-bold" disabled={loading} onClick={() => handleSearch()}>Tim</button>
            <button className="btn-stu btn-white font-bold" disabled={loading} onClick={() => handleSearch(true)}>Sap xep</button>

            <div className="btn-group-toggle">
              <button className={`btn-toggle ${sortOrder === 'asc' ? 'active' : ''}`} onClick={() => setSortOrder('asc')}>Tang</button>
              <button className={`btn-toggle ${sortOrder === 'desc' ? 'active' : ''}`} onClick={() => setSortOrder('desc')}>Giam</button>
            </div>

            <div className="radio-group font-bold">
              <label className="radio-item">
                <input type="radio" name="sortBy" value="score" checked={sortBy === 'score'} onChange={() => setSortBy('score')} />
                <span>Diem</span>
              </label>
              <label className="radio-item">
                <input type="radio" name="sortBy" value="date" checked={sortBy === 'date'} onChange={() => setSortBy('date')} />
                <span>Ngay</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Nut Nop minh chung */}
      <div className="btn-add-evidence">
        <button
          id="btn-submit-evidence"
          className="btn-stu btn-green"
          onClick={() => setShowSubmitModal(true)}
        >
          + Nop minh chung
        </button>
      </div>

      {error && <p role="alert" className="student-evidence-error">{error}</p>}
      {loading && <p role="status">Dang tai minh chung...</p>}

      {/* Bang Danh sach minh chung */}
      <div className="table-wrapper-stu table-scroll-body">
          <table className="table-stu">
            <colgroup>
              <col className="evidence-col-student" />
              <col className="evidence-col-activity" />
              <col className="evidence-col-date" />
              <col className="evidence-col-file" />
              <col className="evidence-col-score" />
              <col className="evidence-col-status" />
            </colgroup>
            <thead>
              <tr>
                <th>Sinh vien</th>
                <th>Hoat dong</th>
                <th>Ngay nop</th>
                <th>Minh chung</th>
                <th>Diem</th>
                <th>Trang thai</th>
              </tr>
            </thead>
            <tbody>
              {evidenceList.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center' }}>
                    {loading ? 'Dang tai...' : 'Khong co minh chung phu hop'}
                  </td>
                </tr>
              ) : (
                evidenceList.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`row-stu-clickable ${index % 2 === 0 ? 'row-stu-gray' : 'row-stu-white'}`}
                    onClick={() => setSelectedEvidence(item)}
                    title="Bam de xem chi tiet minh chung"
                  >
                    <td>{item.studentName}</td>
                    <td>{item.event}<br /><small>{item.activityCode}</small></td>
                    <td>{item.submitDate}</td>
                    <td className="evidence-filename" title={item.proofName}>
                      {item.proofName || "—"}
                    </td>
                    <td>{item.score}</td>
                    <td
                      style={{
                        color:
                          item.statusCode === 1 ? '#00a859'
                          : item.statusCode === 2 ? '#ff0000'
                          : item.statusCode === 3 ? '#a855f7'
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

      {/* Modal Chi Tiet Minh Chung */}
      {selectedEvidence && (
        <DetailForStu
          data={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
        />
      )}

      {/* Modal Nop Minh Chung */}
      {showSubmitModal && (
        <SubmitEvidence
          onClose={() => setShowSubmitModal(false)}
          onSubmitSuccess={handleSubmitSuccess}
          targetUserId={userId}
        />
      )}
    </div>
  );
}
