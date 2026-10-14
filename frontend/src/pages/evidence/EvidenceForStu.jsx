import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SubmitEvidence from "./SubmitEvidence";
import DetailForStu from "./DetailForStu";
import { getProfile } from "../../services/authService";
import { evidenceApi } from "../../services/evidenceService";
import { getCurrentUser } from "../../store/authStore";
import "./EvidenceStu.css";

export default function EvidenceForStu() {
  const user = getCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionActivity, setSubmissionActivity] = useState(null);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const activities = profile?.activities || [];

  const loadProfile = useCallback(async () => {
    setLoadError("");
    try {
      setProfile(await getProfile());
    } catch (error) {
      setLoadError(error.response?.data?.message || "Không thể tải minh chứng cá nhân.");
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const activityId = Number(params.get("activityId"));
    const action = params.get("action");
    if (!activityId || !action || !activities.length) return;
    const activity = activities.find((item) => Number(item.activityId) === activityId);
    if (!activity) {
      setNotice("Không tìm thấy hoạt động trong lịch sử đăng ký của bạn.");
    } else if (activity.registrationStatus !== "Đã đăng ký") {
      setNotice("Bạn không thể thao tác minh chứng vì đăng ký hoạt động đã bị hủy.");
    } else {
      const now = Date.now();
      const start = new Date(activity.timeBegin).getTime();
      const end = new Date(activity.timeEnd).getTime();
      if (action === "submit") {
        if (!Number.isFinite(start) || now < start) {
          setNotice("Chưa đến thời gian bắt đầu hoạt động nên chưa thể nộp minh chứng.");
        } else if (Number.isFinite(end) && now >= end) {
          setNotice("Hoạt động đã kết thúc. Bạn chỉ có thể xem minh chứng.");
        } else {
          setSubmissionActivity(activity);
          setShowSubmitModal(true);
          setNotice("");
        }
      } else if (action === "view") {
        if (!Number.isFinite(end) || now < end) {
          setNotice("Chỉ có thể xem minh chứng sau khi hoạt động kết thúc.");
        } else if (activity.evidenceStatus === "Chưa nộp") {
          setNotice("Hoạt động đã kết thúc nhưng bạn chưa nộp minh chứng.");
        } else {
          evidenceApi.getStudentEvidence(activityId)
            .then((evidence) => {
              setSelectedEvidence(
                toEvidenceDetails(activity, profile.user, user, evidence?.data),
              );
            })
            .catch((error) => {
              setNotice(error.response?.data?.message || "Không thể tải minh chứng.");
            });
          setNotice("");
        }
      }
    }
    navigate("/evidence", { replace: true });
  }, [
    activities,
    location.search,
    navigate,
    profile?.user,
    user?.id,
    user?.name,
    user?.studentId,
  ]);

  const filteredActivities = useMemo(() => {
    const normalized = searchQuery.trim().toLocaleLowerCase("vi");
    if (!normalized) return activities;
    return activities.filter((activity) =>
      `${activity.title} ${activity.activityCode}`.toLocaleLowerCase("vi").includes(normalized),
    );
  }, [activities, searchQuery]);

  const totalCount = activities.length;
  const pendingCount = activities.filter((item) => item.evidenceStatus === "Chờ duyệt").length;
  const approvedCount = activities.filter((item) => item.evidenceStatus === "Đã duyệt").length;
  const rejectedCount = activities.filter((item) => item.evidenceStatus === "Đã từ chối").length;

  async function submitSelectedEvidence(data) {
    try {
      await evidenceApi.submit(submissionActivity.activityId, data);
      setNotice("Đã nộp minh chứng thành công.");
      await loadProfile();
    } catch (error) {
      throw new Error(error.response?.data?.message || "Không thể nộp minh chứng.");
    }
  }

  return (
    <div className="evidence-stu-container">
      <div className="header-card-stu">
        <h1 className="text-large font-bold">MINH CHỨNG HOẠT ĐỘNG CỦA BẠN</h1>
        <p className="text-small header-subtitle">
          Chỉ nộp minh chứng trong thời gian hoạt động diễn ra; chỉ xem sau khi hoạt động kết thúc.
        </p>
        <div className="stats-grid-stu">
          <div className="stat-card-stu"><span className="stat-title">Tổng hoạt động</span><span className="stat-num">{totalCount}</span></div>
          <div className="stat-card-stu"><span className="stat-title">Chờ phê duyệt</span><span className="stat-num">{pendingCount}</span></div>
          <div className="stat-card-stu"><span className="stat-title">Đã duyệt</span><span className="stat-num">{approvedCount}</span></div>
          <div className="stat-card-stu"><span className="stat-title">Đã từ chối</span><span className="stat-num">{rejectedCount}</span></div>
        </div>
        <div className="filter-bar-stu">
          <input
            type="search"
            className="input-stu filter-input-search"
            placeholder="Tìm theo tên hoặc mã hoạt động"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </div>

      {loadError && <p role="alert" className="evidence-page-message is-error">{loadError}</p>}
      {notice && <p role="status" className="evidence-page-message">{notice}</p>}

      <div className="table-container-stu">
        <table className="table-stu">
          <thead>
            <tr><th>Hoạt động</th><th>Thời gian</th><th>Minh chứng</th><th>Trạng thái</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            {filteredActivities.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: "40px" }}>Chưa có hoạt động phù hợp.</td></tr>
            ) : filteredActivities.map((activity, index) => {
              const start = new Date(activity.timeBegin).getTime();
              const end = new Date(activity.timeEnd).getTime();
              const now = Date.now();
              const isActiveRegistration = activity.registrationStatus === "Đã đăng ký";
              const canSubmit = isActiveRegistration && Number.isFinite(start) && now >= start &&
                (!Number.isFinite(end) || now < end);
              const canView = isActiveRegistration && Number.isFinite(end) && now >= end &&
                activity.evidenceStatus !== "Chưa nộp";
              return (
                <tr key={`${activity.activityId}-${index}`} className={index % 2 ? "row-stu-white" : "row-stu-gray"}>
                  <td>{activity.title}</td>
                  <td>{formatDate(activity.timeBegin)} – {formatDate(activity.timeEnd)}</td>
                  <td>{activity.evidenceStatus}</td>
                  <td>{activity.registrationStatus}</td>
                  <td>
                    {canSubmit ? (
                      <button type="button" className="evidence-row-action" onClick={() => {
                        setSubmissionActivity(activity);
                        setShowSubmitModal(true);
                      }}>Nộp minh chứng</button>
                    ) : canView ? (
                      <button type="button" className="evidence-row-action" onClick={() => {
                        evidenceApi.getStudentEvidence(activity.activityId)
                          .then((evidence) => {
                            setSelectedEvidence(
                              toEvidenceDetails(activity, profile?.user, user, evidence?.data),
                            );
                          })
                          .catch((error) => {
                            setNotice(error.response?.data?.message || "Không thể tải minh chứng.");
                          });
                      }}>Xem minh chứng</button>
                    ) : !isActiveRegistration ? (
                      <span>Đăng ký đã hủy</span>
                    ) : Number.isFinite(start) && now < start ? (
                      <span>Chưa đến ngày mở</span>
                    ) : Number.isFinite(end) && now >= end ? (
                      <span>Chưa nộp minh chứng</span>
                    ) : (
                      <span>Chưa thể thao tác</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showSubmitModal && submissionActivity && (
        <SubmitEvidence
          activity={submissionActivity}
          onClose={() => setShowSubmitModal(false)}
          onSubmitSuccess={submitSelectedEvidence}
        />
      )}
      {selectedEvidence && (
        <DetailForStu
          data={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
        />
      )}
    </div>
  );
}

function toEvidenceDetails(activity, profileUser, currentUser, evidenceData) {
  return {
    id: activity.activityId,
    studentName: profileUser?.name || currentUser?.name || "Sinh viên",
    studentId: profileUser?.studentId || currentUser?.studentId || "",
    facultyClass: [profileUser?.faculty, profileUser?.classCode].filter(Boolean).join(" - "),
    event: activity.title,
    status: activity.evidenceStatus,
    proofName: "Minh chứng đã nộp",
    proofData: evidenceData || "",
    score: activity.score,
    description: `Mã hoạt động: ${activity.activityCode}`,
  };
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa xác định";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
