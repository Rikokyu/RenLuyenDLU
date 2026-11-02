import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PasswordModal from "../password/PasswordModal";
import { clearSession } from "../../store/authStore";
import { getActivities } from "../../services/activityService";
import { getProfile } from "../../services/authService";
import { getDashboardOverview } from "../../services/dashboardService";
import { useCurrentUser } from "../../hooks/useAuth";

export default function Topbar({ title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useCurrentUser();

  const [theme, setTheme] = useState(
    localStorage.getItem("renluyen-theme") === "dark" ? "dark" : "light"
  );

  const [notifOpen, setNotifOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [profile, setProfile] = useState(null);
  const [managementOverview, setManagementOverview] = useState(null);
  const [notificationError, setNotificationError] = useState("");
  const [readNotificationIds, setReadNotificationIds] = useState(
    () => loadReadNotificationIds(user?.id),
  );
  const [passwordOpen, setPasswordOpen] = useState(false);
  const ref = useRef(null);

  const notifications = useMemo(
    () => buildNotifications(user, activities, profile, managementOverview),
    [activities, managementOverview, profile, user],
  );
  const unreadCount = notifications.filter(
    (notification) => !readNotificationIds.has(notification.id),
  ).length;

  const refreshNotifications = useCallback(async (signal) => {
    if (!user?.id) {
      setActivities([]);
      setProfile(null);
      setManagementOverview(null);
      setNotificationError("");
      return;
    }
    try {
      const requests = [getActivities({ signal })];
      if (user.studentId) requests.push(getProfile({ signal }));
      if (user.role === "STUDENT_AFFAIRS_ASSISTANT") {
        requests.push(getDashboardOverview({ signal }));
      }
      const results = await Promise.all(requests);
      if (signal?.aborted) return;
      setActivities(results[0].items);
      setProfile(user.studentId ? results[1] || null : null);
      setManagementOverview(
        user.role === "STUDENT_AFFAIRS_ASSISTANT"
          ? results[results.length - 1] || null
          : null,
      );
      setNotificationError("");
    } catch (requestError) {
      if (
        requestError.name !== "AbortError" &&
        requestError.code !== "ERR_CANCELED" &&
        !signal?.aborted
      ) {
        setNotificationError("Không thể tải thông báo từ hoạt động hiện tại.");
        setActivities([]);
        setProfile(null);
        setManagementOverview(null);
      }
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("renluyen-theme", theme);
  }, [theme]);

  useEffect(() => {
    const controller = new AbortController();
    refreshNotifications(controller.signal);
    const interval = window.setInterval(
      () => refreshNotifications(),
      60_000,
    );
    function handleActivityChange() {
      refreshNotifications();
    }
    window.addEventListener("renluyen-activities-changed", handleActivityChange);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("renluyen-activities-changed", handleActivityChange);
    };
  }, [refreshNotifications]);

  useEffect(() => {
    setReadNotificationIds(loadReadNotificationIds(user?.id));
  }, [user?.id]);

  useEffect(() => {
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setNotifOpen(false);
        setAccountOpen(false);
      }
    }

    function escape(e) {
      if (e.key === "Escape") {
        setNotifOpen(false);
        setAccountOpen(false);
        setPasswordOpen(false);
      }
    }

    document.addEventListener("click", close);
    document.addEventListener("keydown", escape);

    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  function toggleTheme() {
    setTheme((value) => (value === "dark" ? "light" : "dark"));
  }

  function markNotificationAsRead(id) {
    setReadNotificationIds((current) => {
      const next = new Set(current);
      next.add(id);
      saveReadNotificationIds(user?.id, next);
      return next;
    });
  }

  function markAllAsRead() {
    const next = new Set(notifications.map((notification) => notification.id));
    setReadNotificationIds(next);
    saveReadNotificationIds(user?.id, next);
  }

  function openNotification(notification) {
    markNotificationAsRead(notification.id);
    setNotifOpen(false);
    navigate(notification.to);
  }

  function logout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <header className="topbar">
        <h2 className="topbar__title">{title}</h2>

        <div className="topbar__actions" ref={ref}>
          <button
            className="icon-btn"
            type="button"
            aria-label={
              theme === "dark"
                ? "Chuyển giao diện sáng"
                : "Chuyển giao diện tối"
            }
            onClick={toggleTheme}
          >
            <img
              className="icon icon--header"
              src={theme === "dark" ? "/icons/light.svg" : "/icons/dark.svg"}
              alt=""
            />
          </button>

          <div className="popover-anchor">
            <button
              className="icon-btn"
              type="button"
              aria-label="Thông báo"
              onClick={(e) => {
                e.stopPropagation();
                setNotifOpen((value) => !value);
                setAccountOpen(false);
              }}
            >
              <img
                className="icon icon--header"
                src="/icons/notification.svg"
                alt=""
              />

              {unreadCount > 0 && <span className="unread-dot" />}
            </button>

            {notifOpen && (
              <div className="popover popover--notif">
                <div className="popover__header">
                  <div className="popover__heading">
                    <h3>Thông báo</h3>

                    {unreadCount > 0 && (
                      <span className="badge-new">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>

                  <button
                    className="mark-read"
                    type="button"
                    onClick={markAllAsRead}
                  >
                    Đánh dấu đã đọc
                    <img
                      className="icon icon--check"
                      src="/icons/check.svg"
                      alt=""
                    />
                  </button>
                </div>

                {notificationError && (
                  <p className="notif-error" role="alert">{notificationError}</p>
                )}
                <ul className="notif-list">
                  {notifications.length === 0 ? (
                    <li className="notif-empty">
                      {notificationError
                        ? "Thông báo chưa tải được."
                        : "Chưa có thông báo hoạt động mới."}
                    </li>
                  ) : notifications.map((notification) => {
                    const isUnread = !readNotificationIds.has(notification.id);

                    return (
                      <li
                        key={notification.id}
                        className="notif-list__entry"
                      >
                        <button
                          className={`notif-item${isUnread ? " is-unread" : ""}`}
                          type="button"
                          onClick={() => openNotification(notification)}
                        >
                          <strong>
                            {notification.title}
                            {isUnread && <span className="notif-new-dot" />}
                          </strong>
                          <span>{notification.message}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="popover-anchor">
            <button
              className="profile-badge"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAccountOpen((value) => !value);
                setNotifOpen(false);
              }}
            >
              <img
                className="profile-badge__avatar"
                src="/images/RenLuyenDLULogo.png"
                alt="Ảnh đại diện"
              />

              <span className="profile-badge__meta">
                <span className="profile-badge__name">
                  {user?.name || "Người dùng"}
                </span>
                <span className="profile-badge__sub">
                  {user?.subtitle || user?.roleLabel || ""}
                </span>
              </span>
            </button>

            {accountOpen && (
              <div className="popover popover--account">
                <button
                  className={`account-item${location.pathname === "/profile" ? " is-active" : ""}`}
                  type="button"
                  onClick={() => {
                    setAccountOpen(false);
                    navigate("/profile");
                  }}
                >
                  <img
                    className="icon"
                    src="/icons/profile.svg"
                    alt=""
                  />
                  <span>Hồ sơ cá nhân</span>
                </button>

                <button
                  className="account-item"
                  type="button"
                  onClick={() => {
                    setAccountOpen(false);
                    setPasswordOpen(true);
                  }}
                >
                  <img
                    className="icon"
                    src="/icons/change_pass.svg"
                    alt=""
                  />
                  <span>Đổi mật khẩu</span>
                </button>

                <button
                  className="logout-btn"
                  type="button"
                  onClick={logout}
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <PasswordModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
      />
    </>
  );
}

function loadReadNotificationIds(userId) {
  if (!userId) return new Set();
  try {
    const stored = JSON.parse(
      localStorage.getItem(`renluyen-read-notifications-${userId}`) || "[]",
    );
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set();
  }
}

function saveReadNotificationIds(userId, ids) {
  if (!userId) return;
  localStorage.setItem(
    `renluyen-read-notifications-${userId}`,
    JSON.stringify([...ids]),
  );
}

function buildNotifications(user, activities, profile, managementOverview) {
  if (!user) return [];
  const now = Date.now();
  const isStudent =
    Boolean(user.studentId) &&
    (user.role === "STUDENT" || user.role === "CLASS_OFFICER");
  const registeredById = new Map(
    (profile?.activities || [])
      .filter((activity) => activity.registrationStatus === "Đã đăng ký")
      .map((activity) => [Number(activity.activityId), activity]),
  );
  const notifications = [];

  for (const activity of activities) {
    const start = new Date(activity.timeBegin).getTime();
    const end = new Date(activity.timeEnd).getTime();
    const registered = registeredById.get(Number(activity.id));
    if (
      Number(activity.status) === 0 ||
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      end <= now
    ) {
      continue;
    }
    const isRunning = start <= now;
    if (isStudent && registered) {
      notifications.push({
        id: `registration-${activity.id}-${activity.timeBegin}-${isRunning ? "running" : "upcoming"}`,
        title: isRunning ? "Hoạt động bạn đã đăng ký đang diễn ra" : "Hoạt động bạn đã đăng ký sắp diễn ra",
        message: isRunning
          ? `${activity.title} đang diễn ra đến ${formatNotificationDate(activity.timeEnd)}.`
          : `${activity.title} bắt đầu ${formatNotificationDate(activity.timeBegin)}.`,
        to: `/activities/${activity.id}`,
        time: isRunning ? now : start,
      });
      continue;
    }
    const hasSpace = Number(activity.registeredCount) < Number(activity.slot);
    if (!isStudent || (!registered && (isRunning || hasSpace))) {
      notifications.push({
        id: `activity-${activity.id}-${activity.timeBegin}-${isRunning ? "running" : "upcoming"}`,
        title: isRunning ? "Hoạt động đang diễn ra" : "Hoạt động sắp diễn ra",
        message: `${activity.title} — ${isRunning ? "kết thúc" : "bắt đầu"} ${formatNotificationDate(isRunning ? activity.timeEnd : activity.timeBegin)}.`,
        to: `/activities/${activity.id}`,
        time: isRunning ? now : start,
      });
    }
  }

  if (user.role === "STUDENT_AFFAIRS_ASSISTANT") {
    for (const entry of managementOverview?.recentRegistrations || []) {
      notifications.push({
        id: `enrollment-${entry.studentId}-${entry.activityId}-${entry.registeredAt}`,
        title: "Sinh viên đăng ký hoạt động",
        message: `${entry.studentName} (${entry.studentId}) đã đăng ký ${entry.activity}.`,
        to: `/activities/${entry.activityId}`,
        time: new Date(entry.registeredAt).getTime() || now,
      });
    }
    for (const entry of managementOverview?.recentEvidence || []) {
      notifications.push({
        id: `evidence-${entry.studentId}-${entry.activityId}-${entry.submittedAt}`,
        title: "Sinh viên nộp minh chứng",
        message: `${entry.studentName} (${entry.studentId}) nộp minh chứng cho ${entry.activity}.`,
        to: "/evidence",
        time: new Date(entry.submittedAt).getTime() || now,
      });
    }
  }

  if (isStudent) {
    for (const activity of profile?.activities || []) {
      if (activity.evidenceStatus !== "Chờ duyệt" && activity.evidenceStatus !== "Đã từ chối") {
        continue;
      }
      const status = activity.evidenceStatus.toLowerCase();
      notifications.push({
        id: `evidence-${activity.activityId}-${activity.evidenceStatus}`,
        title: activity.evidenceStatus === "Chờ duyệt"
          ? "Minh chứng đang chờ duyệt"
          : "Minh chứng cần cập nhật",
        message: `Minh chứng cho hoạt động ${activity.title} hiện ${status}.`,
        to: "/evidence",
        time: Date.parse(activity.timeBegin) || now,
      });
    }
  }

  return notifications
    .sort((left, right) => left.time - right.time)
    .slice(0, 12);
}

function formatNotificationDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "chưa xác định thời gian";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
