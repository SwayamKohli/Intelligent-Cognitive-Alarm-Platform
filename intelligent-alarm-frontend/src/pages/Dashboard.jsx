import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../lib/api";
import AlarmModal from "./AlarmModal";
import CreateAlarmForm from "./CreateAlarmForm";
import { staggerContainer, staggerItem } from "../lib/motion";
import "./Dashboard.css";

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
  const [globalPreferredChallenges, setGlobalPreferredChallenges] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [toast, setToast] = useState(null);

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

  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/users/profile");
      setProfileName(data.full_name || "");
      setProfileTimezone(data.timezone || "UTC");
      setProfileDifficulty(data.difficulty_preference || "medium");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

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
                <p className="empty-state">Analytics dashboard coming soon.</p>
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