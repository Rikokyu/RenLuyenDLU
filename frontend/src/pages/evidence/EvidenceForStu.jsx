import React, { useEffect, useRef, useState } from 'react';
import { evidenceApi } from '../../services/evidenceService';
import { useCurrentUser } from '../../hooks/useAuth';
import DetailForStu from './DetailForStu';
import SubmitEvidence from './SubmitEvidence';
import './EvidenceStu.css';
import { parseFilterDate } from '../../utils/parseFilterDate';
import StudentDateInput from './StudentDateInput';
import { formatDate } from '../../utils/formatDate';

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
  const statuses = ['Chờ phê duyệt', 'Đã phê duyệt', 'Đã từ chối', 'Cần bổ sung'];

  async function loadEvidence(filters, sort) {
    const version = ++requestVersion.current;
    setLoading(true);
    setEvidenceList([]);
    setError('');
    try {
      const result = await evidenceApi.getStudentEvidences({ user_id: userId, ...filters, sort_by: sort.by, sort_order: sort.order });
      if (version !== requestVersion.current) return;
      setEvidenceList(result.data.map(item => ({ ...item, status: statuses[item.statusCode] || 'Không xác định' })));
      setStats(result.stats);
    } catch (err) {
      if (version === requestVersion.current) setError(err.response?.data?.message || 'Không thể tải minh chứng. Vui lòng thử lại.');
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
    const from = parseFilterDate(fromDate);
    const to = parseFilterDate(toDate);
    if (from === null || to === null) {
      setError('Vui lòng nhập ngày hợp lệ theo định dạng dd/mm/yyyy.');
      return;
    }
    if (from && to && from > to) {
      setError('Ngày bắt đầu không được sau ngày kết thúc.');
      return;
    }
    const sort = applySort ? { by: sortBy, order: sortOrder } : appliedSort;
    if (applySort) setAppliedSort(sort);
    const filters = { search: searchQuery.trim(), from_date: from, to_date: to };
    if (status !== '') filters.status = status;
    setAppliedFilters(filters);
    loadEvidence(filters, sort);
  }

  function handleSubmitSuccess() {
    // Reload danh sach sau khi nop thanh cong
    loadEvidence(appliedFilters, appliedSort);
  }

  function handleReset() {
    const sort = { by: 'score', order: 'asc' };
    setSearchQuery('');
    setFromDate('');
    setToDate('');
    setSortBy(sort.by);
    setSortOrder(sort.order);
    setAppliedFilters({});
    setAppliedSort(sort);
    loadEvidence({}, sort);
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
          NỘP MINH CHỨNG VÀ PHÊ DUYỆT MINH CHỨNG DA THAM GIA
        </h1>
        <p className="text-small header-subtitle">
          Ghi nhận minh chứng hình ảnh và phê duyệt điểm rèn luyện
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
              aria-label="Tên hoặc mã hoạt động"
              placeholder="Tìm kiếm theo tên hoặc mã hoạt động"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="filter-label">Ngày</span>
            <StudentDateInput
              label="Từ ngày nộp"
              value={fromDate}
              onChange={setFromDate}
            />
            <span className="filter-label">đến</span>
            <StudentDateInput
              label="Đến ngày nộp"
              value={toDate}
              onChange={setToDate}
            />
          </div>

          <div className="filter-row-bottom">
            <button className="btn-stu btn-white font-bold" disabled={loading} onClick={() => handleSearch()}>Tìm</button>
            <button className="btn-stu btn-white font-bold" disabled={loading} onClick={handleReset}>Đặt lại</button>
            <button className="btn-stu btn-white font-bold" disabled={loading} onClick={() => handleSearch(true)}>Sắp xếp</button>

            <div className="btn-group-toggle">
              <button className={`btn-toggle ${sortOrder === 'asc' ? 'active' : ''}`} onClick={() => setSortOrder('asc')}>Tăng</button>
              <button className={`btn-toggle ${sortOrder === 'desc' ? 'active' : ''}`} onClick={() => setSortOrder('desc')}>Giảm</button>
            </div>

            <div className="radio-group font-bold">
              <label className="radio-item">
                <input type="radio" name="sortBy" value="score" checked={sortBy === 'score'} onChange={() => setSortBy('score')} />
                <span>Điểm</span>
              </label>
              <label className="radio-item">
                <input type="radio" name="sortBy" value="date" checked={sortBy === 'date'} onChange={() => setSortBy('date')} />
                <span>Ngày</span>
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
          + Nộp minh chứng
        </button>
      </div>

      {error && <p role="alert" className="student-evidence-error">{error}</p>}
      {loading && <p role="status">Đang tải minh chứng...</p>}

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
                <th>Sinh viên</th>
                <th>Hoạt động</th>
                <th>Ngày nộp</th>
                <th>Minh chứng</th>
                <th>Điểm</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {evidenceList.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center' }}>
                    {loading ? 'Đang tải...' : 'Không có minh chứng phù hợp'}
                  </td>
                </tr>
              ) : (
                evidenceList.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`row-stu-clickable ${index % 2 === 0 ? 'row-stu-gray' : 'row-stu-white'}`}
                    onClick={() => setSelectedEvidence(item)}
                    title="Bấm để xem chi tiết minh chứng"
                  >
                    <td>{item.studentName}</td>
                    <td>{item.event}<br /><small>{item.activityCode}</small></td>
                    <td>{formatDate(item.submitDate) || '—'}</td>
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
          onCancelled={() => {
            setSelectedEvidence(null);
            loadEvidence(appliedFilters, appliedSort);
          }}
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
