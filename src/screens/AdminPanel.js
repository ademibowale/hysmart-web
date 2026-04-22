import React, { useEffect, useState } from "react";
import { COLORS } from "../../theme/colors";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // TEMP API FIX
  const api = {
    get: async () => ({ data: [] }),
    post: async () => ({})
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data || []);
    } catch (err) {
      console.log("Admin users error:", err);
      alert("Unable to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const promoteUser = async (id) => {
    try {
      await api.post(`/admin/promote/${id}`);
      alert("User promoted to admin");
      fetchUsers();
    } catch (err) {
      console.log("Promote error:", err);
      alert("Failed to promote user");
    }
  };

  // LOADING
  if (loading) {
    return (
      <div style={styles.center}>
        <p style={{ color: COLORS.gold }}>Loading...</p>
      </div>
    );
  }

  // EMPTY
  if (users.length === 0) {
    return (
      <div style={styles.center}>
        <p>No users found</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>Admin Management</h2>

      {users.map((item) => (
        <div key={item.id} style={styles.card}>
          <p style={{ fontWeight: "bold" }}>{item.email}</p>

          <p>
            Role:{" "}
            <span
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                backgroundColor:
                  item.role === "admin" ? "#000" : "#ddd",
                color: item.role === "admin" ? "#fff" : "#000",
                fontWeight: "bold",
              }}
            >
              {item.role}
            </span>
          </p>

          {item.role !== "admin" && (
            <button
              style={styles.button}
              onClick={() => promoteUser(item.id)}
            >
              Promote to Admin
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// STYLES (WEB)
const styles = {
  container: {
    padding: "20px",
    backgroundColor: "#fff",
    minHeight: "100vh",
  },
  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
  },
  card: {
    backgroundColor: "#f4f4f4",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "10px",
  },
  button: {
    marginTop: "10px",
    backgroundColor: COLORS.gold,
    padding: "10px",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};