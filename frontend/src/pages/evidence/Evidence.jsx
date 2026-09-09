import React, { useMemo, useState } from "react";
import "./Evidence.css";

const initialEvidence = [
  {
    id: 1,
    student: "Nguyễn Văn An",
    activity: "Tham gia hoạt động tình nguyện",
    evidence: "minh-chung-01.jpg",
    score: 10,
    status: "Đã phê duyệt",
    className: "K15A",
  },
  {
    id: 2,
    student: "Trần Thị Bình",
    activity: "Hoạt động CLB",
    evidence: "minh-chung-02.jpg",
    score: 8,
    status: "Chờ phê duyệt",
    className: "K15B",
  },
  {
    id: 3,
    student: "Lê Minh Tuấn",
    activity: "Cuộc thi học thuật",
    evidence: "minh-chung-03.jpg",
    score: 9,
    status: "Đã phê duyệt",
    className: "K16A",
  },
];

function EvidenceManagement() {
  const [evidenceList, setEvidenceList] = useState(initialEvidence);

  const [keyword, setKeyword] = useState("");
  const [classFilter, setClassFilter] = useState("Tất cả khóa - lớp");

  const [showModal, setShowModal] = useState(false);

  const [newEvidence, setNewEvidence] = useState({
    student: "",
    activity: "",
    evidence: "",
    score: "",
    className: "",
  });

  const statistics = useMemo(() => {
    return {
      total: evidenceList.length,
      pending: evidenceList.filter(
        (item) => item.status === "Chờ phê duyệt"
      ).length,
      approved: evidenceList.filter(
        (item) => item.status === "Đã phê duyệt"
      ).length,
      rejected: evidenceList.filter(
        (item) => item.status === "Đã từ chối"
      ).length,
      supplement: evidenceList.filter(
        (item) => item.status === "Cần bổ sung"
      ).length,
    };
  }, [evidenceList]);

  const filteredEvidence = useMemo(() => {
    return evidenceList.filter((item) => {
      const searchValue = keyword.toLowerCase().trim();

      const matchesKeyword =
        item.student.toLowerCase().includes(searchValue) ||
        item.activity.toLowerCase().includes(searchValue);

      const matchesClass =
        classFilter === "Tất cả khóa - lớp" ||
        item.className === classFilter;

      return matchesKeyword && matchesClass;
    });
  }, [evidenceList, keyword, classFilter]);

  const handleAddEvidence = (e) => {
    e.preventDefault();

    if (
      !newEvidence.student ||
      !newEvidence.activity ||
      !newEvidence.className
    ) {
      return;
    }

    const evidence = {
      id: Date.now(),
      student: newEvidence.student,
      activity: newEvidence.activity,
      evidence: newEvidence.evidence || "Chưa có minh chứng",
      score: newEvidence.score || 0,
      status: "Chờ phê duyệt",
      className: newEvidence.className,
    };

    setEvidenceList((prev) => [...prev, evidence]);

    setNewEvidence({
      student: "",
      activity: "",
      evidence: "",
      score: "",
      className: "",
    });

    setShowModal(false);
  };

  const handleApprove = (id) => {
    setEvidenceList((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: "Đã phê duyệt" }
          : item
      )
    );
  };

  const handleReject = (id) => {
    setEvidenceList((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: "Đã từ chối" }
          : item
      )
    );
  };

  return (
    <div className="evidence-page">

      {/* ================= HEADER ================= */}
      <section className="evidence-header">
        <div>
          <h1>NỘP MINH CHỨNG VÀ PHÊ DUYỆT MINH CHỨNG ĐÃ THAM GIA</h1>
          <p>
            Ghi nhận minh chứng hình ảnh và phê duyệt điểm rèn luyện
          </p>
        </div>

        {/* ================= STATISTICS ================= */}
        <div className="statistics">
          <StatCard
            title="Tất cả minh chứng"
            value={statistics.total}
            type="all"
          />

          <StatCard
            title="Chờ phê duyệt"
            value={statistics.pending}
            type="pending"
          />

          <StatCard
            title="Đã phê duyệt"
            value={statistics.approved}
            type="approved"
          />

          <StatCard
            title="Đã từ chối"
            value={statistics.rejected}
            type="rejected"
          />

          <StatCard
            title="Cần bổ sung"
            value={statistics.supplement}
            type="supplement"
          />
        </div>

        {/* ================= SEARCH ================= */}
        <div className="filter-area">

          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc mã hoạt động"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option>Tất cả khóa - lớp</option>
            <option>K15A</option>
            <option>K15B</option>
            <option>K16A</option>
          </select>

          <button className="search-button">
            Tìm
          </button>

        </div>
      </section>

      {/* ================= ADD BUTTON ================= */}
      <div className="action-area">
        <button
          className="add-button"
          onClick={() => setShowModal(true)}
        >
          <span>+</span>
          Nộp minh chứng
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <section className="table-container">

        <table className="evidence-table">

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
            {filteredEvidence.length > 0 ? (
              filteredEvidence.map((item) => (
                <tr key={item.id}>

                  <td>
                    <div className="student-info">
                      <strong>{item.student}</strong>
                      <span>{item.className}</span>
                    </div>
                  </td>

                  <td>{item.activity}</td>

                  <td>
                    <button className="evidence-button">
                      Xem minh chứng
                    </button>
                  </td>

                  <td>
                    <span className="score">
                      {item.score}
                    </span>
                  </td>

                  <td>
                    <div className="status-wrapper">

                      <span
                        className={`status ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>

                      {item.status === "Chờ phê duyệt" && (
                        <div className="status-actions">
                          <button
                            className="approve-btn"
                            onClick={() =>
                              handleApprove(item.id)
                            }
                          >
                            ✓
                          </button>

                          <button
                            className="reject-btn"
                            onClick={() =>
                              handleReject(item.id)
                            }
                          >
                            ×
                          </button>
                        </div>
                      )}

                    </div>
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="empty-state"
                >
                  Không tìm thấy minh chứng phù hợp
                </td>
              </tr>
            )}
          </tbody>

        </table>

      </section>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">
              <h2>Nộp minh chứng</h2>

              <button
                className="close-button"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddEvidence}>

              <div className="form-group">
                <label>Sinh viên</label>
                <input
                  type="text"
                  placeholder="Nhập tên sinh viên"
                  value={newEvidence.student}
                  onChange={(e) =>
                    setNewEvidence({
                      ...newEvidence,
                      student: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Hoạt động</label>
                <input
                  type="text"
                  placeholder="Nhập tên hoạt động"
                  value={newEvidence.activity}
                  onChange={(e) =>
                    setNewEvidence({
                      ...newEvidence,
                      activity: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Khóa - lớp</label>

                <select
                  value={newEvidence.className}
                  onChange={(e) =>
                    setNewEvidence({
                      ...newEvidence,
                      className: e.target.value,
                    })
                  }
                >
                  <option value="">
                    Chọn khóa - lớp
                  </option>
                  <option value="K15A">K15A</option>
                  <option value="K15B">K15B</option>
                  <option value="K16A">K16A</option>
                </select>

              </div>

              <div className="form-group">
                <label>Điểm</label>

                <input
                  type="number"
                  min="0"
                  max="10"
                  placeholder="Nhập điểm"
                  value={newEvidence.score}
                  onChange={(e) =>
                    setNewEvidence({
                      ...newEvidence,
                      score: e.target.value,
                    })
                  }
                />

              </div>

              <div className="form-group">
                <label>Minh chứng</label>

                <input
                  type="text"
                  placeholder="Tên hoặc đường dẫn minh chứng"
                  value={newEvidence.evidence}
                  onChange={(e) =>
                    setNewEvidence({
                      ...newEvidence,
                      evidence: e.target.value,
                    })
                  }
                />

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="submit-button"
                >
                  Nộp minh chứng
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

function StatCard({ title, value, type }) {
  return (
    <div className={`stat-card ${type}`}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getStatusClass(status) {
  switch (status) {
    case "Đã phê duyệt":
      return "approved";

    case "Chờ phê duyệt":
      return "pending";

    case "Đã từ chối":
      return "rejected";

    case "Cần bổ sung":
      return "supplement";

    default:
      return "";
  }
}

export default EvidenceManagement;