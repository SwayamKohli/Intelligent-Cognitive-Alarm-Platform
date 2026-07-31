import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../lib/api";
import AlarmModal from "./AlarmModal";
import CreateAlarmForm from "./CreateAlarmForm";
import { staggerContainer, staggerItem } from "../lib/motion";
import "./Dashboard.css";
import AnalyticsPanel from "./AnalyticsPanel";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "◈" },
  { key: "alarms", label: "My Alarms", icon: "⏰" },
  { key: "analytics", label: "Analytics", icon: "▲" },
];

const AVAILABLE_CHALLENGES = [
  "math", "memory", "pattern", "logic", "word_scramble", "riddle", "quiz",
];

function Dashboard() {
  const navigate = useNavigate();

  const [showCreateAlarm, setShowCreateAlarm] = useState(false);
  const [alarms, setAlarms] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loadingAlarms, setLoadingAlarms] = useState(true);

  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [currentAlarmId, setCurrentAlarmId] = useState(null);

  const [profileName, setProfileName] = useState("");
  const [profileTimezone, setProfileTimezone] = useState("UTC");
  const [profileDifficulty, setProfileDifficulty] = useState("medium");
  const [targetBedtime, setTargetBedtime] = useState("22:00");
  const [targetWakeTime, setTargetWakeTime] = useState("06:00");
  const [globalPreferredChallenges, setGlobalPreferredChallenges] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [toast, setToast] = useState(null);
  const [habitScore, setHabitScore] = useState(null);
  const [recommendations, setRecommendations] = useState({
  sleep: "",
  wake_up: "",
  habit: "",
  productivity: "",
});
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
  bedtime_warning_enabled: true,
  bedtime_warning_minutes: 30,
  morning_streak_alert: true,
  challenge_reminders: false,
  weekly_sleep_report: true,
});

