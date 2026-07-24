const AnalyticsPanel = ({ habitScore, recommendations }) => {
  const score = habitScore?.overall_score ?? habitScore?.score ?? 0;

  return (
    <div className="analytics-panel">
      <h2>📊 Analytics Dashboard</h2>

      {/* Habit Score */}
      <div className="analytics-section">
        <div className="habit-score-card">
          <h4>Overall Habit Score</h4>

          <div className="score-circle">
            <span>{score}%</span>
          </div>

          <p>
            {score >= 80
              ? "Excellent consistency!"
              : score >= 60
              ? "Good progress. Keep going!"
              : "Let's improve your routine."}
          </p>
        </div>
      </div>

      {/* Achievements */}
      <div className="analytics-section">
        <h3>Achievements</h3>

        <div className="badges-grid">
          <div className="badge-card">
            <div>😴</div>
            <h4>Sleep</h4>
          </div>

          <div className="badge-card">
            <div>🌅</div>
            <h4>Wake Up</h4>
          </div>

          <div className="badge-card">
            <div>🔥</div>
            <h4>Habit</h4>
          </div>

          <div className="badge-card">
            <div>⚡</div>
            <h4>Productivity</h4>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="analytics-section">
        <h3>AI Recommendations</h3>

        <div className="recommendation-card">
          <strong>😴 Sleep</strong>
          <p>{recommendations?.sleep || "No recommendation available."}</p>
        </div>

        <div className="recommendation-card">
          <strong>🌅 Wake Up</strong>
          <p>{recommendations?.wake_up || "No recommendation available."}</p>
        </div>

        <div className="recommendation-card">
          <strong>🔥 Habit</strong>
          <p>{recommendations?.habit || "No recommendation available."}</p>
        </div>

        <div className="recommendation-card">
          <strong>⚡ Productivity</strong>
          <p>{recommendations?.productivity || "No recommendation available."}</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;