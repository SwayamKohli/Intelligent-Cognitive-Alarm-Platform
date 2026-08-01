import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Sheet } from "lucide-react";
import api from "../lib/api";
import { staggerContainer, staggerItem } from "../lib/motion";
import "./CoachDashboard.css";

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function scoreTier(score) {
  if (score >= 80) return "high";
  if (score >= 50) return "mid";
  return "low";
}

function CoachDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  const triggerDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async (userId, userName) => {
    setDownloadingId(`${userId}-pdf`);
    try {
      const response = await api.get(`/reports/export/pdf?user_id=${userId}`, {
        responseType: "blob",
      });
      triggerDownload(new Blob([response.data]), `${userName}_Sleep_Report.pdf`);
    } catch (error) {
      console.error(error);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleExportExcel = async (userId, userName) => {
    setDownloadingId(`${userId}-excel`);
    try {
      const response = await api.get(`/reports/export/excel?user_id=${userId}`, {
        responseType: "blob",
      });
      triggerDownload(new Blob([response.data]), `${userName}_Telemetry.xlsx`);
    } catch (error) {
      console.error(error);
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get("/coach/users");
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch coach users:", error);
        setErrorMsg("Failed to load assigned users.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="coach-container">
      <main className="coach-main">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Coach Dashboard
        </motion.h1>
        <p className="coach-subtitle">Assigned users and their habit adherence</p>

        <motion.div
          className="glass-card coach-panel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {errorMsg && <p className="auth-error">{errorMsg}</p>}

          {loading ? (
            <p className="empty-state">Loading assigned users…</p>
          ) : users.length === 0 ? (
            <p className="empty-state">No users assigned to this coach yet.</p>
          ) : (
            <div className="coach-table">
              <div className="coach-table-header">
                <span>User</span>
                <span>Email</span>
                <span>Target Schedule</span>
                <span>Habit Score</span>
                <span>Reports</span>
              </div>

              <motion.div variants={staggerContainer} initial="initial" animate="animate">
                {users.map((user) => {
                  const score = user.habit_score ?? 0;
                  const name = user.full_name || "User";
                  return (
                    <motion.div
                      key={user.id}
                      className="coach-table-row"
                      variants={staggerItem}
                      whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                    >
                      <span className="user-cell">
                        <span className="user-avatar">{initials(name)}</span>
                        {name}
                      </span>
                      <span className="user-email">{user.email}</span>
                      <span>
                        {user.bedtime ? `${user.bedtime} – ${user.wake_time}` : "Not set"}
                      </span>
                      <span className={`rate-badge ${scoreTier(score)}`}>{score}%</span>

                      <span className="report-actions">
                        <button
                          className="icon-btn"
                          onClick={() => handleDownloadPdf(user.id, name)}
                          disabled={downloadingId === `${user.id}-pdf`}
                          title="Download PDF"
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => handleExportExcel(user.id, name)}
                          disabled={downloadingId === `${user.id}-excel`}
                          title="Export Excel"
                        >
                          <Sheet size={16} />
                        </button>
                      </span>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

export default CoachDashboard;