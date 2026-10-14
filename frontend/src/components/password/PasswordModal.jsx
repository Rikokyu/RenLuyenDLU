import { useState } from "react";
import { changePassword } from "../../services/authService";

export default function PasswordModal({ open, onClose }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);
    try {
      const result = await changePassword(oldPassword, newPassword);
      setSuccess(result.message);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Không thể đổi mật khẩu.",
      );
    } finally {
      setLoading(false);
    }
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
          <button
            className="password-dialog__close"
            type="button"
            onClick={onClose}
          >
            <img src="/icons/close.svg" alt="Đóng" />
          </button>
        </div>

        <form className="password-form" onSubmit={submit}>
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
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
              type={showPassword ? "text" : "password"}
              placeholder=" "
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
            <label>Mật khẩu mới</label>
            <p className="password-field__error">Mật khẩu mới là bắt buộc</p>
          </div>

          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder=" "
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <label>Nhập lại mật khẩu mới</label>
            <p className="password-field__error">
              Vui lòng nhập lại mật khẩu mới
            </p>
          </div>
          <label className="show-password">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
            />
            <span>Hiện mật khẩu</span>
          </label>

          {error && (
            <p className="password-form__message is-error" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="password-form__message is-success" role="status">
              {success}
            </p>
          )}

          <button className="password-submit" type="submit" disabled={loading}>
            {loading
              ? "Đang cập nhật..."
              : success
                ? "Đã đổi mật khẩu"
                : "Đổi mật khẩu"}
          </button>
        </form>
      </section>
    </div>
  );
}
