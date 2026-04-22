import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Signup() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  /* ================= VALIDATION ================= */
  const validateForm = () => {
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    if (!cleanUsername || !cleanEmail || !password || !confirmPassword) {
      setError("All fields are required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (cleanUsername.length < 3) {
      setError("Username must be at least 3 characters");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  /* ================= SIGNUP ================= */
  const handleSignup = async () => {
    if (loading) return;
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError("");

      const cleanEmail = email.trim().toLowerCase();
      const cleanUsername = username.trim();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            username: cleanUsername,
            role: "user",
            plan: "Free",
            joined_at: new Date().toISOString(),
            status: "active",
          },
        },
      });

      if (error) throw error;

      if (data?.user && !data?.session) {
        alert("✅ Signup successful!\n\nPlease check your email to confirm your account.\n\nAfter confirmation, you can log in.");
        navigate("/");
        return;
      }

      if (data?.session) {
        alert("✅ Account created successfully! Welcome to HYSMART!");
        navigate("/dashboard", { replace: true });
      }

    } catch (err) {
      console.error("Signup error:", err);

      if (err.message.includes("User already registered")) {
        setError("This email is already registered. Please login instead.");
      } else if (err.message.includes("Password should be at least 6 characters")) {
        setError("Password must be at least 6 characters");
      } else {
        setError(err.message || "Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleSignup();
    }
  };

  const isDisabled = !username.trim() || !email.trim() || !password || !confirmPassword || loading;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.logoContainer}>
            <div style={styles.ballIcon}>⚽</div>
            <h1 style={styles.title}>HYSMART</h1>
          </div>
          <p style={styles.subtitle}>Create Account</p>

          {error && (
            <div style={styles.errorContainer}>
              <span style={styles.errorIcon}>⚠️</span>
              <p style={styles.errorMessage}>{error}</p>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Enter username (min. 3 characters)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={loading}
              autoCapitalize="none"
              maxLength={20}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              style={styles.input}
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordContainer}>
              <input
                style={styles.passwordInput}
                type={showPassword ? "text" : "password"}
                placeholder="Enter password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                style={styles.toggle}
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <div style={styles.passwordContainer}>
              <input
                style={styles.passwordInput}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                style={styles.toggle}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            style={{
              ...styles.button,
              opacity: isDisabled ? 0.6 : 1,
            }}
            onClick={handleSignup}
            disabled={isDisabled}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

          <div style={styles.divider}>
            <span style={styles.dividerLine}></span>
            <span style={styles.dividerText}>or</span>
            <span style={styles.dividerLine}></span>
          </div>

          <p style={styles.signup}>
            Already have an account?{" "}
            <span
              style={styles.gold}
              onClick={() => navigate("/")}
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #000000 0%, #1a1a2e 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },
  container: {
    width: "100%",
    maxWidth: "450px",
  },
  card: {
    background: "#111",
    borderRadius: "16px",
    padding: "40px",
    border: "1px solid #222",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  ballIcon: {
    fontSize: "40px",
    animation: "bounce 2s ease-in-out infinite",
  },
  title: {
    color: "#FFD700",
    fontSize: "32px",
    fontWeight: "bold",
    margin: 0,
  },
  subtitle: {
    color: "#fff",
    textAlign: "center",
    fontSize: "12px",
    letterSpacing: "2px",
    marginBottom: "30px",
    opacity: 0.7,
  },
  errorContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "rgba(255, 77, 77, 0.1)",
    border: "1px solid rgba(255, 77, 77, 0.3)",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "20px",
  },
  errorIcon: {
    fontSize: "18px",
  },
  errorMessage: {
    color: "#ff4d4d",
    fontSize: "13px",
    margin: 0,
    flex: 1,
  },
  inputGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    color: "#FFD700",
    fontSize: "13px",
    marginBottom: "8px",
    fontWeight: "600",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "2px solid #333",
    backgroundColor: "#000",
    color: "#fff",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  passwordContainer: {
    position: "relative",
    width: "100%",
  },
  passwordInput: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "2px solid #333",
    backgroundColor: "#000",
    color: "#fff",
    fontSize: "14px",
    boxSizing: "border-box",
    paddingRight: "70px",
  },
  toggle: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255, 215, 0, 0.1)",
    border: "none",
    color: "#FFD700",
    cursor: "pointer",
    fontSize: "12px",
    padding: "6px 12px",
    borderRadius: "6px",
  },
  button: {
    width: "100%",
    padding: "14px",
    background: "#FFD700",
    border: "none",
    borderRadius: "12px",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "10px",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    margin: "25px 0 20px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "linear-gradient(90deg, transparent, #333, transparent)",
  },
  dividerText: {
    padding: "0 15px",
    color: "#666",
    fontSize: "12px",
  },
  signup: {
    textAlign: "center",
    marginTop: "5px",
    color: "#aaa",
    fontSize: "14px",
  },
  gold: {
    color: "#FFD700",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

const addAnimations = () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    input:focus {
      outline: none;
      border-color: #FFD700 !important;
      box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.1);
    }
    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
    }
  `;
  document.head.appendChild(style);
};
addAnimations();