import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlarmModal from "./AlarmModal";
import CreateAlarmForm from "./CreateAlarmForm";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [showCreateAlarm, setShowCreateAlarm] = useState(false);
  const [alarms, setAlarms] = useState([]);
  
  // Real active ringing alarm state
  const [activeRingingAlarm, setActiveRingingAlarm] = useState(null);
  const [lastTriggeredMinute, setLastTriggeredMinute] = useState("");

  // Fetch alarms from backend
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
        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Route protection + initial alarm fetch
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    fetchAlarms();
  }, [navigate]);

  // Clock loop to trigger alarms based on local time
  useEffect(() => {
    const checkAlarms = () => {
      if (alarms.length === 0 || activeRingingAlarm) return;

      const now = new Date();
      const currentHour = String(now.getHours()).padStart(2, "0");
      const currentMin = String(now.getMinutes()).padStart(2, "0");
      const currentTimeStr = `${currentHour}:${currentMin}`; // e.g. "08:15"

      // Only check once per minute
      if (currentTimeStr === lastTriggeredMinute) return;

      const ringing = alarms.find((alarm) => {
        if (!alarm.is_active) return false;
        
        // alarm.time is usually "HH:MM:SS" or "HH:MM"
        return alarm.time.startsWith(currentTimeStr);
      });

      if (ringing) {
        setActiveRingingAlarm(ringing);
        setLastTriggeredMinute(currentTimeStr);
      }
    };

    // Check immediately and then every 5 seconds
    checkAlarms();
    const interval = setInterval(checkAlarms, 5000);

    return () => clearInterval(interval);
  }, [alarms, activeRingingAlarm, lastTriggeredMinute]);

  // Called after successful alarm creation
  const handleAlarmCreated = () => {
    setShowCreateAlarm(false);
    fetchAlarms();
  };

  const handleDismissAlarm = () => {
    setActiveRingingAlarm(null);
    fetchAlarms(); // refresh alarm state (e.g. reset snooze count)
  };

  const handleSnoozeAlarm = () => {
    setActiveRingingAlarm(null);
    fetchAlarms(); // refresh alarm state
  };

  return (
    <>
      {activeRingingAlarm && (
        <AlarmModal
          alarmId={activeRingingAlarm.id}
          alarmLabel={activeRingingAlarm.label}
          onDismiss={handleDismissAlarm}
          onSnooze={handleSnoozeAlarm}
        />
      )}

      <div className="dashboard-container">
        <h1>User Dashboard</h1>

        <div className="dashboard-content">
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

          <div className="alarm-card">
            <h2>My Alarms</h2>

            {alarms.length === 0 ? (
              <p>No alarms created yet.</p>
            ) : (
              <div className="alarms-list">
                {alarms.map((alarm) => (
                  <div key={alarm.id} className="alarm-item-row">
                    <div className="alarm-info">
                      <strong className="alarm-item-label">{alarm.label}</strong>
                      <span className="alarm-item-time">{alarm.time}</span>
                    </div>
                    <div className="alarm-item-actions">
                      <button 
                        className="test-alarm-btn" 
                        onClick={() => setActiveRingingAlarm(alarm)}
                      >
                        ⚡ Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!showCreateAlarm && (
              <button className="add-alarm-btn" onClick={() => setShowCreateAlarm(true)}>
                Add Alarm
              </button>
            )}

            {showCreateAlarm && (
              <CreateAlarmForm onAlarmCreated={handleAlarmCreated} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;