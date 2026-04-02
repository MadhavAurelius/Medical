import "./login.css";
import { useState } from "react";
import { loginUser } from "../src/api.js";

function Login({ switchToSignup, setToken, setUserRole }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setSuccess("");

    if (!username || !password) {
      setError("⚠️ Please enter username and password");
      return;
    }

    try {
      setLoading(true);

      const data = await loginUser(username, password);

      if (data?.access_token) {
        // ✅ Save token
        setToken(data.access_token);
        localStorage.setItem("token", data.access_token);

        // ✅ Decode role from JWT
        const payload = JSON.parse(
          atob(data.access_token.split(".")[1])
        );

        const role = payload.role || "cashier";

        // ✅ Save role (for UI control)
        if (setUserRole) {
          setUserRole(role);
        }

        localStorage.setItem("role", role);

        setSuccess(`✅ Logged in as ${role.toUpperCase()}`);

        // Clear inputs
        setUsername("");
        setPassword("");

        // Auto hide success
        setTimeout(() => {
          setSuccess("");
        }, 2000);

      } else {
        setError(data?.detail || "❌ Invalid username or password");
      }

    } catch (err) {
      console.error(err);
      setError("🚨 Server error. Try again later");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <h2>W E L C O M E</h2>

      <div className="inputs">
        <label>
          Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
          />
        </label>

        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </label>
      </div>

      {/* ❌ Error */}
      {error && <div style={{ color: "red", marginTop: "10px" }}>{error}</div>}

      {/* ✅ Success */}
      {success && <div style={{ color: "green", marginTop: "10px" }}>{success}</div>}

      <button onClick={handleLogin} disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>

      <div className="signup">
        Don't have an account?{" "}
        <span
          onClick={switchToSignup}
          style={{ color: "blue", cursor: "pointer" }}
        >
          Sign Up
        </span>
      </div>
    </div>
  );
}

export default Login;