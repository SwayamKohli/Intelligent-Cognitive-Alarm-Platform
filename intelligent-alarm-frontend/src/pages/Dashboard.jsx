import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlarmModal from "./AlarmModal";
import CreateAlarmForm from "./CreateAlarmForm";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [showCreateAlarm, setShowCreateAlarm] = useState(false);
  const [alarms, setAlarms] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [currentAlarmId, setCurrentAlarmId] = useState(null);
  // Fetch alarms
  const fetchAlarms = async () => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      const response = await fetch("http://127.0.0.1:8000/alarms/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAlarms(data);
      } else {
        console.log("Failed to fetch alarms.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Delete Alarm
  const handleDeleteAlarm = async (alarmId) => {
    const token = localStorage.getItem("token");

    if (!window.confirm("Are you sure you want to delete this alarm?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/alarms/${alarmId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        alert("Alarm deleted successfully.");
        fetchAlarms();
      } else {
        alert("Failed to delete alarm.");
      }
    } catch (error) {
      console.log(error);
      alert("Backend not running.");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    fetchAlarms();
  }, [navigate]);

  const handleAlarmCreated = () => {
    setShowCreateAlarm(false);
    fetchAlarms();
  };
  const fetchChallenge = async (alarmId) => {
    console.log("Alarm ID:", alarmId);
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/challenges/next?alarm_id=${alarmId}&challenge_type=random`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      alert("Failed to fetch challenge.");
      return;
    }

    const data = await response.json();
    console.log(JSON.stringify(data.streak_state, null, 2));

    setCurrentChallenge(data);
    setCurrentAlarmId(alarmId);
    setIsAlarmRinging(true);

  } catch (error) {
    console.log(error);
    alert("Backend error.");
  }
};

  return (
    <>
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
      <div className="dashboard-layout">
        <aside className="sidebar">
          <h2>Alarm App</h2>

          <button
            className={activeTab === "dashboard" ? "active" : ""}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={activeTab === "alarms" ? "active" : ""}
            onClick={() => setActiveTab("alarms")}
          >
            My Alarms
          </button>

          <button
            className={activeTab === "analytics" ? "active" : ""}
            onClick={() => setActiveTab("analytics")}
          >
            Analytics
          </button>
        </aside>

        <main className="main-content">
          <h1>User Dashboard</h1>

          {activeTab === "dashboard" && (
            <div className="profile-card">
              <h2>Profile Settings</h2>

              <label>Full Name</label>
              <input type="text" placeholder="Enter your full name" />

              <label>Email</label>
              <input type="email" placeholder="Enter your email" />

              <label>Difficulty Preference</label>
              <select>
                <option>Beginner</option>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
                <option>Expert</option>
              </select>

              <label>Timezone</label>
              <select>
                <option>Asia/Kolkata (IST)</option>
                <option>UTC</option>
                <option>America/New_York (EST)</option>
                <option>Europe/London (GMT)</option>
              </select>

              <button>Save Profile</button>
            </div>
          )}

          {activeTab === "alarms" && (
            <div className="alarm-card">
              <h2>My Alarms</h2>

              {alarms.length === 0 ? (
                <p>No alarms created yet.</p>
              ) : (
                alarms.map((alarm) => (
                  <div key={alarm.id} className="alarm-item">
                    <div>
                      <strong>{alarm.label}</strong>
                      <p>{alarm.time}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteAlarm(alarm.id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                    <button
  onClick={() => fetchChallenge(alarm.id)}
>
  Test Ring
</button>
                  </div>
                ))
              )}

              {!showCreateAlarm && (
                <button onClick={() => setShowCreateAlarm(true)}>
                  Add Alarm
                </button>
              )}

              {showCreateAlarm && (
                <CreateAlarmForm onAlarmCreated={handleAlarmCreated} />
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="profile-card">
              <h2>Analytics</h2>
              <p>Analytics dashboard will be added in the upcoming tasks.</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default Dashboard;