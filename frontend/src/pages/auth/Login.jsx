import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(
    localStorage.getItem("renluyen-theme") === "dark" ? "dark" : "light"
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("renluyen-theme", theme);
  }, [theme]);

  function enterApp() {
    sessionStorage.setItem("renluyen-authenticated", "true");
    navigate("/dashboard", { replace: true });
  }

  function submit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (username.trim() && password.trim()) {
      enterApp();
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

          <div className={`login-field${submitted && !username.trim() ? " is-invalid" : ""}`}>
            <input
              type="text"
              placeholder=" "
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <label>Tên đăng nhập</label>
            <p className="login-error">Tên đăng nhập là bắt buộc</p>
          </div>

          <div className={`login-field${submitted && !password.trim() ? " is-invalid" : ""}`}>
            <input
              type="password"
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label>Mật khẩu</label>
            <p className="login-error">Mật khẩu là bắt buộc</p>
          </div>

          <button className="login-submit" type="submit">
            ĐĂNG NHẬP
          </button>

          <button className="google-submit" type="button" onClick={enterApp}>
            <img src="/images/google.svg" alt="" />
            Đăng nhập Google
          </button>
        </form>

        <button
          className="theme-toggle"
          type="button"
          onClick={() => setTheme((v) => (v === "dark" ? "light" : "dark"))}
          aria-label={theme === "dark" ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"}
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
