import React, { useEffect, useState } from "react";

function AdminDashboard() {
    const [metrics, setMetrics] = useState({
  user_growth: {
    total_registered: 0,
    active_daily: 0,
  },
  global_snooze: {
    average_active_snoozes: 0,
    total_active_alarms: 0,
  },
  engine_failure_rates: [],
});
useEffect(() => {
  const fetchMetrics = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/admin/metrics",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.log("Failed to fetch metrics");
        return;
      }

      const data = await response.json();
      console.log(data);

      setMetrics(data);
    } catch (error) {
      console.log(error);
    }
  };

  fetchMetrics();
}, []);
  return (
    <div style={{ padding: "30px" }}>
      <h1>Admin Dashboard</h1>

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        <div
          style={{
            border: "1px solid #ccc",
            padding: "20px",
            borderRadius: "10px",
            width: "220px",
          }}
        >
          <h3>Total Registered Users</h3>
          <h2>{metrics.user_growth.total_registered}</h2>
        </div>

        <div
          style={{
            border: "1px solid #ccc",
            padding: "20px",
            borderRadius: "10px",
            width: "220px",
          }}
        >
          <h3>Daily Active Users</h3>
          <h2>{metrics.user_growth.active_daily}</h2>
        </div>

        <div
          style={{
            border: "1px solid #ccc",
            padding: "20px",
            borderRadius: "10px",
            width: "220px",
          }}
        >
          <h3>Average Snoozes</h3>
          <h2>{metrics.global_snooze.average_active_snoozes}</h2>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;