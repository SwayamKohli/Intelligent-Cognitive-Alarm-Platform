import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../services/api";

function CoachDashboard() {
    const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/coach/users");
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  fetchUsers();
}, []);
   const tableVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const rowVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};
  return (
    <motion.div
      className="glass-card profile-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h2>Coach Dashboard</h2>

      <p>Assigned Users</p>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Habit Score</th>
          </tr>
        </thead>

        <motion.tbody
  variants={tableVariants}
  initial="hidden"
  animate="visible"
>
          
  {loading ? (
    <tr>
      <td colSpan="3" style={{ textAlign: "center" }}>
        Loading...
      </td>
    </tr>
  ) : users.length === 0 ? (
    <tr>
      <td colSpan="3" style={{ textAlign: "center" }}>
        No users available
      </td>
    </tr>
  ) : (
    users.map((user) => (
      <motion.tr key={user.id} variants={rowVariants}>
        <td>{user.name}</td>
        <td>{user.email}</td>
        <td>{user.habit_score ?? "N/A"}</td>
      </motion.tr>
    ))
  )}

        </motion.tbody>
      </table>
    </motion.div>
  );
}

export default CoachDashboard;