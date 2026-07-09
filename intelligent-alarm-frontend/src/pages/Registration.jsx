import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../lib/api";
import AuthWaveBackground from "../components/AuthWaveBackground";
import "../components/AuthWaveBackground.css";
import "./Registration.css";

function Registration() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async () => {
    setErrorMsg("");

    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMsg("Please fill all the fields");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.post("/users/register", {
        full_name: fullName,
        email,
        password,
      });

      navigate("/login");
    } catch (error) {
      console.log(error);
      setErrorMsg(error.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleRegister();
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

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start building better wake-up habits</p>

        <motion.div
          className="glass-card auth-form"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="input-group">
            <label>Full name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

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

          <div className="input-group">
            <label>Confirm password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            onClick={handleRegister}
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -1 }}
          >
            {loading ? "Creating account…" : "Register"}
          </motion.button>

          <p className="login-text">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Registration;