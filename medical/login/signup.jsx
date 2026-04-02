import "./login.css";
import { useState } from "react";
import { signupUser } from "../src/api.js";

function Signup({ switchToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("cashier"); // ✅ NEW
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError("");
    setSuccess("");

    if (!username || !email || !password || !confirmPassword) {
      setError("⚠️ All fields are required");
      return;
    }

    if (password.length < 6) {
      setError("⚠️ Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("⚠️ Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const data = await signupUser(username, email, password, role); // ✅ send role

      if (data?.username) {
        setSuccess("✅ Account created! Redirecting to login...");
        setError("");

        // clear inputs
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setRole("cashier");

        setTimeout(() => {
          switchToLogin();
        }, 1500);

      } else {
        if (Array.isArray(data?.detail)) {
          setError(data.detail[0].msg);
        } else {
          setError(data?.detail || "❌ Signup failed");
        }
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
      <h2>Create Account</h2>

      <div className="inputs">
        <label>
          Username:
          <input
            type="text"
            value={username}
            placeholder="Enter username"
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>

        <label>
          Email:
          <input
            type="email"
            value={email}
            placeholder="Enter email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label>
          Password:
          <input
            type="password"
            value={password}
            placeholder="Enter password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <label>
          Confirm Password:
          <input
            type="password"
            value={confirmPassword}
            placeholder="Confirm password"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>

        {/* ✅ ROLE DROPDOWN */}
        <label>
          Role:
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="cashier">Cashier</option>
            <option value="admin">Admin</option>
          </select>
        </label>
      </div>

      {/* ❌ Error */}
      {error && <div style={{ color: "red", marginTop: "10px" }}>{error}</div>}

      {/* ✅ Success */}
      {success && <div style={{ color: "green", marginTop: "10px" }}>{success}</div>}

      <button onClick={handleSignup} disabled={loading}>
        {loading ? "Creating..." : "Sign Up"}
      </button>

      <div className="signup">
        Already have an account?{" "}
        <span
          onClick={switchToLogin}
          style={{ color: "blue", cursor: "pointer" }}
        >
          Login
        </span>
      </div>
    </div>
  );
}

export default Signup;