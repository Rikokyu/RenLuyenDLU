import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProfile, updateProfile } from "../../services/authService";
import { getSession, setSession } from "../../store/authStore";
import "./Profile.css";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    let active = true;
    getProfile()
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Không thể tải hồ sơ và lịch sử.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <p className="page-error" role="alert">{error}</p>;
  }
  if (!profile) {
    return <p className="page-loading">Đang tải hồ sơ...</p>;
  }

  const { user, activities } = profile;
  const isStudent =
    Boolean(user.studentId) &&
    (user.role === "STUDENT" || user.role === "CLASS_OFFICER");
  const canEditProfile =
    user.role === "HOMEROOM_TEACHER" ||
    user.role === "STUDENT_AFFAIRS_ASSISTANT";
  const displayTitle =
    isStudent && user.studentId
      ? `${user.name} - ${user.studentId}`
      : user.name;

  return (
    <section className="profile-page" aria-labelledby="profile-heading">
      <div className="profile-hero">
        <div className="profile-hero__identity">
          <div className="profile-avatar">
            <img src="/images/RenLuyenDLULogo.png" alt="" />
          </div>
          <div className="profile-hero__copy">
            <span className="profile-kicker">
              {isStudent ? "Cổng sinh viên cá nhân" : user.roleLabel}
            </span>
            <h1 id="profile-heading">{displayTitle}</h1>
            <p>
              {isStudent ? (
                <>
                  Lớp: <strong>{user.classCode || "Chưa phân lớp"}</strong>
                  <span className="profile-separator">•</span>
                  Khoa: <strong>{user.faculty || "Chưa cập nhật"}</strong>
                </>
              ) : (
                <strong>{user.subtitle}</strong>
              )}
            </p>
          </div>
        </div>

        {isStudent && (
          <div className="profile-score" aria-label="Điểm rèn luyện">
            <span className="profile-score__label">Điểm rèn luyện hiện tại</span>
            <strong>
              {profile.trainingScore}
              <small>/100</small>
            </strong>
            <span className="profile-score__rank">{profile.trainingRank}</span>
          </div>
        )}

        <div className="profile-actions">
          <Link className="profile-button profile-button--blue" to="/activities">
            <span aria-hidden="true">＋</span>
            Đăng ký thêm hoạt động
          </Link>
        </div>
      </div>

      <section className="profile-account" aria-labelledby="profile-account-heading">
        <div className="profile-account__heading">
          <div>
            <p className="section-eyebrow">Tài khoản của bạn</p>
            <h2 id="profile-account-heading">Thông tin cá nhân</h2>
          </div>
          {canEditProfile && !isEditing && (
            <button
              className="profile-edit-button"
              type="button"
              onClick={() => {
                setForm({
                  firstName: user.firstName || "",
                  lastName: user.lastName || "",
                  gender: user.gender || "",
                  birthDay: user.birthDay || "",
                  birthPlace: user.birthPlace || "",
                  phone: user.phone || "",
                });
                setFormError("");
                setNotice("");
                setIsEditing(true);
              }}
            >
              Chỉnh sửa thông tin
            </button>
          )}
        </div>

        {notice && <p className="profile-feedback is-success" role="status">{notice}</p>}
        {formError && <p className="profile-feedback is-error" role="alert">{formError}</p>}

        {canEditProfile && isEditing ? (
          <form
            className="profile-account__form"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(true);
              setFormError("");
              setNotice("");
              try {
                const result = await updateProfile(form);
                setProfile(result);
                const session = getSession();
                if (session) setSession({ ...session, user: result.user });
                setIsEditing(false);
                setNotice("Đã cập nhật thông tin cá nhân.");
              } catch (requestError) {
                setFormError(
                  requestError.response?.data?.message ||
                    "Không thể cập nhật thông tin. Vui lòng thử lại.",
                );
              } finally {
                setSaving(false);
              }
            }}
          >
            <label>
              Họ
              <input
                value={form?.firstName || ""}
                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                required
              />
            </label>
            <label>
              Tên
              <input
                value={form?.lastName || ""}
                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                required
              />
            </label>
            <label>
              Giới tính
              <select
                value={form?.gender || ""}
                onChange={(event) => setForm({ ...form, gender: event.target.value })}
                required
              >
                <option value="">Chọn giới tính</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </label>
            <label>
              Ngày sinh
              <input
                type="date"
                value={form?.birthDay || ""}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(event) => setForm({ ...form, birthDay: event.target.value })}
                required
              />
            </label>
            <label>
              Số điện thoại
              <input
                type="tel"
                value={form?.phone || ""}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                required
              />
            </label>
            <label>
              Nơi sinh
              <input
                value={form?.birthPlace || ""}
                onChange={(event) => setForm({ ...form, birthPlace: event.target.value })}
              />
            </label>
            <p className="profile-account__hint">
              Email, mã sinh viên và vai trò đăng nhập không thể tự đổi tại đây.
              Bạn có thể đổi mật khẩu từ biểu tượng tài khoản trên thanh đầu trang.
            </p>
            <div className="profile-account__actions">
              <button
                className="profile-edit-button is-secondary"
                type="button"
                disabled={saving}
                onClick={() => {
                  setIsEditing(false);
                  setFormError("");
                  setForm(null);
                }}
              >
                Hủy
              </button>
              <button className="profile-edit-button" type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        ) : (
          <dl className="profile-account__details">
            <div><dt>Tên đăng nhập</dt><dd>{user.username || "Chưa cập nhật"}</dd></div>
            <div><dt>Email</dt><dd>{user.email || "Chưa cập nhật"}</dd></div>
            <div><dt>Họ và tên</dt><dd>{user.name || "Chưa cập nhật"}</dd></div>
            <div><dt>Giới tính</dt><dd>{user.gender || "Chưa cập nhật"}</dd></div>
            <div><dt>Ngày sinh</dt><dd>{formatBirthDay(user.birthDay)}</dd></div>
            <div><dt>Số điện thoại</dt><dd>{user.phone || "Chưa cập nhật"}</dd></div>
            <div><dt>Nơi sinh</dt><dd>{user.birthPlace || "Chưa cập nhật"}</dd></div>
            <div><dt>Vai trò</dt><dd>{user.roleLabel || user.role}</dd></div>
          </dl>
        )}
      </section>

      <div className="profile-content">
        <div className="profile-section-heading">
          <div>
            <p className="section-eyebrow">Theo dõi tiến trình</p>
            <h2>Lịch sử hoạt động & minh chứng của bạn</h2>
          </div>
          <span className="activity-total">
            Tổng số: <strong>{activities.length} hoạt động</strong>
          </span>
        </div>

        {activities.length ? (
          <div className="activity-list">
            {activities.map((activity, index) => (
              <article
                className="activity-item"
                key={`${activity.title}-${activity.registeredAt}-${index}`}
              >
                <div className="activity-item__marker" aria-hidden="true">
                  <img src="/icons/list.svg" alt="" />
                </div>
                <div className="activity-item__details">
                  <div className="activity-item__title-row">
                    <h3>{activity.title}</h3>
                    <span
                      className={`activity-status${activity.evidenceStatus === "Chờ duyệt" ? " is-pending" : ""}`}
                    >
                      {activity.evidenceStatus}
                    </span>
                  </div>
                  <p>
                    {activity.category}
                    <span>•</span>
                    Ngày tham gia: {activity.registeredAt}
                    <span>•</span>
                    Điểm thưởng: <strong>+{activity.score}đ</strong>
                  </p>
                </div>
                <div className="activity-item__actions">
                  {getEvidenceAction(activity)}
                  <span
                    className={`registration-state${activity.registrationStatus !== "Đã đăng ký" ? " is-cancelled" : ""}`}
                  >
                    {activity.registrationStatus}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="profile-empty">
            {isStudent
              ? "Tài khoản này chưa có lịch sử đăng ký hoạt động."
              : "Hồ sơ này chưa có lịch sử tham gia hoạt động."}
          </p>
        )}
      </div>
    </section>
  );
}

function getEvidenceAction(activity) {
  if (activity.registrationStatus !== "Đã đăng ký") {
    return <span className="evidence-action-hint">Đăng ký đã hủy</span>;
  }
  const start = new Date(activity.timeBegin).getTime();
  const now = Date.now();
  if (!Number.isFinite(start) || now < start) {
    return <span className="evidence-action-hint">Chưa đến ngày mở hoạt động</span>;
  }
  const end = new Date(activity.timeEnd).getTime();
  if (Number.isFinite(end) && now >= end && activity.evidenceStatus === "Chưa nộp") {
    return <span className="evidence-action-hint">Chưa nộp minh chứng</span>;
  }
  const mode = Number.isFinite(end) && now >= end ? "view" : "submit";
  return (
    <Link
      className="evidence-button"
      to={`/evidence?activityId=${encodeURIComponent(activity.activityId)}&action=${mode}`}
    >
      {mode === "view" ? "Xem minh chứng" : "Nộp minh chứng"}
    </Link>
  );
}

function formatBirthDay(value) {
  if (!value) return "Chưa cập nhật";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN").format(date);
}
