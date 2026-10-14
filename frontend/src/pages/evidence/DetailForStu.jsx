import React, { useEffect, useState } from "react";
import { evidenceApi } from "../../services/evidenceService";
import { getAuthToken } from "../../store/authStore";

const STATUS_LABELS = {
  0: "Cho phe duyet",
  1: "Da phe duyet",
  2: "Da tu choi",
  3: "Can bo sung",
};
const STATUS_COLORS = {
  0: "#ff6a38",
  1: "#00a859",
  2: "#ff0000",
  3: "#a855f7",
};

export default function DetailForStu({ data, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imgSrc, setImgSrc] = useState(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const evidenceId = data?.id;

  // Load chi tiet tu API
  useEffect(() => {
    if (!evidenceId) {
      setDetail(data);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    evidenceApi
      .getStudentEvidenceDetail(evidenceId)
      .then((d) => { if (!cancelled) setDetail(d); })
      .catch((err) => {
        if (!cancelled)
          setError(err.response?.data?.message || "Khong the tai chi tiet minh chung.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [evidenceId]);

  // Load anh minh chung (can Bearer token, dung fetch manual)
  useEffect(() => {
    if (!evidenceId) return;
    // Chi load khi co anh
    let objectUrl = null;
    let cancelled = false;
    setImgSrc(null);
    setImgLoading(true);
    setImgError(false);
    const fileUrl = evidenceApi.getEvidenceFileUrl(evidenceId);
    const token = getAuthToken();
    fetch(fileUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => {
        if (!res.ok) throw new Error("no_file");
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setImgSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setImgError(true);
      })
      .finally(() => { if (!cancelled) setImgLoading(false); });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [evidenceId]);

  const item = detail || data || {};
  const statusCode = item.statusCode ?? item.status ?? 0;
  const statusLabel = STATUS_LABELS[statusCode] || "Khong xac dinh";
  const statusColor = STATUS_COLORS[statusCode] || "#888";

  return (
    <div className="modal-overlay-stu" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content-stu detail-modal">
        {/* Header */}
        <div className="modal-title-bar">
          <h2 className="text-large font-bold">Chi Tiet Minh Chung</h2>
          <button className="btn-modal-close" onClick={onClose} title="Dong">&#x2715;</button>
        </div>

        {error && <p role="alert" className="student-evidence-error">{error}</p>}
        {loading && <p role="status" style={{ textAlign: "center", padding: "20px" }}>Dang tai chi tiet...</p>}

        {!loading && (
          <>
            {/* Khung 1: Thong tin Sinh vien */}
            <div className="detail-box-border">
              <p className="detail-section-title">Thong tin Sinh vien</p>
              <div className="info-row-stu">
                <span className="info-label-stu">Ho ten:</span>
                <div className="pill-placeholder">{item.studentName || "—"}</div>
              </div>
              <div className="info-row-stu">
                <span className="info-label-stu">Ma so SV:</span>
                <div className="pill-placeholder">{item.studentId || item.student_code || "—"}</div>
              </div>
              <div className="info-row-stu">
                <span className="info-label-stu">Lop:</span>
                <div className="pill-placeholder">{item.facultyClass || "—"}</div>
              </div>
            </div>

            {/* Khung 2: Thong tin Hoat dong */}
            <div className="detail-box-border">
              <p className="detail-section-title">Hoat dong</p>
              <h3 className="text-large font-bold">{item.event || item.title || "—"}</h3>
              {item.activityCode && (
                <p style={{ color: "#555", fontSize: "14px" }}>Ma: {item.activityCode}</p>
              )}
              <div className="info-row-stu">
                <span className="info-label-stu">Diem RL:</span>
                <div className="pill-placeholder score-pill">{item.score ?? 0} diem</div>
              </div>
              <div className="info-row-stu">
                <span className="info-label-stu">Ngay nop:</span>
                <div className="pill-placeholder">{item.submitDate || item.submittedAt || "—"}</div>
              </div>
              {item.description && (
                <div className="info-row-stu">
                  <span className="info-label-stu">Mo ta:</span>
                  <div className="pill-placeholder" style={{ height: "auto", minHeight: "40px", padding: "10px 20px" }}>
                    {item.description}
                  </div>
                </div>
              )}
            </div>

            {/* Khung 3: Minh chung & Anh */}
            <div className="detail-box-border">
              <p className="detail-section-title">Minh Chung</p>
              <div className="info-row-stu">
                <span className="info-label-stu">Ten tep:</span>
                <div className="pill-placeholder">{item.proofName || item.proof_name || "—"}</div>
              </div>
              <div className="info-row-stu">
                <span className="info-label-stu">Trang thai:</span>
                <div className="pill-placeholder" style={{ color: statusColor, fontWeight: "bold" }}>
                  {statusLabel}
                </div>
              </div>

              {/* Hien thi anh */}
              <div className="evidence-image-box">
                {imgLoading && (
                  <div className="img-loading-placeholder">Dang tai anh minh chung...</div>
                )}
                {!imgLoading && imgError && (
                  <div className="img-loading-placeholder img-no-file">
                    Minh chung nay chua co anh dinh kem.
                  </div>
                )}
                {!imgLoading && imgSrc && (
                  <a href={imgSrc} target="_blank" rel="noopener noreferrer" title="Xem anh day du">
                    <img
                      src={imgSrc}
                      alt={`Minh chung: ${item.proofName || "anh minh chung"}`}
                      className="evidence-preview-img"
                    />
                  </a>
                )}
              </div>
            </div>
          </>
        )}

        {/* Nut hanh dong */}
        <div className="modal-actions-right">
          <button className="btn-stu btn-orange" onClick={onClose}>Thoat</button>
          <button className="btn-stu btn-green" onClick={onClose}>Dong</button>
        </div>
      </div>
    </div>
  );
}
