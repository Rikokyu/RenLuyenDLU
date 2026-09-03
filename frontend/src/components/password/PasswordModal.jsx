import { useState } from "react";

export default function PasswordModal({ open, onClose }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!open) return null;

  function submit(e) {
    e.preventDefault();
    // Chỉ kiểm tra frontend ở giai đoạn này.
    if (!oldPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) return;
    onClose();
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="password-modal" onClick={onClose}>
      <section
        className="password-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="passwordHeading"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="password-dialog__header">
          <h2 id="passwordHeading">ĐỔI MẬT KHẨU</h2>
          <button className="password-dialog__close" type="button" onClick={onClose}>
            <img src="/icons/close.svg" alt="Đóng" />
          </button>
        </div>

        <form className="password-form" onSubmit={submit}>
          <div className="password-field">
            <input
              type="password"
              placeholder=" "
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
            <label>Mật khẩu cũ</label>
            <p className="password-field__error">Mật khẩu cũ là bắt buộc</p>
          </div>

          <div className="password-field">
            <input
              type="password"
              placeholder=" "
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <label>Mật khẩu mới</label>
            <p className="password-field__error">Mật khẩu mới là bắt buộc</p>
          </div>

          <div className="password-field">
            <input
              type="password"
              placeholder=" "
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <label>Nhập lại mật khẩu mới</label>
            <p className="password-field__error">Vui lòng nhập lại mật khẩu mới</p>
          </div>

          <button className="password-submit" type="submit">
            Đổi mật khẩu
          </button>
        </form>
      </section>
    </div>
  );
}
