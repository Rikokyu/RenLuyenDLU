import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../services/apiClient';
import { API_BASE_URL } from '../../services/apiConfig';
import DetailForLec from './DetailForLec';
import './Evidence.css';

const EVIDENCE_API_URL = `${API_BASE_URL}/evidences`;

const formatDate = (value) => {
  if (!value) return '—';
  const datePart = String(value).slice(0, 10);
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '—';
};

const toApiDate = (value) => {
  const match = String(value).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return null;
  return `${year}-${month}-${day}`;
};

const toDisplayDate = (value) => {
  if (!value) return '';
  const [year, month, day] = String(value).slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : '';
};

export default function Evidence() {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const fromDatePickerRef = useRef(null);
  const toDatePickerRef = useRef(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedMajorId, setSelectedMajorId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [faculties, setFaculties] = useState([]);
  const [majors, setMajors] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedProof, setSelectedProof] = useState(null);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [isApproving, setIsApproving] = useState(false);
  const [updatingEvidenceId, setUpdatingEvidenceId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [appliedSort, setAppliedSort] = useState({ by: 'name', direction: 'asc' });

  // State thống kê từ API Backend
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  // 1. Hàm ánh xạ dữ liệu an toàn từ Backend sang Frontend
const mapBackendToFrontend = (item) => {
  if (!item) return null;

  // Lấy các object con an toàn (hỗ trợ cả chữ hoa và chữ thường)
  const registration = item.registration || item.Registration || {};
  const student = registration.student || registration.Student || {};
  const user = student.user || student.User || {};
  const classObj = student.class || student.Class || {};
  const majorObj = classObj.major || classObj.Major || {};
  const facultyObj = majorObj.faculty || majorObj.Faculty || {};
  const classYears = classObj.class_years || classObj.ClassYears || [];
  const currentClassYear = classYears[0] || {};
  const schoolYear = currentClassYear.school_year || currentClassYear.Year || currentClassYear.SchoolYear || {};
  const activity = registration.activity || registration.Activity || {};

  // Đọc Họ và Tên
  const firstName = user.first_name || user.FirstName || '';
  const lastName = user.last_name || user.LastName || '';
  const fullName = student.full_name || `${firstName} ${lastName}`.trim() || 'Sinh viên';

  // Mã sinh viên
  const studentCode = student.student_code || student.StudentCode || student.studentcode || 'Chưa cập nhật';

  // Tên Khoa & Lớp
  const facultyName = facultyObj.name || facultyObj.Name || '';
  const className = classObj.name || classObj.Name || '';
  const facultyClass = (facultyName && className)
    ? `${facultyName} - ${className}`
    : (facultyName || className || 'Chưa cập nhật');

  // Trạng thái minh chứng
  let statusText = 'Chờ phê duyệt';
  if (item.status === 1) statusText = 'Đã phê duyệt';
  if (item.status === 2) statusText = 'Đã từ chối';

  return {
    id: item.id,
    name: fullName,
    lastName: lastName || student.last_name || student.LastName || '',
    studentId: studentCode,
    facultyClass: facultyClass,
    major: majorObj.name || majorObj.Name || '',
    academicYear: schoolYear.year || schoolYear.Year || '',
    semester: schoolYear.semester ?? schoolYear.Semester,
    event: activity.title || activity.Title || 'Không có tên',
    proof: item.data ? 'Minh chứng đã tải lên' : 'Chưa nộp',
    proofUrl: item.data,
    submittedAt: formatDate(registration.registered_at || registration.RegisteredAt),
    submittedAtValue: String(registration.registered_at || registration.RegisteredAt || '').slice(0, 10),
    score: activity.score ?? activity.Score ?? 0,
    status: statusText,
  };
};

  // 2. Gọi API lấy Thống kê 4 ô
  const fetchStats = async () => {
    try {
      const res = await apiClient.get(`${EVIDENCE_API_URL}/stats`);
      if (res.data?.status === 'success') {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi lấy thống kê:', err);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const res = await apiClient.get(`${EVIDENCE_API_URL}/filters`);
      if (res.data?.status === 'success') {
        setFaculties(res.data.data.faculties || []);
        setMajors(res.data.data.majors || []);
        setClasses(res.data.data.classes || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách khoa, chuyên ngành và lớp:', err);
    }
  };

  // 3. Gọi API lấy Danh sách Minh chứng
  const fetchEvidences = async (filters = {}) => {
  try {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.fromDate) params.from_date = filters.fromDate;
    if (filters.toDate) params.to_date = filters.toDate;
    if (filters.status !== undefined) params.status = filters.status;
    if (filters.facultyId) params.faculty_id = filters.facultyId;
    if (filters.majorId) params.major_id = filters.majorId;
    if (filters.classId) params.class_id = filters.classId;

    const res = await apiClient.get(EVIDENCE_API_URL, { params });
    console.log("Dữ liệu gốc từ Backend:", res.data.data);

    if (res.data && res.data.data) {
      const rawList = Array.isArray(res.data.data) ? res.data.data : [];
      const mappedList = rawList.map(mapBackendToFrontend).filter(Boolean);

      console.log("Dữ liệu sau khi ép kiểu thành công:", mappedList);
      setData(mappedList);
    }
  } catch (err) {
    console.error('Lỗi khi tải danh sách minh chứng:', err);
  }
};

  const handleSearch = () => {
    const normalizedFromDate = fromDate ? toApiDate(fromDate) : '';
    const normalizedToDate = toDate ? toApiDate(toDate) : '';
    if ((fromDate && !normalizedFromDate) || (toDate && !normalizedToDate)) {
      setActionMessage('Nhập ngày theo định dạng dd/MM/yyyy, ví dụ 09/09/2026.');
      return;
    }
    if (normalizedFromDate && normalizedToDate && normalizedFromDate > normalizedToDate) {
      setActionMessage('Ngày bắt đầu không được sau ngày kết thúc.');
      return;
    }
    const filters = {
      search: searchQuery.trim(),
      fromDate: normalizedFromDate,
      toDate: normalizedToDate,
      facultyId: selectedFacultyId,
      majorId: selectedMajorId,
      classId: selectedClassId,
    };
    if (selectedStatus !== '') filters.status = Number(selectedStatus);
    setAppliedFilters(filters);
    fetchEvidences(filters);
  };

  const openDatePicker = (pickerRef) => {
    const picker = pickerRef.current;
    if (!picker) return;
    if (typeof picker.showPicker === 'function') picker.showPicker();
    else picker.click();
  };

  const handlePickedDate = (value, setDate) => {
    if (value) setDate(toDisplayDate(value));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setFromDate('');
    setToDate('');
    setSelectedFacultyId('');
    setSelectedMajorId('');
    setSelectedClassId('');
    setAppliedFilters({});
    fetchEvidences({});
  };

  const handleStatsClick = (status) => {
    const filters = { ...appliedFilters };
    if (status === null) {
      delete filters.status;
    } else {
      filters.status = status;
    }
    setAppliedFilters(filters);
    setSelectedStatus(status === null ? '' : String(status));
    setSearchQuery(filters.search || '');
    setFromDate(toDisplayDate(filters.fromDate));
    setToDate(toDisplayDate(filters.toDate));
    setSelectedFacultyId(filters.facultyId || '');
    setSelectedMajorId(filters.majorId || '');
    setSelectedClassId(filters.classId || '');
    fetchEvidences(filters);
  };

  useEffect(() => {
    fetchStats();
    fetchEvidences({});
    fetchFilterOptions();
  }, []);

  const availableMajors = majors.filter((major) =>
    !selectedFacultyId || String(major.id_faculty ?? major.IdFaculty) === selectedFacultyId
  );
  const availableClasses = classes.filter((classItem) => {
    const classMajorID = classItem.id_major ?? classItem.IdMajor;
    if (selectedMajorId) return String(classMajorID) === selectedMajorId;
    if (selectedFacultyId) {
      const classMajor = majors.find((major) => String(major.id ?? major.ID) === String(classMajorID));
      return String(classMajor?.id_faculty ?? classMajor?.IdFaculty) === selectedFacultyId;
    }
    return true;
  });

  // Thống kê lấy trực tiếp từ Backend API
  const totalCount = stats.total;
  const pendingCount = stats.pending;
  const approvedCount = stats.approved;
  const rejectedCount = stats.rejected;

  // Lọc dữ liệu hiển thị
  const filteredData = [...data].sort((a, b) => {
    let comparison = 0;
    if (appliedSort.by === 'name') {
      comparison = (a.lastName || a.name).localeCompare(b.lastName || b.name, 'vi', { sensitivity: 'base' });
      if (comparison === 0) comparison = a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
    }
    if (appliedSort.by === 'date') comparison = a.submittedAtValue.localeCompare(b.submittedAtValue);
    if (appliedSort.by === 'score') comparison = Number(a.score) - Number(b.score);
    return appliedSort.direction === 'asc' ? comparison : -comparison;
  });

  // Hàm gọi API cập nhật trạng thái
  const updateStatusApi = async (evidenceId, newStatus) => {
    if (updatingEvidenceId !== null) return;

    setUpdatingEvidenceId(evidenceId);
    setActionMessage('');
    try {
      const response = await apiClient.put(`${EVIDENCE_API_URL}/status`, {
        evidence_id: evidenceId,
        status: newStatus,
      });
      await Promise.all([fetchStats(), fetchEvidences(appliedFilters)]);
      setActionMessage(response.data?.message || (newStatus === 1
        ? 'Đã duyệt minh chứng và lưu trạng thái.'
        : 'Đã hủy minh chứng và lưu trạng thái.'));
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái:', err);
      setActionMessage(err.response?.data?.message || 'Không thể lưu trạng thái minh chứng. Vui lòng thử lại.');
    } finally {
      setUpdatingEvidenceId(null);
    }
  };

  // Nút "Duyệt" ở màn hình chính
  const handleQuickApprove = async () => {
    if (data.length === 0 || isApproving) return;

    setIsApproving(true);
    setActionMessage('');
    try {
      const response = await apiClient.put(`${EVIDENCE_API_URL}/approve`, {
        evidence_ids: data.map((item) => item.id),
      });
      await Promise.all([fetchStats(), fetchEvidences(appliedFilters)]);
      setActionMessage(`Đã duyệt ${response.data?.data?.updated_count ?? data.length} minh chứng đang hiển thị.`);
    } catch (err) {
      console.error('Lỗi duyệt danh sách minh chứng:', err);
      setActionMessage(err.response?.data?.message || 'Không thể duyệt danh sách minh chứng.');
    } finally {
      setIsApproving(false);
    }
  };

  // Duyệt trong DetailForLec
  const handleDetailApprove = (id) => {
    const item = data.find((i) => i.id === id);
    if (item) {
      updateStatusApi(item.id, 1);
    }
    setSelectedProof(null);
  };

  // Hủy trong DetailForLec
  const handleDetailReject = (id) => {
    const item = data.find((i) => i.id === id);
    if (item) {
      updateStatusApi(item.id, 2);
    }
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
          <button
            type="button"
            className={`stat-box ${appliedFilters.status == null ? 'stat-box-selected' : ''}`}
            aria-pressed={appliedFilters.status == null}
            onClick={() => handleStatsClick(null)}
          >
            <span className="text-small text-black font-bold">Tất cả minh chứng</span>
            <span className="text-large text-black font-bold">{totalCount}</span>
          </button>
          <button
            type="button"
            className={`stat-box ${appliedFilters.status === 0 ? 'stat-box-selected' : ''}`}
            aria-pressed={appliedFilters.status === 0}
            onClick={() => handleStatsClick(0)}
          >
            <span className="text-small text-orange font-bold">Chờ phê duyệt</span>
            <span className="text-large text-black font-bold">{pendingCount}</span>
          </button>
          <button
            type="button"
            className={`stat-box ${appliedFilters.status === 1 ? 'stat-box-selected' : ''}`}
            aria-pressed={appliedFilters.status === 1}
            onClick={() => handleStatsClick(1)}
          >
            <span className="text-small text-green font-bold">Đã phê duyệt</span>
            <span className="text-large text-black font-bold">{approvedCount}</span>
          </button>
          <button
            type="button"
            className={`stat-box ${appliedFilters.status === 2 ? 'stat-box-selected' : ''}`}
            aria-pressed={appliedFilters.status === 2}
            onClick={() => handleStatsClick(2)}
          >
            <span className="text-small text-red font-bold">Đã từ chối</span>
            <span className="text-large text-black font-bold">{rejectedCount}</span>
          </button>
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
            <select
              className="input-custom select-faculty"
              value={selectedFacultyId}
              onChange={(e) => {
                setSelectedFacultyId(e.target.value);
                setSelectedMajorId('');
                setSelectedClassId('');
              }}
            >
              <option value="">Tất cả khoa</option>
              {faculties.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>{faculty.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-row">
            <div className="filter-actions">
              <button className="btn-custom btn-white-bg text-black font-bold" onClick={handleSearch}>
                Tìm
              </button>
              <button className="btn-custom btn-reset-filter font-bold" onClick={handleResetFilters}>
                Đặt lại
              </button>
            </div>

            {/* Thay thế button Trạng thái bằng Combobox (Select) */}
            <select
              className="input-custom select-status font-bold"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Trạng thái</option>
              <option value="0">Chờ phê duyệt</option>
              <option value="1">Đã phê duyệt</option>
              <option value="2">Đã từ chối</option>
            </select>

            <div className="date-picker-group text-small text-white">
              <span>Từ ngày</span>
              <input
                type="text"
                inputMode="numeric"
                className="input-custom date-input"
                placeholder="dd/MM/yyyy"
                aria-label="Từ ngày (dd/MM/yyyy)"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <span className="date-picker-control">
                <button type="button" className="date-picker-button" aria-label="Chọn ngày bắt đầu" onClick={() => openDatePicker(fromDatePickerRef)}>▦</button>
                <input ref={fromDatePickerRef} className="date-picker-native" type="date" value={toApiDate(fromDate) || ''} onChange={(e) => handlePickedDate(e.target.value, setFromDate)} tabIndex={-1} aria-hidden="true" />
              </span>
              <span>Đến ngày</span>
              <input
                type="text"
                inputMode="numeric"
                className="input-custom date-input"
                placeholder="dd/MM/yyyy"
                aria-label="Đến ngày (dd/MM/yyyy)"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
              <span className="date-picker-control">
                <button type="button" className="date-picker-button" aria-label="Chọn ngày kết thúc" onClick={() => openDatePicker(toDatePickerRef)}>▦</button>
                <input ref={toDatePickerRef} className="date-picker-native" type="date" value={toApiDate(toDate) || ''} onChange={(e) => handlePickedDate(e.target.value, setToDate)} tabIndex={-1} aria-hidden="true" />
              </span>
            </div>

            <select
              className="input-custom select-major"
              value={selectedMajorId}
              onChange={(e) => {
                setSelectedMajorId(e.target.value);
                setSelectedClassId('');
              }}
            >
              <option value="">Tất cả chuyên ngành</option>
              {availableMajors.map((major) => (
                <option key={major.id} value={major.id}>{major.name}</option>
              ))}
            </select>

            <select
              className="input-custom select-class"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="">Tất cả lớp</option>
              {availableClasses.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>{classItem.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Nút Duyệt trực tiếp không bật giao diện */}
      <div className="action-row">
        <button
          className="btn-custom btn-green btn-white-text"
          onClick={handleQuickApprove}
          disabled={isApproving || data.length === 0}
          aria-busy={isApproving}
        >
          {isApproving ? 'Đang duyệt...' : 'Duyệt toàn bộ danh sách'}
        </button>
        <div className="sort-controls" role="group" aria-label="Sắp xếp danh sách minh chứng">
          <button type="button" className="sort-apply-button" onClick={() => setAppliedSort({ by: sortBy, direction: sortDirection })}>Sắp xếp</button>
          <div className="sort-direction" role="group" aria-label="Thứ tự sắp xếp">
            <button type="button" className={`sort-direction-button ${sortDirection === 'asc' ? 'active' : ''}`} aria-pressed={sortDirection === 'asc'} onClick={() => setSortDirection('asc')}>Tăng</button>
            <button type="button" className={`sort-direction-button ${sortDirection === 'desc' ? 'active' : ''}`} aria-pressed={sortDirection === 'desc'} onClick={() => setSortDirection('desc')}>Giảm</button>
          </div>
          <div className="sort-fields" role="group" aria-label="Tiêu chí sắp xếp">
            {[['name', 'Tên'], ['score', 'Điểm'], ['date', 'Ngày']].map(([value, label]) => (
              <button key={value} type="button" className={`sort-field ${sortBy === value ? 'selected' : ''}`} aria-pressed={sortBy === value} onClick={() => setSortBy(value)}>
                <span className="sort-radio" aria-hidden="true" />{label}
              </button>
            ))}
          </div>
        </div>
        {actionMessage && <span className="action-message" role="status">{actionMessage}</span>}
      </div>

      {/* Bảng Danh Sách Minh Chứng */}
      <div className="table-wrapper">
        <table className="evidence-table">
          <thead>
            <tr>
              <th className="text-large">Sinh viên</th>
              <th className="text-large">Hoạt động</th>
              <th className="text-large">Minh chứng</th>
              <th className="text-large">Ngày nộp</th>
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
                <td className="text-small">{item.submittedAt}</td>
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