const [savingNotifications, setSavingNotifications] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAlarms = async () => {
    setLoadingAlarms(true);
    try {
      const { data } = await api.get("/alarms/");
      setAlarms(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingAlarms(false);
    }
  };
  const fetchHabitScore = async () => {
  setLoadingAnalytics(true);
  try {
    const { data } = await api.get("/analytics/habit-score");
    setHabitScore(data);
  } catch (error) {
    console.log(error);
  } finally {
    setLoadingAnalytics(false);
  }
};
  const fetchRecommendations = async () => {
    try {
      const { data } = await api.get("/analytics/recommendations");
      
      // Safely extract the string if Groq returns a nested object
      const safeExtract = (item) => {
        if (typeof item === 'object' && item !== null) {
          return item.advice || JSON.stringify(item);
        }
        return typeof item === 'string' ? item : 'No suggestions available.';
      };

      setRecommendations({
        sleep: safeExtract(data.sleep),
        wake_up: safeExtract(data.wake_up),
        habit: safeExtract(data.habit),
        productivity: safeExtract(data.productivity),
      });
    } catch (error) {
      console.log(error);
    }
  };
  const fetchNotificationSettings = async () => {
  try {
    const { data } = await api.get("/notifications/preferences");
    setNotificationSettings(data);
  } catch (error) {
    console.error(error);
  }
};
  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/users/profile");
      setProfileName(data.full_name || "");
      setProfileTimezone(data.timezone || "UTC");
      setProfileDifficulty(data.difficulty_preference || "medium");
      setTargetBedtime(data.target_bedtime || "22:00");
      setTargetWakeTime(data.target_wake_time || "06:00");
      if (data.preferred_challenges) {
        setGlobalPreferredChallenges(data.preferred_challenges.split(","));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await api.put("/users/profile", {
        full_name: profileName,
        timezone: profileTimezone,
        difficulty_preference: profileDifficulty,
        target_bedtime: targetBedtime,
        target_wake_time: targetWakeTime,
        preferred_challenges:
          globalPreferredChallenges.length > 0
            ? globalPreferredChallenges.join(",")
            : null,
      });
      showToast("Profile updated successfully");
    } catch (error) {
      console.log(error);
      showToast("Failed to update profile", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleGlobalChallengeToggle = (challenge) => {
    setGlobalPreferredChallenges((prev) =>
      prev.includes(challenge)
        ? prev.filter((c) => c !== challenge)
        : [...prev, challenge]
    );
  };

  const handleDeleteAlarm = async (alarmId) => {
    if (!window.confirm("Are you sure you want to delete this alarm?")) return;
    try {
      await api.delete(`/alarms/${alarmId}`);
      showToast("Alarm deleted");
      fetchAlarms();
    } catch (error) {
      console.log(error);
      showToast("Failed to delete alarm", "error");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchAlarms();
    fetchProfile();
    fetchHabitScore();
    fetchRecommendations();
    fetchNotificationSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);
  const handleSaveNotifications = async () => {
  setSavingNotifications(true);

  try {
    await api.put(
      "/notifications/preferences",
      notificationSettings
    );

    showToast("Notification settings updated");
  } catch (error) {
    console.error(error);
    showToast("Failed to update notification settings", "error");
  } finally {
    setSavingNotifications(false);
  }
};
  const handleAlarmCreated = () => {
    setShowCreateAlarm(false);
    fetchAlarms();
    showToast("Alarm created");
  };

  const fetchChallenge = async (alarmId) => {
    try {
      const { data } = await api.get(
        `/challenges/next?alarm_id=${alarmId}&challenge_type=random`
      );
      setCurrentChallenge(data);
      setCurrentAlarmId(alarmId);
      setIsAlarmRinging(true);
    } catch (error) {
      console.log(error);
      showToast("Failed to fetch challenge", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };
  const handleDownloadPdf = async () => {
  try {
    const response = await api.get("/reports/export/pdf", {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Sleep_Report.pdf");
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error(error);
    showToast("Failed to download PDF report", "error");
  }
};

const handleExportExcel = async () => {
  try {
    const response = await api.get("/reports/export/excel", {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Telemetry_Report.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error(error);
    showToast("Failed to export Excel report", "error");
  }
};
  const score =
  habitScore?.overall_score ?? habitScore?.score ?? 0;

const radius = 55;
const circumference = 2 * Math.PI * radius;
const progress = circumference - (score / 100) * circumference;
  return (
    <>
      <AnimatePresence>
        {isAlarmRinging && (
          <AlarmModal
            challenge={currentChallenge}
            alarmId={currentAlarmId}
            onClose={() => {
              setIsAlarmRinging(false);
              setCurrentChallenge(null);
              setCurrentAlarmId(null);
            }}
          />
        )}
      </AnimatePresence>

      <div className="dashboard-layout">
        <motion.aside
          className="sidebar glass-card"
          initial={{ x: -24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="sidebar-brand">
            <span className="brand-icon">⏰</span>
            <h2>Cognitive Alarm</h2>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                className={activeTab === item.key ? "nav-btn active" : "nav-btn"}
                onClick={() => setActiveTab(item.key)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
                {activeTab === item.key && (
                  <motion.span
                    className="nav-indicator"
                    layoutId="nav-indicator"
                  />
                )}
              </button>
            ))}
          </nav>

          <button className="logout-btn" onClick={handleLogout}>
            Sign out
          </button>
        </motion.aside>

        <main className="main-content">
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {activeTab === "dashboard" && "Profile Settings"}
            {activeTab === "alarms" && "My Alarms"}
            {activeTab === "analytics" && "Analytics"}
          </motion.h1>

          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                className="glass-card profile-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <div className="field-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                </div>

                <div className="field-row">
                  <div className="field-group">
                    <label>Difficulty Preference</label>
                    <select
                      value={profileDifficulty}
                      onChange={(e) => setProfileDifficulty(e.target.value)}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>

                  <div className="field-group">
                    <label>Timezone</label>
                    <select
                      value={profileTimezone}
                      onChange={(e) => setProfileTimezone(e.target.value)}
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                </div>
                <div className="field-row">
                  <div className="field-group">
                    <label>Target Bedtime</label>
                    <input
                      type="time"
                      value={targetBedtime}
                      onChange={(e) => setTargetBedtime(e.target.value)}
                    />
                  </div>

                  <div className="field-group">
                    <label>Target Wake Time</label>
                    <input
                      type="time"
                      value={targetWakeTime}
                      onChange={(e) => setTargetWakeTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label>Global Allowed Challenges</label>
                  <p className="field-hint">Leave blank to allow all challenge types</p>
                  <div className="chip-grid">
                    {AVAILABLE_CHALLENGES.map((challenge) => {
                      const active = globalPreferredChallenges.includes(challenge);
                      return (
                        <motion.button
                          type="button"
                          key={challenge}
                          className={active ? "chip active" : "chip"}
                          onClick={() => handleGlobalChallengeToggle(challenge)}
                          whileTap={{ scale: 0.95 }}
                        >
                          {challenge.replace("_", " ")}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <motion.button
                  className="btn-accent full-width"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  whileTap={{ scale: 0.97 }}
                >
                  {savingProfile ? "Saving…" : "Save Profile"}
                </motion.button>
                <div className="glass-card" style={{ marginTop: "24px" }}>
  <h3>Notification Preferences</h3>

  <div className="field-group">
    <label>
      <input
        type="checkbox"
        checked={notificationSettings.bedtime_warning_enabled}
        onChange={(e) =>
          setNotificationSettings({
            ...notificationSettings,
            bedtime_warning_enabled: e.target.checked,
          })
        }
      />
      {" "}Enable Bedtime Reminder
    </label>
  </div>

  <div className="field-group">
    <label>Reminder Minutes Before Bedtime</label>
    <input
      type="number"
      min="5"
      max="120"
      value={notificationSettings.bedtime_warning_minutes}
      onChange={(e) =>
        setNotificationSettings({
          ...notificationSettings,
          bedtime_warning_minutes: Number(e.target.value),
        })
      }
    />
  </div>

  <div className="field-group">
    <label>
      <input
        type="checkbox"
        checked={notificationSettings.morning_streak_alert}
        onChange={(e) =>
          setNotificationSettings({
            ...notificationSettings,
            morning_streak_alert: e.target.checked,
          })
        }
      />
      {" "}Morning Streak Alerts
    </label>
  </div>

  <div className="field-group">
    <label>
      <input
        type="checkbox"
        checked={notificationSettings.challenge_reminders}
        onChange={(e) =>
          setNotificationSettings({
            ...notificationSettings,
            challenge_reminders: e.target.checked,
          })
        }
      />
      {" "}Challenge Reminders
    </label>
  </div>

  <div className="field-group">
    <label>
      <input
        type="checkbox"
        checked={notificationSettings.weekly_sleep_report}
        onChange={(e) =>
          setNotificationSettings({
            ...notificationSettings,
            weekly_sleep_report: e.target.checked,
          })
        }
      />
      {" "}Weekly Sleep Report
    </label>
  </div>

  <motion.button
    className="btn-accent full-width"
    onClick={handleSaveNotifications}
    disabled={savingNotifications}
    whileTap={{ scale: 0.97 }}
  >
    {savingNotifications
      ? "Saving..."
      : "Save Notification Settings"}
  </motion.button>
</div>
              </motion.div>
            )}

            {activeTab === "alarms" && (
              <motion.div
                key="alarms"
                className="glass-card alarm-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                {loadingAlarms ? (
                  <p className="empty-state">Loading alarms…</p>
                ) : alarms.length === 0 ? (
                  <p className="empty-state">No alarms created yet.</p>
                ) : (
                  <motion.div
                    className="alarm-list"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                  >
                    {alarms.map((alarm) => (
                      <motion.div
                        key={alarm.id}
                        className="alarm-item"
                        variants={staggerItem}
                        whileHover={{ y: -2 }}
                      >
                        <div className="alarm-info">
                          <span className={`alarm-dot ${alarm.is_active ? "on" : "off"}`} />
                          <div>
                            <strong>{alarm.label}</strong>
                            <p>{alarm.time?.slice(0, 5)} · {alarm.alarm_type}</p>
                          </div>
                        </div>
                        <div className="alarm-actions">
                          <button
                            className="btn-ghost small"
                            onClick={() => fetchChallenge(alarm.id)}
                          >
                            Test Ring
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteAlarm(alarm.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {!showCreateAlarm && (
                  <button
                    className="btn-accent full-width"
                    onClick={() => setShowCreateAlarm(true)}
                  >
                    + Add Alarm
                  </button>
                )}

                <AnimatePresence>
                  {showCreateAlarm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CreateAlarmForm onAlarmCreated={handleAlarmCreated} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div
                key="analytics"
                className="glass-card profile-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                {loadingAnalytics ? (
  <p className="empty-state">Loading analytics...</p>
) : (
  <>
  <AnalyticsPanel
    habitScore={habitScore}
    recommendations={recommendations}
  />

  <div className="analytics-section" style={{ marginTop: "32px" }}>
    <h3>Reports & Exports</h3>

    <div className="recommendation-grid">
      <button
  className="btn-accent"
  onClick={handleDownloadPdf}
>
        📄 Download PDF Report
      </button>

      <button
  className="btn-ghost"
  onClick={handleExportExcel}
>
        📊 Export Excel Telemetry
      </button>
    </div>
  </div>
</>
)}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            className={`toast ${toast.type}`}
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Dashboard;