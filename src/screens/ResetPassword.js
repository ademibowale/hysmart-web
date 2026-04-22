import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [validSession, setValidSession] = useState(false);

  /* ================= HANDLE RECOVERY ================= */
  useEffect(() => {
    const handleRecovery = async () => {
      try {
        // 🔥 Supabase automatically handles recovery if URL is correct
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (data?.session) {
          setValidSession(true);
        } else {
          // 🔥 Try manual recovery (fallback)
          const hash = window.location.hash;

          if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const access_token = params.get("access_token");
            const refresh_token = params.get("refresh_token");

            if (access_token && refresh_token) {
              await supabase.auth.setSession({
                access_token,
                refresh_token,
              });

              setValidSession(true);
              return;
            }
          }

          alert("Invalid or expired reset link");
          navigate("/");
        }
      } catch (err) {
        console.log("Recovery error:", err);
        alert("Something went wrong");
        navigate("/");
      } finally {
        setChecking(false);
      }
    };

    handleRecovery();
  }, [navigate]);

  /* ================= VALIDATION ================= */
  const validateForm = () => {
    if (!password || !confirmPassword) {
      alert("All fields are required");
      return false;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return false;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return false;
    }

    return true;
  };

  /* ================= UPDATE PASSWORD ================= */
  const handleUpdatePassword = async () => {
    if (loading) return;
    if (!validateForm()) return;

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      alert("✅ Password updated successfully");

      // 🔥 logout + redirect clean
      await supabase.auth.signOut();
      navigate("/");

    } catch (err) {
      alert(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOADING ================= */
  if (checking) {
    return (
      <div style={styles.page}>
        <p style={{ color: "#FFD700" }}>Verifying reset link...</p>
      </div>
    );
  }

  /* ================= INVALID ================= */
  if (!validSession) {
    return (
      <div style={styles.page}>
        <p style={{ color: "red" }}>Invalid or expired link</p>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Set New Password</h1>

        <input
          style={styles.input}
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          style={{
            ...styles.button,
            opacity: loading ? 0.6 : 1,
          }}
          onClick={handleUpdatePassword}
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "linear-gradient(135deg, #000, #111)",
  },

  card: {
    width: "350px",
    padding: "30px",
    borderRadius: "12px",
    backgroundColor: "#111",
    boxShadow: "0 0 25px rgba(255, 215, 0, 0.15)",
    display: "flex",
    flexDirection: "column",
  },

  title: {
    color: "#FFD700",
    textAlign: "center",
    marginBottom: "25px",
    fontWeight: "700",
  },

  input: {
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #333",
    backgroundColor: "#000",
    color: "#fff",
    outline: "none",
  },

  button: {
    backgroundColor: "#FFD700",
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "10px",
  },
};