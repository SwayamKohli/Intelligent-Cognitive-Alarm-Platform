import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { staggerContainer, staggerItem } from "../lib/motion";

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const AXIS_COLOR = "#6F6B64"; // matches --text-dim

// Reads a breakdown field whether it's nested under `breakdown` or flat on the root
function getMetric(habitScore, key) {
  return habitScore?.breakdown?.[key] ?? habitScore?.[key] ?? 0;
}

const BADGES = [
  {
    key: "consistency",
    label: "Consistency Champion",
    icon: "◈",
    getUnlocked: (h) => getMetric(h, "consistency") >= 80,
  },
  {
    key: "challenge_rate",
    label: "Challenge Master",
    icon: "✦",
    getUnlocked: (h) => getMetric(h, "challenge_rate") === 100,
  },
  {
    key: "snooze_reduction",
    label: "Snooze Buster",
    icon: "◐",
    getUnlocked: (h) => getMetric(h, "snooze_reduction") >= 50,
  },
  {
    key: "sleep_adherence",
    label: "Early Riser",
    icon: "▲",
    getUnlocked: (h) => getMetric(h, "sleep_adherence") >= 80,
  },
];

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#131316",
    border: "1px solid rgba(244,197,66,0.25)",
    borderRadius: 10,
    fontSize: 13,
  },
  labelStyle: { color: "#F5F0E6" },
};

const AnalyticsPanel = ({ habitScore, recommendations }) => {
  const trendData =
  habitScore?.weekly_trends ??
  [
    { day: "Mon", consistency: 82, snooze: 12, challengeTime: 42 },
    { day: "Tue", consistency: 88, snooze: 9, challengeTime: 39 },
    { day: "Wed", consistency: 79, snooze: 15, challengeTime: 45 },
    { day: "Thu", consistency: 91, snooze: 6, challengeTime: 34 },
    { day: "Fri", consistency: 86, snooze: 10, challengeTime: 37 },
    { day: "Sat", consistency: 93, snooze: 5, challengeTime: 30 },
    { day: "Sun", consistency: 89, snooze: 8, challengeTime: 35 },
  ];
  const score = habitScore?.habit_score ?? habitScore?.overall_score ?? habitScore?.score ?? 0;
  const offset = CIRCUMFERENCE - (Math.min(score, 100) / 100) * CIRCUMFERENCE;

  const statusLabel =
    score >= 80 ? "Excellent consistency" : score >= 60 ? "Good progress — keep going" : "Room to build your routine";

  const recCards = [
    { key: "sleep", label: "Sleep", text: recommendations?.sleep },
    { key: "wake_up", label: "Wake-Up", text: recommendations?.wake_up },
    { key: "habit", label: "Habit", text: recommendations?.habit },
    { key: "productivity", label: "Productivity", text: recommendations?.productivity },
  ];

  const breakdownRows = [
    { key: "consistency", label: "Consistency" },
    { key: "challenge_rate", label: "Challenge Rate" },
    { key: "snooze_reduction", label: "Snooze Reduction" },
    { key: "sleep_adherence", label: "Sleep Adherence" },
  ];

  return (
    <div className="analytics-panel">
      <div className="analytics-section">
        <div className="habit-score-card">
          <p className="score-eyebrow">Overall Habit Score</p>

          <div className="score-ring-wrapper">
            <svg viewBox="0 0 130 130" className="score-ring">
              <circle cx="65" cy="65" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <motion.circle
                cx="65"
                cy="65"
                r={RADIUS}
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                initial={{ strokeDashoffset: CIRCUMFERENCE }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                transform="rotate(-90 65 65)"
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f4c542" />
                  <stop offset="100%" stopColor="#b8862b" />
                </linearGradient>
              </defs>
            </svg>
            <div className="score-ring-value">
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                {Math.round(score)}
              </motion.span>
              <small>/ 100</small>
            </div>
          </div>

          <p className="score-status">{statusLabel}</p>

          <div className="breakdown-list">
            {breakdownRows.map((row) => {
              const value = getMetric(habitScore, row.key);
              return (
                <div key={row.key} className="breakdown-row">
                  <span className="breakdown-label">{row.label}</span>
                  <div className="breakdown-bar-track">
                    <motion.div
                      className="breakdown-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(value, 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <span className="breakdown-value">{value}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="analytics-section">
        <h3>Achievements</h3>

        <motion.div className="badges-grid" variants={staggerContainer} initial="initial" animate="animate">
          {BADGES.map((badge) => {
            const unlocked = badge.getUnlocked(habitScore);
            return (
              <motion.div
                key={badge.key}
                className={unlocked ? "badge-card unlocked" : "badge-card"}
                variants={staggerItem}
                whileHover={unlocked ? { y: -3 } : {}}
              >
                <span className="badge-glyph">{badge.icon}</span>
                <h4>{badge.label}</h4>
                <span className="badge-state">{unlocked ? "Unlocked" : "Locked"}</span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <div className="analytics-section">
        <h3>Recommendations</h3>

        <motion.div className="recommendation-grid" variants={staggerContainer} initial="initial" animate="animate">
          {recCards.map((rec) => (
            <motion.div key={rec.key} className="recommendation-card" variants={staggerItem}>
              <strong>{rec.label}</strong>
              <p>{rec.text || "No recommendation available yet."}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
            <div className="analytics-section">
        <h3>Historical Trends</h3>

        <div className="trend-grid">
          <div className="trend-card">
            <h4>7-Day Wake-up Consistency</h4>

            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="day" stroke={AXIS_COLOR} />
                <YAxis stroke={AXIS_COLOR} />
                <Tooltip {...TOOLTIP_STYLE} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="trend-card">
            <h4>Average Snooze Delay (mins)</h4>

            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="day" stroke={AXIS_COLOR} />
                <YAxis stroke={AXIS_COLOR} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="snooze" fill="#f4c542" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="trend-card trend-card-full">
            <h4>Cognitive Challenge Completion Time (sec)</h4>

            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="day" stroke={AXIS_COLOR} />
                <YAxis stroke={AXIS_COLOR} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Line
                  type="monotone"
                  dataKey="challengeTime"
                  stroke="#b8862b"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;