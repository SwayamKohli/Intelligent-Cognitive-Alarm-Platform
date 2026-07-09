import { useState } from "react";
import { motion } from "framer-motion";
import api from "../lib/api";
import { staggerContainer, staggerItem } from "../lib/motion";

const AVAILABLE_CHALLENGES = [
  "math", "memory", "pattern", "logic", "word_scramble", "riddle", "quiz",
];

const ALARM_TYPES = [
  { value: "daily", label: "Daily" },
  { value: "weekday", label: "Weekday" },
  { value: "weekend", label: "Weekend" },
  { value: "one_time", label: "One Time" },
  { value: "smart_adaptive", label: "Smart Adaptive" },
];

function CreateAlarmForm({ onAlarmCreated }) {
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("");
  const [alarmType, setAlarmType] = useState("daily");
  const [isActive, setIsActive] = useState(true);
  const [recurrenceDays, setRecurrenceDays] = useState("");
  const [snoozeEnabled, setSnoozeEnabled] = useState(true);
  const [snoozeLimit, setSnoozeLimit] = useState(3);
  const [preferredChallenges, setPreferredChallenges] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChallengeToggle = (challenge) => {
    setPreferredChallenges((prev) =>
      prev.includes(challenge)
        ? prev.filter((c) => c !== challenge)
        : [...prev, challenge]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!label || !time) {
      setErrorMsg("Please provide a label and time.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/alarms/", {
        label,
        time,
        alarm_type: alarmType,
        is_active: isActive,
        recurrence_days: recurrenceDays || null,
        snooze_enabled: snoozeEnabled,
        snooze_limit: snoozeLimit,
        preferred_challenges:
          preferredChallenges.length > 0 ? preferredChallenges.join(",") : null,
      });

      setLabel("");
      setTime("");
      setAlarmType("daily");
      setIsActive(true);
      setRecurrenceDays("");
      setSnoozeEnabled(true);
      setSnoozeLimit(3);
      setPreferredChallenges([]);

      onAlarmCreated?.();
    } catch (error) {
      console.error(error);
      const detail = error.response?.data?.detail;
      setErrorMsg(
        typeof detail === "string" ? detail : "Failed to create alarm."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="create-alarm-form"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Create Alarm</h3>

      <div className="field-group">
        <label>Alarm Label</label>
        <input
          type="text"
          placeholder="Morning Workout"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>

      <div className="field-row">
        <div className="field-group">
          <label>Alarm Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <div className="field-group">
          <label>Alarm Type</label>
          <select value={alarmType} onChange={(e) => setAlarmType(e.target.value)}>
            {ALARM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field-group">
        <label>Recurrence Days</label>
        <input
          type="text"
          placeholder="Mon,Tue,Wed"
          value={recurrenceDays}
          onChange={(e) => setRecurrenceDays(e.target.value)}
        />
      </div>

      <div className="field-group">
        <label>Allowed Challenges</label>
        <p className="field-hint">Leave blank to allow all challenge types</p>
        <motion.div
          className="chip-grid"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {AVAILABLE_CHALLENGES.map((challenge) => {
            const active = preferredChallenges.includes(challenge);
            return (
              <motion.button
                type="button"
                key={challenge}
                variants={staggerItem}
                className={active ? "chip active" : "chip"}
                onClick={() => handleChallengeToggle(challenge)}
                whileTap={{ scale: 0.95 }}
              >
                {challenge.replace("_", " ")}
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      <div className="field-row">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active
        </label>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={snoozeEnabled}
            onChange={(e) => setSnoozeEnabled(e.target.checked)}
          />
          Snooze Enabled
        </label>
      </div>

      <div className="field-group">
        <label>Snooze Limit</label>
        <input
          type="number"
          min="0"
          value={snoozeLimit}
          onChange={(e) => setSnoozeLimit(Number(e.target.value))}
        />
      </div>

      {errorMsg && <p className="auth-error">{errorMsg}</p>}

      <motion.button
        type="submit"
        className="btn-accent full-width"
        disabled={submitting}
        whileTap={{ scale: 0.97 }}
      >
        {submitting ? "Creating…" : "Create Alarm"}
      </motion.button>
    </motion.form>
  );
}

export default CreateAlarmForm;