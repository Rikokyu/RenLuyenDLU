import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser } from "../../store/authStore";
import {
  createActivity,
  deleteActivity,
  getActivityErrorMessage,
  getActivities,
  getActivityImage,
  uploadActivityImage,
  updateActivity,
} from "../../services/activityService";
import "./ActivityList.css";

const statusOptions = [
  "Tất cả trạng thái",
  "Đang mở đăng ký",
  "Đang diễn ra",
  "Đã đủ chỗ",
];

const activityManagerRoles = [
  "ADMIN",
  "STUDENT_AFFAIRS_ASSISTANT",
  "HOMEROOM_TEACHER",
];
const activityManagerAllRoles = ["ADMIN", "STUDENT_AFFAIRS_ASSISTANT"];

const emptyForm = {
  activityCode: "",
  title: "",
  timeBegin: "",
  timeEnd: "",
  slot: "",
  detail: "",
  score: "0",
  location: "",
};

export default function ActivityList() {
  const user = getCurrentUser();
  const canManageActivities = activityManagerRoles.includes(user?.role);
  const canManageAllActivities = activityManagerAllRoles.includes(user?.role);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(statusOptions[0]);
  const [activities, setActivities] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingActivity, setEditingActivity] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadActivities = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const result = await getActivities({ search, signal });
      setActivities(result.items);
      setTotal(result.total);
    } catch (requestError) {
      if (requestError.name !== "AbortError" && requestError.code !== "ERR_CANCELED") {
        setError(getActivityErrorMessage(requestError));
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => loadActivities(controller.signal), search.trim() ? 250 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadActivities, refreshKey, search]);

  const filteredActivities = useMemo(
    () => activities.filter((activity) => {
      const activityStatus = getActivityStatus(activity).label;
      return activityStatus !== "Đã kết thúc" &&
        (status === statusOptions[0] || activityStatus === status);
    }),
    [activities, status],
  );

  function startCreate() {
    setEditingActivity(null);
    setIsFormOpen(true);
    setForm(emptyForm);
    setImageFile(null);
    setFormError("");
    setToast("");
  }

  function startEdit(activity) {
    setEditingActivity(activity);
    setIsFormOpen(true);
    setForm({
      activityCode: activity.activityCode || "",
      title: activity.title || "",
      timeBegin: toDateTimeLocal(activity.timeBegin),
      timeEnd: toDateTimeLocal(activity.timeEnd),
      slot: String(activity.slot ?? ""),
      detail: activity.detail || "",
      score: String(activity.score ?? 0),
      location: activity.location || "",
    });
    setImageFile(null);
    setFormError("");
    setToast("");
  }

  async function submitActivity(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (imageFile && imageFile.size > 5 * 1024 * 1024) {
        setFormError("Ảnh minh họa không được vượt quá 5 MB.");
        return;
      }
      if (imageFile && imageFile.type &&
          !["image/jpeg", "image/png", "image/gif", "image/webp"].includes(imageFile.type)) {
        setFormError("Chỉ chấp nhận ảnh JPEG, PNG, GIF hoặc WebP.");
        return;
      }
      const timeBegin = new Date(form.timeBegin);
      const timeEnd = new Date(form.timeEnd);
      if (
        Number.isNaN(timeBegin.getTime()) ||
        Number.isNaN(timeEnd.getTime()) ||
        timeEnd <= timeBegin
      ) {
        setFormError("Thời gian kết thúc phải sau thời gian bắt đầu.");
        return;
      }
      const payload = {
        ...(editingActivity ? { activityCode: form.activityCode.trim() } : {}),
        title: form.title.trim(),
        detail: form.detail.trim(),
        timeBegin: timeBegin.toISOString(),
        timeEnd: timeEnd.toISOString(),
        slot: Number(form.slot),
        score: Number(form.score),
        location: form.location.trim(),
      };
      let savedActivity;
      if (editingActivity) {
        const result = await updateActivity(editingActivity.id, payload);
        savedActivity = result?.data;
      } else {
        const result = await createActivity(payload);
        savedActivity = result?.data;
      }
      const savedActivityId = editingActivity?.id || savedActivity?.id;
      let imageUploadError = imageFile && !savedActivityId
        ? "Không nhận được mã hoạt động sau khi lưu."
        : "";
      if (imageFile && savedActivityId) {
        try {
          await uploadActivityImage(savedActivityId, imageFile);
        } catch (uploadError) {
          imageUploadError = getActivityErrorMessage(uploadError);
        }
      }
      setEditingActivity(null);
      setIsFormOpen(false);
      setImageFile(null);
      setRefreshKey((key) => key + 1);
      setToast(imageUploadError
        ? `Đã lưu hoạt động nhưng tải ảnh lên MinIO thất bại: ${imageUploadError}`
        : editingActivity
          ? "Đã cập nhật hoạt động."
          : "Đã đăng hoạt động mới.");
    } catch (requestError) {
      setFormError(getActivityErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function removeActivity(activity) {
    if (!window.confirm(`Ngừng hoạt động "${activity.title}"?`)) return;
    setError("");
    try {
      await deleteActivity(activity.id);
      setToast("Đã ngừng hoạt động; dữ liệu đăng ký được giữ lại.");
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(getActivityErrorMessage(requestError));
    }
  }

  return (
    <section className="activities-page" aria-labelledby="activities-heading">
      {toast && <div className="activities-toast" role="status">{toast}</div>}
      <header className="activities-header">
        <div className="activities-heading-group">
          <div className="activities-heading-icon" aria-hidden="true">▦</div>
          <div>
            <h1 id="activities-heading">
              {canManageActivities
                ? "Quản lý danh sách hoạt động"
                : "Danh sách hoạt động rèn luyện"}
            </h1>
            <p>{canManageActivities
              ? "Tạo và quản lý hoạt động; dữ liệu được lưu trên hệ thống"
              : "Tìm hiểu và đăng ký tham gia các hoạt động rèn luyện của trường"}
            </p>
          </div>
        </div>
        {canManageActivities && (
          <button className="create-activity-button" type="button" onClick={startCreate}>
            <span aria-hidden="true">＋</span>
            Tạo hoạt động mới
          </button>
        )}
      </header>

      <div className="activities-toolbar">
        <label className="activity-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm tên HĐ, mã HĐ, địa điểm..."
            aria-label="Tìm hoạt động"
          />
        </label>
        <label className="activity-filter">
          <span className="visually-hidden">Trạng thái</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {statusOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <div className="activities-view-switch" aria-label="Chuyển chế độ hiển thị">
          <button
            type="button"
            className={viewMode === "list" ? "view-toggle is-active" : "view-toggle"}
            onClick={() => setViewMode("list")}
            aria-label="Hiển thị dạng danh sách"
          >
            <span aria-hidden="true">☰</span>
          </button>
          <button
            type="button"
            className={viewMode === "grid" ? "view-toggle is-active" : "view-toggle"}
            onClick={() => setViewMode("grid")}
            aria-label="Hiển thị dạng lưới"
          >
            <span aria-hidden="true">▦</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="activities-feedback activities-error" role="alert">
          <span>Không tải được danh sách hoạt động: {error}</span>
          <button type="button" onClick={() => setRefreshKey((key) => key + 1)}>Thử lại</button>
        </div>
      )}
      {!error && !loading && (
        <p className="activities-result-count">
          Hiển thị {filteredActivities.length} / {total} hoạt động
        </p>
      )}

      {viewMode === "list" ? (
        <div className="activities-table-wrap">
          <table className="activities-table">
            <thead>
              <tr>
                <th>Mã HĐ</th>
                <th>Tên hoạt động & mô tả</th>
                <th>Đơn vị tổ chức</th>
                <th>Thời gian & địa điểm</th>
                <th>Điểm</th>
                <th>Đăng ký</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="activities-table-message" colSpan="8">Đang tải hoạt động...</td></tr>
              ) : filteredActivities.map((activity) => {
                const activityStatus = getActivityStatus(activity);
                return (
                  <tr key={activity.id}>
                    <td>
                      <Link className="activity-code" to={`/activities/${activity.id}`}>
                        {activity.activityCode}
                      </Link>
                    </td>
                    <td>
                      <Link className="activity-name" to={`/activities/${activity.id}`}>{activity.title}</Link>
                      <span className="activity-subtext">{activity.detail || "Chưa có mô tả"}</span>
                    </td>
                    <td><span className="activity-cell-truncate">{activity.organizer || "Chưa cập nhật"}</span></td>
                    <td>
                      <span className="activity-date">{formatDate(activity.timeBegin)}</span>
                      <span className="activity-subtext">{activity.location || "Chưa cập nhật địa điểm"}</span>
                    </td>
                    <td><strong className="activity-score">{activity.score}đ</strong></td>
                    <td><strong className="activity-registered">{activity.registeredCount}/{activity.slot}</strong></td>
                    <td><span className={`activity-status ${activityStatus.className}`}>{activityStatus.label}</span></td>
                    <td>
                      <div className={`activity-row-actions${canManageThisActivity(activity, user, canManageAllActivities) ? " is-teacher" : ""}`}>
                        <Link
                          to={`/activities/${activity.id}`}
                          className="view-activity"
                          aria-label={`Xem ${activity.title}`}
                          title="Xem chi tiết"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </Link>
                        {canManageThisActivity(activity, user, canManageAllActivities) && (
                          <>
                            <button
                              type="button"
                              className="activity-action-button"
                              onClick={() => startEdit(activity)}
                              aria-label={`Sửa ${activity.title}`}
                              title="Sửa hoạt động"
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="m14 5 5 5M4 20l4.2-.8L20 7.4 16.6 4 4.8 15.8 4 20Z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="activity-action-button is-danger"
                              onClick={() => removeActivity(activity)}
                              aria-label={`Ngừng ${activity.title}`}
                              title="Ngừng hoạt động"
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9" />
                                <path d="m5.6 5.6 12.8 12.8" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && !error && filteredActivities.length === 0 && (
            <p className="activities-empty">Không tìm thấy hoạt động phù hợp.</p>
          )}
        </div>
      ) : (
        <div className="activities-grid">
          {loading ? (
            <p className="activities-empty">Đang tải hoạt động...</p>
          ) : filteredActivities.map((activity) => {
            const activityStatus = getActivityStatus(activity);
            return (
              <article className="activity-card" key={activity.id}>
                <div className="activity-card__image" aria-label={activity.title} />
                <div className={`activity-card__badge ${activityStatus.className}`}>{activityStatus.label}</div>
                <div className="activity-card__score">{activity.score}đ</div>
                <div className="activity-card__body">
                  <h3>{activity.title}</h3>
                  <p>{activity.detail || "Chưa có mô tả"}</p>
                  <div className="activity-card__meta">
                    <span>{formatDate(activity.timeBegin)} – {formatDate(activity.timeEnd)}</span>
                    <span>{activity.location || "Chưa cập nhật địa điểm"}</span>
                  </div>
                  <div className="activity-card__footer">
                    <span>{activity.registeredCount}/{activity.slot} đăng ký</span>
                    <div className="activity-card__actions">
                      <Link to={`/activities/${activity.id}`}>Chi tiết</Link>
                      {canManageThisActivity(activity, user, canManageAllActivities) && (
                        <>
                          <button type="button" onClick={() => startEdit(activity)}>Sửa</button>
                          <button
                            className="is-danger"
                            type="button"
                            onClick={() => removeActivity(activity)}
                          >
                            Ngừng
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
          {!loading && !error && filteredActivities.length === 0 && (
            <p className="activities-empty">Không tìm thấy hoạt động phù hợp.</p>
          )}
        </div>
      )}

      {canManageActivities && isFormOpen && (
        <ActivityForm
          activity={editingActivity}
          form={form}
          setForm={setForm}
          imageFile={imageFile}
          setImageFile={setImageFile}
          error={formError}
          saving={saving}
          onSubmit={submitActivity}
          onClose={() => {
            setEditingActivity(null);
            setIsFormOpen(false);
            setForm(emptyForm);
            setImageFile(null);
            setFormError("");
          }}
        />
      )}
    </section>
  );
}

function ActivityForm({
  activity,
  form,
  setForm,
  imageFile,
  setImageFile,
  error,
  saving,
  onSubmit,
  onClose,
}) {
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState("");

  useEffect(() => {
    if (!imageFile) {
      setSelectedImageUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setSelectedImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if (!activity?.id) {
      setExistingImageUrl("");
      return undefined;
    }
    const controller = new AbortController();
    let objectUrl = "";
    getActivityImage(activity.id, { signal: controller.signal })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setExistingImageUrl(objectUrl);
      })
      .catch((requestError) => {
        if (requestError.response?.status !== 404 &&
            requestError.name !== "AbortError" &&
            requestError.code !== "ERR_CANCELED") {
          setExistingImageUrl("");
        }
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [activity?.id]);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  return (
    <div className="activity-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="activity-modal" role="dialog" aria-modal="true" aria-labelledby="activity-form-heading">
        <div className="activity-modal__header">
          <h2 id="activity-form-heading">{activity ? "Cập nhật hoạt động" : "Tạo hoạt động mới"}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng">×</button>
        </div>
        <form className="activity-form" onSubmit={onSubmit}>
          <label>
            Mã hoạt động
            <input value={activity ? form.activityCode : "Tự động cấp theo thứ tự"} readOnly />
          </label>
          <label>Tên hoạt động<input name="title" value={form.title} onChange={updateField} required /></label>
          <div className="activity-form__row">
            <label>Bắt đầu<input name="timeBegin" type="datetime-local" value={form.timeBegin} onChange={updateField} required /></label>
            <label>Kết thúc<input name="timeEnd" type="datetime-local" value={form.timeEnd} onChange={updateField} required /></label>
          </div>
          <div className="activity-form__row">
            <label>Số chỗ<input name="slot" type="number" min="1" value={form.slot} onChange={updateField} required /></label>
            <label>Điểm<input name="score" type="number" min="0" value={form.score} onChange={updateField} required /></label>
          </div>
          <label>Địa điểm<input name="location" value={form.location} onChange={updateField} required maxLength="300" placeholder="Ví dụ: Hội trường A, cơ sở 1" /></label>
          <label>Mô tả<textarea name="detail" value={form.detail} onChange={updateField} rows="3" /></label>
          <label className="activity-image-upload">
            Chọn ảnh tải lên MinIO
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={(event) => setImageFile(event.target.files?.[0] || null)}
            />
            <small>JPEG, PNG, GIF hoặc WebP; tối đa 5 MB.</small>
          </label>
          {(selectedImageUrl || existingImageUrl) && (
            <div className="activity-image-preview">
              <img src={selectedImageUrl || existingImageUrl} alt="Ảnh minh họa hoạt động" />
              {imageFile && <span>Ảnh đã chọn</span>}
            </div>
          )}
          <p className="activity-form__hint">
            Người tạo được xác định tự động từ tài khoản đang đăng nhập. Mã hoạt động được cấp tự động theo thứ tự.
          </p>
          {error && <p className="activity-form__error" role="alert">{error}</p>}
          <div className="activity-form__actions">
            <button type="button" onClick={onClose}>Hủy</button>
            <button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu hoạt động"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function getActivityStatus(activity) {
  const now = Date.now();
  const start = new Date(activity.timeBegin).getTime();
  const end = new Date(activity.timeEnd).getTime();
  if (Number(activity.status) === 0) return { label: "Đã ngừng", className: "is-ended" };
  if (end <= now) return { label: "Đã kết thúc", className: "is-ended" };
  if (start <= now) return { label: "Đang diễn ra", className: "is-open" };
  if (Number(activity.registeredCount) >= Number(activity.slot)) {
    return { label: "Đã đủ chỗ", className: "is-ended" };
  }
  return { label: "Đang mở đăng ký", className: "is-registering" };
}

function canManageThisActivity(activity, user, canManageAllActivities) {
  return canManageAllActivities ||
    (user?.role === "HOMEROOM_TEACHER" && Number(activity.userId) === Number(user.id));
}

function formatDate(value) {
  if (!value) return "Chưa xác định";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa xác định";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
