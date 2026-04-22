import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function PaymentStatusScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    const verify = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const reference = params.get("reference");
        
        if (!reference) {
          setStatus("error");
          setMessage("Invalid payment reference");
          return;
        }
        
        // Simulate payment verification
        setTimeout(() => {
          setStatus("success");
          setMessage("Payment successful! Redirecting to dashboard...");
          setTimeout(() => {
            navigate("/dashboard");
          }, 3000);
        }, 2000);
        
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("error");
        setMessage("An error occurred. Please contact support.");
      }
    };
    
    verify();
  }, [location, navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {status === "verifying" && (
          <>
            <div style={styles.spinner}></div>
            <h2 style={styles.title}>Processing Payment</h2>
            <p style={styles.message}>{message}</p>
          </>
        )}
        
        {status === "success" && (
          <>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>Payment Successful!</h2>
            <p style={styles.message}>{message}</p>
            <button style={styles.button} onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </button>
          </>
        )}
        
        {status === "error" && (
          <>
            <div style={styles.errorIcon}>✗</div>
            <h2 style={styles.errorTitle}>Payment Failed</h2>
            <p style={styles.message}>{message}</p>
            <button style={styles.button} onClick={() => navigate("/upgrade")}>
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #000000 0%, #1a1a2e 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },
  card: {
    background: "#111",
    borderRadius: "16px",
    padding: "40px",
    maxWidth: "500px",
    width: "100%",
    textAlign: "center",
    border: "1px solid #333",
  },
  spinner: {
    width: "60px",
    height: "60px",
    margin: "0 auto 20px",
    border: "4px solid rgba(255, 215, 0, 0.2)",
    borderTopColor: "#FFD700",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  successIcon: {
    width: "80px",
    height: "80px",
    margin: "0 auto 20px",
    background: "#00ffcc",
    color: "#000",
    fontSize: "48px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  errorIcon: {
    width: "80px",
    height: "80px",
    margin: "0 auto 20px",
    background: "#ff4d4d",
    color: "#fff",
    fontSize: "48px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#FFD700",
    fontSize: "24px",
    marginBottom: "10px",
  },
  successTitle: {
    color: "#00ffcc",
    fontSize: "24px",
    marginBottom: "10px",
  },
  errorTitle: {
    color: "#ff4d4d",
    fontSize: "24px",
    marginBottom: "10px",
  },
  message: {
    color: "#aaa",
    fontSize: "14px",
    marginBottom: "20px",
  },
  button: {
    padding: "12px 24px",
    background: "#FFD700",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "20px",
  },
};

const addAnimation = () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    button:hover {
      transform: translateY(-2px);
    }
  `;
  document.head.appendChild(style);
};
addAnimation();