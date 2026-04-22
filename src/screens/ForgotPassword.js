import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= VALIDATION ================= */
  const validateEmail = () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      alert("Email is required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      alert("Enter a valid email");
      return false;
    }

    return true;
  };

  /* ================= RESET ================= */
  const handleReset = async () => {
    if (loading) return;
    if (!validateEmail()) return;

    try {
      setLoading(true);

      const redirectUrl = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: redirectUrl,
        }
      );

      if (error) throw error;

      alert("✅ Password reset link sent! Check your email.");

      setEmail("");
      navigate("/");

    } catch (err) {
      alert(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !email.trim() || loading;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Reset Password</h1>

        <input
          style={styles.input}
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          style={{
            ...styles.button,
            opacity: isDisabled ? 0.6 : 1,
          }}
          onClick={handleReset}
          disabled={isDisabled}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <p
          style={styles.back}
          onClick={() => navigate("/")}
        >
          Back to Login
        </p>
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
    marginBottom: "20px",
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
  },

  back: {
    color: "#FFD700",
    marginTop: "20px",
    textAlign: "center",
    cursor: "pointer",
    fontSize: "14px",
  },
};