// In your Admin.js component
import React, { useEffect, useState } from "react";
import { 
  getAllUsers, 
  updateUserRole, 
  deleteUser,
  getUserStats ,
} from "../utils/adminUtils";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Fetch users
    const usersResult = await getAllUsers();
    if (usersResult.success) {
      setUsers(usersResult.data);
    }
    
    // Fetch stats
    const statsResult = await getUserStats();
    if (statsResult.success) {
      setStats(statsResult.data);
    }
    
    setLoading(false);
  };

  const handleUpdateRole = async (userId, newRole) => {
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      alert(result.message);
      await loadData(); // Refresh list
    } else {
      alert("Error: " + result.error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure?")) {
      const result = await deleteUser(userId);
      if (result.success) {
        alert(result.message);
        await loadData();
      } else {
        alert("Error: " + result.error);
      }
    }
  };

  return (
    <div>
      {/* Your admin UI here */}
    </div>
  );
}