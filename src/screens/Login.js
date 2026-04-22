import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  /* ================= CHECK SESSION ================= */
  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.log("Session error:", error.message);
        }

        if (session && isMounted) {
          // ✅ NO localStorage - Supabase manages session automatically
          console.log("✅ User already logged in");
          
          const role = session.user?.user_metadata?.role || "user";
          
          if (role === "admin") {
            navigate("/admin", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        }
      } catch (err) {
        console.log("Unexpected session error:", err);
      } finally {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session && isMounted) {
          console.log("✅ Auth state changed - user logged in");
          const role = session.user?.user_metadata?.role || "user";
          if (role === "admin") {
            navigate("/admin", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [navigate]);

  /* ================= VALIDATION ================= */
  const validateForm = () => {
    setError("");
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password.trim()) {
      setError("Email and password are required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    return true;
  };

  /* ================= LOGIN ================= */
  const handleLogin = async () => {
    if (loading) return;
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError("");

      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) throw error;

      if (data?.session) {
        // ✅ NO localStorage - Supabase handles token storage automatically
        console.log("✅ Login successful - session managed by Supabase");
        
        const role = data.user.user_metadata?.role || "user";
        
        if (role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }

    } catch (err) {
      console.error("Login error:", err);
      
      if (err.message.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please try again.");
      } else if (err.message.includes("Email not confirmed")) {
        setError("Please verify your email address before logging in.");
      } else if (err.message.includes("network")) {
        setError("Network error. Please check your connection.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
      
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  /* ================= ENTER KEY SUPPORT ================= */
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  const isDisabled = !email.trim() || !password.trim() || loading;

  /* ================= LOADING SCREEN ================= */
  if (checkingSession) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.logoContainer}>
            <div style={styles.ballIcon}>⚽</div>
            <h1 style={styles.title}>HYSMART</h1>
          </div>
          <p style={styles.subtitle}>PREDICTIONS</p>

          {error && (
            <div style={styles.errorContainer}>
              <span style={styles.errorIcon}>⚠️</span>
              <p style={styles.errorMessage}>{error}</p>
            </div>
          )}

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
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordContainer}>
              <input
                style={styles.passwordInput}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={loading}
                autoComplete="current-password"
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

          <p
            style={styles.forgot}
            onClick={() => navigate("/forgot-password")}
          >
            Forgot Password?
          </p>

          <button
            style={{
              ...styles.button,
              opacity: isDisabled ? 0.6 : 1,
              cursor: isDisabled ? "not-allowed" : "pointer",
            }}
            onClick={handleLogin}
            disabled={isDisabled}
          >
            {loading ? (
              <span style={styles.buttonContent}>
                <span style={styles.buttonSpinner}></span>
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>

          <div style={styles.divider}>
            <span style={styles.dividerLine}></span>
            <span style={styles.dividerText}>or</span>
            <span style={styles.dividerLine}></span>
          </div>

          <p style={styles.signup}>
            Don't have an account?{" "}
            <span
              style={styles.gold}
              onClick={() => navigate("/signup")}
            >
              Sign Up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

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
  forgot: {
    color: "#FFD700",
    textAlign: "right",
    cursor: "pointer",
    marginBottom: "25px",
    fontSize: "12px",
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
  buttonContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  buttonSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(0, 0, 0, 0.2)",
    borderTopColor: "#000",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
    display: "inline-block",
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
  loadingContainer: {
    textAlign: "center",
  },
  spinner: {
    width: "40px",
    height: "40px",
    margin: "0 auto 15px",
    border: "3px solid rgba(255, 215, 0, 0.2)",
    borderTopColor: "#FFD700",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    color: "#FFD700",
    fontSize: "14px",
  },
};

// Add animations
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
    input:focus, select:focus {
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