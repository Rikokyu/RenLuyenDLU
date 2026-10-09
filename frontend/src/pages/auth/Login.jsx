import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, loginWithGoogle } from "../../services/authService";
import { setSession } from "../../store/authStore";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(
    localStorage.getItem("renluyen-theme") === "dark" ? "dark" : "light",
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("renluyen-theme", theme);
  }, [theme]);

  function finishLogin(session) {
    setSession(session);
    navigate("/dashboard", { replace: true });
  }

  useEffect(() => {
    if (!googleClientId) return undefined;

    const initializeGoogleLogin = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          setError("");
          setLoading(true);
          try {
            finishLogin(await loginWithGoogle(credential));
          } catch (requestError) {
            setError(
              requestError.response?.data?.message ||
                "Không thể đăng nhập bằng Google.",
            );
          } finally {
            setLoading(false);
          }
        },
      });
    };

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existingScript) {
      initializeGoogleLogin();
      existingScript.addEventListener("load", initializeGoogleLogin);
      return () =>
        existingScript.removeEventListener("load", initializeGoogleLogin);
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleLogin;
    document.head.appendChild(script);
    return () => {
      script.onload = null;
    };
  }, [googleClientId]);

  async function submit(e) {
    e.preventDefault();
    setSubmitted(true);
    setError("");
    if (!username.trim() || !password) return;

    setLoading(true);
    try {
      finishLogin(await login(username.trim(), password));
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Không thể kết nối máy chủ đăng nhập.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-visual" aria-hidden="true">
        <img src="/images/DLU-A1.png" alt="" />
      </div>

      <section className="login-panel" aria-labelledby="loginHeading">
        <header className="login-brand">
          <img src="/images/RenLuyenDLULogo.png" alt="Logo Rèn Luyện DLU" />
          <p>TRƯỜNG ĐẠI HỌC ĐÀ LẠT</p>
          <h1>RÈN LUYỆN DLU</h1>
        </header>

        <form className="login-form" onSubmit={submit}>
          <h2 id="loginHeading">ĐĂNG NHẬP</h2>

          {error && (
            <p className="login-api-error" role="alert">
              {error}
            </p>
          )}

          <div
            className={`login-field${submitted && !username.trim() ? " is-invalid" : ""}`}
          >
            <input
              type="text"
              placeholder=" "
              value={username}
              autoComplete="username"
              required
              onChange={(e) => setUsername(e.target.value)}
            />
            <label>Tên tài khoản</label>
            <p className="login-error">Tên đăng nhập là bắt buộc</p>
          </div>

          <div
            className={`login-field${submitted && !password.trim() ? " is-invalid" : ""}`}
          >
            <input
              type="password"
              placeholder=" "
              value={password}
              autoComplete="current-password"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
            <label>Mật khẩu</label>
            <p className="login-error">Mật khẩu là bắt buộc</p>
          </div>

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
          </button>

          <button
            className="google-submit"
            type="button"
            disabled={loading}
            onClick={() => {
              if (!googleClientId) {
                setError("Google OAuth chưa được cấu hình cho ứng dụng.");
                return;
              }
              if (!window.google?.accounts?.id) {
                setError("Dịch vụ Google chưa sẵn sàng. Vui lòng thử lại.");
                return;
              }
              window.google.accounts.id.prompt();
            }}
          >
            <img src="/images/google.svg" alt="" />
            Đăng nhập Google
          </button>
          <p className="login-hint">
            Sinh viên đăng nhập bằng MSSV; giảng viên và trợ lý dùng tên tài
            khoản được cấp.
          </p>
        </form>

        <button
          className="theme-toggle"
          type="button"
          onClick={() => setTheme((v) => (v === "dark" ? "light" : "dark"))}
          aria-label={
            theme === "dark" ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"
          }
        >
          <img
            className="theme-toggle__icon"
            src={theme === "dark" ? "/icons/light.svg" : "/icons/dark.svg"}
            alt=""
          />
        </button>
      </section>
    </main>
  );
}
