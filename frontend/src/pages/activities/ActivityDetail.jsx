import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getActivity,
  getActivityErrorMessage,
  getActivityImage,
  registerForActivity,
} from "../../services/activityService";
import { getCurrentUser } from "../../store/authStore";
import "./ActivityDetail.css";

export default function ActivityDetail() {
  const { id } = useParams();
  const user = getCurrentUser();
  const canRegister = user?.role === "STUDENT" || user?.role === "CLASS_OFFICER";
  const [activity, setActivity] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registering, setRegistering] = useState(false);
  const [notice, setNotice] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    getActivity(id, { signal: controller.signal })
      .then(setActivity)
      .catch((requestError) => {
        if (requestError.name !== "AbortError" && requestError.code !== "ERR_CANCELED") {
          setError(getActivityErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = "";
    setImageUrl("");
    setImageError("");
    getActivityImage(id, { signal: controller.signal })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      })
      .catch((requestError) => {
        if (requestError.name === "AbortError" || requestError.code === "ERR_CANCELED") return;
        if (requestError.response?.status !== 404) {
          setImageError("Không tải được ảnh minh họa hoạt động.");
        }
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  async function submitRegistration(event) {
    event.preventDefault();
    setRegistering(true);
    setError("");
    setNotice("");
    try {
      await registerForActivity(id);
      setNotice("Đăng ký hoạt động thành công.");
      setToast("Đăng ký hoạt động thành công.");
    } catch (requestError) {
      setError(getActivityErrorMessage(requestError));
    } finally {
      setRegistering(false);
    }
  }

  if (loading) {
    return <section className="activity-detail-page"><p>Đang tải thông tin hoạt động...</p></section>;
  }

  if (error && !activity) {
    return (
      <section className="activity-detail-page">
        <p className="activity-detail-error" role="alert">{error}</p>
        <Link to="/activities">← Quay lại danh sách</Link>
      </section>
    );
  }

  if (!activity) {
    return <section className="activity-detail-page"><p>Không tìm thấy hoạt động.</p></section>;
  }

  return (
    <section className="activity-detail-page">
      {toast && <div className="activity-detail-toast" role="status">{toast}</div>}
      <Link className="activity-detail-back" to="/activities">← Quay lại danh sách</Link>
      <div className="activity-detail-layout">
        <div className="activity-detail-image">
          {imageUrl ? (
            <img src={imageUrl} alt={`Ảnh hoạt động ${activity.title}`} />
          ) : (
            <div className="activity-detail-image__empty">
              <span aria-hidden="true">▧</span>
              <p>{imageError || "Chưa có ảnh minh họa"}</p>
            </div>
          )}
        </div>
        <article className="activity-detail-card">
          <header className="activity-detail-hero">
            <div className="activity-detail-hero__meta">
              <p className="activity-detail-code">{activity.activityCode}</p>
              <span className={`activity-detail-state${getActivityState(activity) === "Đang diễn ra" ? " is-running" : ""}`}>
                {getActivityState(activity)}
              </span>
            </div>
            <h1>{activity.title}</h1>
            <p className="activity-detail-description">{activity.detail || "Hoạt động chưa có mô tả."}</p>
          </header>
          <dl className="activity-detail-info">
            <div><dt>Đơn vị tổ chức</dt><dd>{activity.organizer || "Chưa cập nhật"}</dd></div>
            <div><dt>Bắt đầu</dt><dd>{formatDate(activity.timeBegin)}</dd></div>
            <div><dt>Kết thúc</dt><dd>{formatDate(activity.timeEnd)}</dd></div>
            <div><dt>Địa điểm</dt><dd>{activity.location || "Chưa cập nhật địa điểm"}</dd></div>
            <div><dt>Số chỗ</dt><dd>{activity.registeredCount}/{activity.slot} đã đăng ký</dd></div>
            <div><dt>Điểm</dt><dd>{activity.score}đ</dd></div>
          </dl>

          {canRegister && (
            <form className="activity-register-form" onSubmit={submitRegistration}>
              <h2>Đăng ký tham gia</h2>
              <p>Đăng ký bằng tài khoản sinh viên đang đăng nhập: {user.studentId || user.username}.</p>
              <div>
                <button type="submit" disabled={registering}>
                  {registering ? "Đang đăng ký..." : "Đăng ký hoạt động"}
                </button>
              </div>
              {notice && <p className="activity-detail-success" role="status">{notice}</p>}
              {error && <p className="activity-detail-error" role="alert">{error}</p>}
            </form>
          )}
        </article>
      </div>
    </section>
  );
}

function getActivityState(activity) {
  const now = Date.now();
  if (Number(activity.status) === 0) return "Đã ngừng";
  if (new Date(activity.timeEnd).getTime() <= now) return "Đã kết thúc";
  if (new Date(activity.timeBegin).getTime() <= now) return "Đang diễn ra";
  if (Number(activity.registeredCount) >= Number(activity.slot)) return "Đã đủ chỗ";
  return "Đang mở đăng ký";
}

function formatDate(value) {
  if (!value) return "Chưa xác định";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa xác định";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
