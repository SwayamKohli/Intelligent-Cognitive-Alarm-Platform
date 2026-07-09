import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../lib/api";
import AuthWaveBackground from "../components/AuthWaveBackground";
import "../components/AuthWaveBackground.css";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    setErrorMsg("");

    if (email === "" || password === "") {
      setErrorMsg("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const { data } = await api.post("/users/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      localStorage.setItem("access_token", data.access_token);

      const { data: profile } = await api.get("/users/profile");

      if (profile.role?.toLowerCase() === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.log("Login Error:", error);
      if (error.response?.status === 401 || error.response?.status === 400) {
        setErrorMsg("Invalid email or password");
      } else {
        setErrorMsg("Could not reach the server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="auth-container">
      <AuthWaveBackground />

      <motion.div
        className="auth-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="brand-mark"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          ⏰
        </motion.div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your Cognitive Alarm Platform</p>

        <motion.div
          className="glass-card auth-form"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {errorMsg && (
            <motion.p
              className="auth-error"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {errorMsg}
            </motion.p>
          )}

          <motion.button
            className="btn-accent auth-submit"
            onClick={handleLogin}
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -1 }}
          >
            {loading ? "Signing in…" : "Login"}
          </motion.button>

          <p className="register-text">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Login;