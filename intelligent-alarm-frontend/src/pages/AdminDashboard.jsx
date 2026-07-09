import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import api from "../lib/api";
import { staggerContainer, staggerItem } from "../lib/motion";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    user_growth: { total_registered: 0, active_daily: 0 },
    global_snooze: { average_active_snoozes: 0, total_active_alarms: 0 },
    engine_failure_rates: [],
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchMetrics = async () => {
      try {
        const { data } = await api.get("/admin/metrics");
        setMetrics(data);
      } catch (error) {
        console.log(error);
        if (error.response?.status === 403 || error.response?.status === 401) {
          setErrorMsg("You don't have admin access.");
        } else {
          setErrorMsg("Failed to load metrics.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  const statCards = [
    {
      label: "Total Registered Users",
      value: metrics.user_growth.total_registered,
      icon: "◆",
    },
    {
      label: "Daily Active Users",
      value: metrics.user_growth.active_daily,
      icon: "▲",
    },
    {
      label: "Average Active Snoozes",
      value: metrics.global_snooze.average_active_snoozes,
      icon: "⏸",
    },
    {
      label: "Total Active Alarms",
      value: metrics.global_snooze.total_active_alarms,
      icon: "⏰",
    },
  ];

  const chartData = metrics.engine_failure_rates.map((e) => ({
    engine: e.engine,
    failureRate: e.failure_rate_percentage,
    attempts: e.attempts,
    failures: e.failures,
  }));

  return (
    <div className="admin-container">
      <div className="admin-topbar">
        <div className="admin-brand">
          <span className="brand-icon">⏰</span>
          <h2>Admin Console</h2>
        </div>
        <button className="btn-ghost small" onClick={handleLogout}>
          Sign out
        </button>
      </div>

      <main className="admin-main">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Platform Overview
        </motion.h1>

        {errorMsg && <p className="auth-error admin-error">{errorMsg}</p>}

        {loading ? (
          <p className="empty-state">Loading metrics…</p>
        ) : (
          <>
            <motion.div
              className="stat-grid"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {statCards.map((card) => (
                <motion.div
                  key={card.label}
                  className="glass-card stat-card"
                  variants={staggerItem}
                  whileHover={{ y: -4 }}
                >
                  <span className="stat-icon">{card.icon}</span>
                  <h3>{card.label}</h3>
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {card.value}
                  </motion.h2>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              className="glass-card engine-panel"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2>Engine Failure Rates</h2>

              {chartData.length === 0 ? (
                <p className="empty-state">No engine data available.</p>
              ) : (
                <>
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                        <XAxis
                          dataKey="engine"
                          stroke="var(--text-dim)"
                          tick={{ fill: "var(--text-dim)", fontSize: 12 }}
                          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="var(--text-dim)"
                          tick={{ fill: "var(--text-dim)", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          unit="%"
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(244,197,66,0.06)" }}
                          contentStyle={{
                            background: "#131316",
                            border: "1px solid rgba(244,197,66,0.25)",
                            borderRadius: 10,
                            fontSize: 13,
                          }}
                          labelStyle={{ color: "var(--text-h)" }}
                          formatter={(value, name) => [
                            name === "failureRate" ? `${value}%` : value,
                            name === "failureRate" ? "Failure rate" : name,
                          ]}
                        />
                        <Bar dataKey="failureRate" radius={[6, 6, 0, 0]} fill="url(#barGradient)" />
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f4c542" />
                            <stop offset="100%" stopColor="#b8862b" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="engine-table">
                    <div className="engine-table-header">
                      <span>Engine</span>
                      <span>Attempts</span>
                      <span>Failures</span>
                      <span>Failure Rate</span>
                    </div>
                    {metrics.engine_failure_rates.map((e) => (
                      <motion.div
                        key={e.engine}
                        className="engine-table-row"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <span className="engine-name">{e.engine}</span>
                        <span>{e.attempts}</span>
                        <span>{e.failures}</span>
                        <span
                          className={
                            e.failure_rate_percentage > 40
                              ? "rate-badge high"
                              : e.failure_rate_percentage > 20
                              ? "rate-badge mid"
                              : "rate-badge low"
                          }
                        >
                          {e.failure_rate_percentage}%
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;