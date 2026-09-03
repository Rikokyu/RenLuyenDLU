import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PasswordModal from "../password/PasswordModal";

const initialNotifications = [
  {
    id: 1,
    title: "Sự kiện sắp diễn ra",
    message: "Sự kiện tình nguyện cuối tuần sẽ bắt đầu vào 08:00.",
  },
  {
    id: 2,
    title: "Xác nhận tham gia",
    message: "Bạn đã được xác nhận tham gia hoạt động cấp khoa.",
  },
  {
    id: 3,
    title: "Cảnh báo điểm rèn luyện",
    message: "Điểm rèn luyện hiện tại đang thấp hơn mức khuyến nghị.",
  },
];

export default function Topbar({ title }) {
  const navigate = useNavigate();

  const [theme, setTheme] = useState(
    localStorage.getItem("renluyen-theme") === "dark" ? "dark" : "light"
  );

  const [notifOpen, setNotifOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [unreadIds, setUnreadIds] = useState(new Set([1, 2]));
  const [passwordOpen, setPasswordOpen] = useState(false);
  const ref = useRef(null);

  const unreadCount = unreadIds.size;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("renluyen-theme", theme);
  }, [theme]);

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
    setUnreadIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }

  function markAllAsRead() {
    setUnreadIds(new Set());
  }

  function logout() {
    sessionStorage.removeItem("renluyen-authenticated");
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

                <ul className="notif-list">
                  {initialNotifications.map((notification) => {
                    const isUnread = unreadIds.has(notification.id);

                    return (
                      <li
                        key={notification.id}
                        className={`notif-item${
                          isUnread ? " is-unread" : ""
                        }`}
                        onClick={() =>
                          isUnread &&
                          markNotificationAsRead(notification.id)
                        }
                      >
                        <strong>
                          {notification.title}
                          {isUnread && <span className="notif-new-dot" />}
                        </strong>

                        <span>{notification.message}</span>
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
                  Nguyễn Trung Hiệp
                </span>
                <span className="profile-badge__sub">
                  2312610 - CTK47A
                </span>
              </span>
            </button>

            {accountOpen && (
              <div className="popover popover--account">
                <button
                  className="account-item is-active"
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
