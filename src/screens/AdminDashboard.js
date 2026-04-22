import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: { total: 0, trial: 0, gold: 0, premium: 0, vip: 0, expired: 0, newToday: 0, newThisWeek: 0 },
    subscriptions: { active: 0, totalRevenue: 0, revenueThisMonth: 0, byPlan: { gold: 0, premium: 0, vip: 0 } },
    predictions: { total: 0, today: 0, upcoming: 0, completed: 0, accuracy: 0, premium: 0, vip: 0 },
    payments: { total: 0, pending: 0, completed: 0, failed: 0, totalAmount: 0 },
    recentUsers: [],
    recentPayments: []
  });
  const [showUserModal, setShowUserModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);

  // New state for earnings & accuracy
  const [earnings, setEarnings] = useState({ totalNGN: 0, totalUSD: 0, monthly: {} });
  const [accuracy, setAccuracy] = useState({ overall: {}, byPlan: { vip: {}, premium: {}, free: {} } });

  // Get auth token for admin API calls
  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  // Check admin access
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/dashboard");
        return;
      }
      const { data: userData } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      if (!userData?.is_admin) {
        navigate("/dashboard");
        return;
      }
    };
    checkAdmin();
  }, [navigate]);

  // Fetch all admin stats (core RPC + earnings + accuracy)
  const fetchAllStats = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No token");

      // 1. Core stats via RPC
      const { data: statsData, error: statsError } = await supabase.rpc("get_admin_stats");
      if (statsError) throw statsError;
      setStats(statsData);

      // 2. Earnings
      const earningsRes = await fetch("/api/admin/earnings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const earningsData = await earningsRes.json();
      if (earningsData.success) {
        setEarnings(earningsData);
      } else {
        console.warn("Earnings API returned error:", earningsData.error);
      }

      // 3. Accuracy stats
      const accuracyRes = await fetch("/api/admin/accuracy-stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const accuracyData = await accuracyRes.json();
      if (accuracyData.success) {
        setAccuracy(accuracyData);
      } else {
        console.warn("Accuracy API returned error:", accuracyData.error);
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all users for management modal
  const fetchAllUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, plan, subscription_status, created_at, subscription_end")
      .order("created_at", { ascending: false });
    if (!error) setAllUsers(data);
  };

  const openUserModal = async () => {
    await fetchAllUsers();
    setShowUserModal(true);
  };

  const updateUserPlan = async (userId, newPlan) => {
    setUpdatingUserId(userId);
    try {
      let planValue = newPlan;
      if (newPlan === "Gold") planValue = "Gold Plan";
      else if (newPlan === "Premium") planValue = "Premium Plan";
      else if (newPlan === "VIP") planValue = "VIP Plan";
      else if (newPlan === "Free") planValue = "Free";

      const { error } = await supabase
        .from("users")
        .update({ plan: planValue, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) throw error;

      await fetchAllUsers();
      await fetchAllStats();
      alert("User plan updated");
    } catch (err) {
      alert("Error updating plan: " + err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = allUsers.filter(u =>
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  const formatCurrency = (amount, currency = "NGN") => {
    return currency === "NGN" ? `₦${amount.toLocaleString()}` : `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPlanBadgeStyle = (plan) => {
    if (plan === "Gold Plan") return { ...styles.badge, background: "#B8860B", color: "#fff" };
    if (plan === "Premium Plan") return { ...styles.badge, background: "#D2691E", color: "#fff" };
    if (plan === "VIP Plan") return { ...styles.badge, background: "#8B0000", color: "#fff" };
    if (plan === "Trial") return { ...styles.badge, background: "#008080", color: "#fff" };
    return { ...styles.badge, background: "#444", color: "#fff" };
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ color: "#FFD700" }}>Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <button style={styles.logoutBtn} onClick={() => supabase.auth.signOut()}>
          Logout
        </button>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        {/* Users */}
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>👥 Total Users</h3>
          <p style={styles.statNumber}>{stats.users.total}</p>
          <div style={styles.statDetails}>
            <span>📊 Trial: {stats.users.trial}</span>
            <span>🥇 Gold: {stats.users.gold}</span>
            <span>⭐ Premium: {stats.users.premium}</span>
            <span>👑 VIP: {stats.users.vip}</span>
            <span>⏰ Expired: {stats.users.expired}</span>
          </div>
          <div style={styles.statFooter}>
            <span>🆕 Today: +{stats.users.newToday}</span>
            <span>📅 This Week: +{stats.users.newThisWeek}</span>
          </div>
        </div>

        {/* Subscriptions */}
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>💎 Active Subscriptions</h3>
          <p style={styles.statNumber}>{stats.subscriptions.active}</p>
          <div style={styles.statDetails}>
            <span>🥇 Gold: {stats.subscriptions.byPlan.gold}</span>
            <span>⭐ Premium: {stats.subscriptions.byPlan.premium}</span>
            <span>👑 VIP: {stats.subscriptions.byPlan.vip}</span>
          </div>
          <div style={styles.statFooter}>
            <span>💰 Total Revenue: {formatCurrency(stats.subscriptions.totalRevenue)}</span>
            <span>📅 This Month: {formatCurrency(stats.subscriptions.revenueThisMonth)}</span>
          </div>
        </div>

        {/* Predictions */}
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>⚽ Predictions</h3>
          <p style={styles.statNumber}>{stats.predictions.total}</p>
          <div style={styles.statDetails}>
            <span>📅 Today: {stats.predictions.today}</span>
            <span>⏳ Upcoming: {stats.predictions.upcoming}</span>
            <span>✅ Completed: {stats.predictions.completed}</span>
            <span>🎯 Accuracy: {stats.predictions.accuracy}%</span>
            <span>⭐ Premium: {stats.predictions.premium}</span>
            <span>👑 VIP: {stats.predictions.vip}</span>
          </div>
        </div>

        {/* Payments */}
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>💳 Payments</h3>
          <p style={styles.statNumber}>{stats.payments.total}</p>
          <div style={styles.statDetails}>
            <span>✅ Completed: {stats.payments.completed}</span>
            <span>⏳ Pending: {stats.payments.pending}</span>
            <span>❌ Failed: {stats.payments.failed}</span>
          </div>
          <div style={styles.statFooter}>
            <span>💰 Total: {formatCurrency(stats.payments.totalAmount)}</span>
          </div>
        </div>

        {/* NEW: Earnings Section */}
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>💰 Total Earnings</h3>
          <p style={styles.statNumber}>₦{earnings.totalNGN?.toLocaleString()}</p>
          <p style={styles.statFooter}>${earnings.totalUSD?.toLocaleString()} USD</p>
          <div style={styles.statDetails}>
            {Object.entries(earnings.monthly || {}).slice(-3).map(([month, amounts]) => (
              <span key={month}>{month}: ₦{amounts.NGN?.toLocaleString()}</span>
            ))}
          </div>
        </div>

        {/* NEW: Accuracy Tracking */}
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>📈 Prediction Accuracy</h3>
          <p style={styles.statNumber}>{accuracy.overall?.accuracy_percentage || 0}%</p>
          <div style={styles.statDetails}>
            <span>VIP: {accuracy.byPlan?.vip?.accuracy || 0}%</span>
            <span>Premium: {accuracy.byPlan?.premium?.accuracy || 0}%</span>
            <span>Free: {accuracy.byPlan?.free?.accuracy || 0}%</span>
          </div>
        </div>
      </div>

      {/* Recent Users Table */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📋 Recent Users</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr><th>Email</th><th>Plan</th><th>Status</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {stats.recentUsers.map((user, index) => (
                <tr key={index}>
                  <td>{user.email}</td>
                  <td><span style={getPlanBadgeStyle(user.plan)}>
                    {user.plan === "Gold Plan" ? "🥇 Gold" : 
                     user.plan === "Premium Plan" ? "⭐ Premium" : 
                     user.plan === "VIP Plan" ? "👑 VIP" : 
                     user.plan === "Trial" ? "🎁 Trial" : "📋 Free"}
                  </span></td>
                  <td><span style={user.subscription_status === "active" ? styles.activeBadge : styles.inactiveBadge}>
                    {user.subscription_status || "inactive"}
                  </span></td>
                  <td>{formatDate(user.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Payments Table */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>💰 Recent Payments</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr><th>User</th><th>Plan</th><th>Amount</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {stats.recentPayments.map((payment, index) => (
                <tr key={index}>
                  <td>{payment.users?.email || "N/A"}</td>
                  <td>{payment.plan_name}</td>
                  <td>{formatCurrency(payment.amount, payment.currency)}</td>
                  <td><span style={
                      payment.status === "completed" ? styles.successBadge :
                      payment.status === "pending" ? styles.warningBadge : styles.dangerBadge
                    }>{payment.status}</span></td>
                  <td>{formatDate(payment.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.quickActions}>
        <button style={styles.actionBtn} onClick={openUserModal}>👥 Manage Users</button>
        <button style={styles.actionBtn} onClick={() => alert("Manage Predictions - coming soon")}>⚽ Manage Predictions</button>
        <button style={styles.actionBtn} onClick={() => alert("View Subscriptions - coming soon")}>💎 View Subscriptions</button>
        <button style={styles.actionBtn} onClick={() => alert("View Payments - coming soon")}>💳 View Payments</button>
      </div>

      {/* User Management Modal */}
      {showUserModal && (
        <div style={styles.modalOverlay} onClick={() => setShowUserModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ color: "#FFD700" }}>👥 Manage Users</h2>
              <button style={styles.closeBtn} onClick={() => setShowUserModal(false)}>✕</button>
            </div>
            <input
              type="text"
              placeholder="Search by email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              style={styles.searchInput}
            />
            <div style={styles.modalTableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr><th>Email</th><th>Current Plan</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>{user.plan || "Free"}</td>
                      <td><span style={user.subscription_status === "active" ? styles.activeBadge : styles.inactiveBadge}>
                        {user.subscription_status || "inactive"}
                      </span></td>
                      <td>
                        <select
                          defaultValue={user.plan === "Gold Plan" ? "Gold" : user.plan === "Premium Plan" ? "Premium" : user.plan === "VIP Plan" ? "VIP" : "Free"}
                          onChange={(e) => updateUserPlan(user.id, e.target.value)}
                          disabled={updatingUserId === user.id}
                          style={styles.select}
                        >
                          <option value="Free">Free</option>
                          <option value="Gold">Gold Plan</option>
                          <option value="Premium">Premium Plan</option>
                          <option value="VIP">VIP Plan</option>
                        </select>
                        {updatingUserId === user.id && <span style={{ color: "#FFD700" }}> ⏳</span>}
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ================= STYLES (no black text) =================
const styles = {
  container: {
    minHeight: "100vh",
    background: "#0a0a0a",
    padding: "20px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#0a0a0a",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(255, 215, 0, 0.3)",
    borderTopColor: "#FFD700",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    flexWrap: "wrap",
    gap: "15px",
  },
  title: {
    color: "#FFD700",
    fontSize: "28px",
    margin: 0,
  },
  logoutBtn: {
    background: "#ff4d4d",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
  statCard: {
    background: "#1a1a1a",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #FFD700",
  },
  statTitle: {
    color: "#FFD700",
    fontSize: "16px",
    marginBottom: "10px",
  },
  statNumber: {
    color: "#00ffcc",
    fontSize: "36px",
    fontWeight: "bold",
    marginBottom: "15px",
  },
  statDetails: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "10px",
    fontSize: "12px",
    color: "#ddd",
  },
  statFooter: {
    borderTop: "1px solid #333",
    paddingTop: "10px",
    marginTop: "10px",
    fontSize: "12px",
    color: "#FFD700",
    display: "flex",
    justifyContent: "space-between",
  },
  section: {
    background: "#111",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "30px",
    border: "1px solid #333",
  },
  sectionTitle: {
    color: "#FFD700",
    fontSize: "20px",
    marginBottom: "20px",
  },
  tableContainer: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    color: "#FFD700",
    borderBottom: "1px solid #333",
  },
  td: {
    padding: "12px",
    color: "#fff",
    borderBottom: "1px solid #222",
  },
  badge: {
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "bold",
    display: "inline-block",
    color: "#fff",
  },
  activeBadge: {
    background: "#2E7D32",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "bold",
  },
  inactiveBadge: {
    background: "#555",
    color: "#ddd",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "bold",
  },
  successBadge: {
    background: "#2E7D32",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "bold",
  },
  warningBadge: {
    background: "#ED6C02",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "bold",
  },
  dangerBadge: {
    background: "#D32F2F",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "bold",
  },
  quickActions: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  actionBtn: {
    background: "linear-gradient(135deg, #FFD700, #FFA500)",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
    color: "#1a1a1a",  // dark gray instead of black
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.95)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "#1a1a1a",
    borderRadius: "16px",
    maxWidth: "900px",
    width: "90%",
    maxHeight: "80vh",
    overflow: "auto",
    padding: "25px",
    border: "1px solid #FFD700",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  closeBtn: {
    background: "#ff4d4d",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#fff",
    fontSize: "16px",
  },
  searchInput: {
    width: "100%",
    padding: "12px",
    background: "#2a2a2a",
    border: "1px solid #444",
    borderRadius: "8px",
    color: "#fff",
    marginBottom: "20px",
    fontSize: "14px",
  },
  modalTableContainer: {
    overflowX: "auto",
  },
  select: {
    background: "#2a2a2a",
    color: "#fff",
    border: "1px solid #FFD700",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    marginRight: "8px",
  },
};

// Inject keyframes for spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
if (!document.querySelector("#admin-styles")) {
  styleSheet.id = "admin-styles";
  document.head.appendChild(styleSheet);
}