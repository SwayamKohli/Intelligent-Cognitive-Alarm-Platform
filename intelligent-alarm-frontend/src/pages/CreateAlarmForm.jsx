import { useState } from "react";

function CreateAlarmForm({ onAlarmCreated }) {
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("");
  const [alarmType, setAlarmType] = useState("daily");
  const [isActive, setIsActive] = useState(true);
  const [recurrenceDays, setRecurrenceDays] = useState("");
  const [snoozeEnabled, setSnoozeEnabled] = useState(true);
  const [snoozeLimit, setSnoozeLimit] = useState(3);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/alarms/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          label,
          time,
          alarm_type: alarmType,
          is_active: isActive,
          recurrence_days: recurrenceDays || null,
          snooze_enabled: snoozeEnabled,
          snooze_limit: snoozeLimit,
        }),
      });

      if (response.ok) {
        alert("Alarm created successfully!");

        setLabel("");
        setTime("");
        setAlarmType("daily");
        setIsActive(true);
        setRecurrenceDays("");
        setSnoozeEnabled(true);
        setSnoozeLimit(3);

        if (onAlarmCreated) {
          onAlarmCreated();
        }
      } else {
        alert("Failed to create alarm.");
      }
    } catch (error) {
      console.error(error);
      alert("Backend not running. Team lead can test the integration.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Create Alarm</h3>

      <label>Alarm Label</label>
      <input
        type="text"
        placeholder="Morning Alarm"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />

      <label>Alarm Time</label>
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />

      <label>Alarm Type</label>
      <select
        value={alarmType}
        onChange={(e) => setAlarmType(e.target.value)}
      >
        <option value="daily">Daily</option>
        <option value="weekday">Weekday</option>
        <option value="weekend">Weekend</option>
        <option value="one_time">One Time</option>
        <option value="smart_adaptive">Smart Adaptive</option>
      </select>

      <label>Recurrence Days</label>
      <input
        type="text"
        placeholder="MON,TUE,WED"
        value={recurrenceDays}
        onChange={(e) => setRecurrenceDays(e.target.value)}
      />

      <div>
        <label>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Is Active
        </label>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={snoozeEnabled}
            onChange={(e) => setSnoozeEnabled(e.target.checked)}
          />
          Snooze Enabled
        </label>
      </div>

      <label>Snooze Limit</label>
      <input
        type="number"
        min="0"
        value={snoozeLimit}
        onChange={(e) => setSnoozeLimit(Number(e.target.value))}
      />

      <button type="submit">Create Alarm</button>
    </form>
  );
}

export default CreateAlarmForm;