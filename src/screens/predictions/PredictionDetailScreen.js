import React, { useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function PredictionDetailScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const prediction = location.state?.prediction || null;
  
  // Get user subscription status from localStorage or context
  const getSubscriptionStatus = () => {
    try {
      const userStr = localStorage.getItem('supabase.auth.token');
      if (userStr) {
        const userData = JSON.parse(userStr);
        const plan = userData?.user?.user_metadata?.plan || 'Free';
        return { status: plan === 'Premium' ? 'active' : 'inactive' };
      }
    } catch (err) {
      console.error("Error getting subscription:", err);
    }
    return { status: 'inactive' };
  };

  const subscription = getSubscriptionStatus();
  const isActive = subscription?.status === "active";

  /* =========================
     MATCH TITLE
  ========================== */
  const matchTitle = useMemo(() => {
    if (!prediction) return "";
    if (prediction.home_team && prediction.away_team) {
      return `${prediction.home_team} vs ${prediction.away_team}`;
    }
    return prediction.match || "Match Prediction";
  }, [prediction]);

  /* =========================
     CONFIDENCE
  ========================== */
  const confidence = useMemo(() => {
    return prediction?.confidence ?? prediction?.probability ?? 0;
  }, [prediction]);

  /* =========================
     TIMESTAMP
  ========================== */
  const timestamp = useMemo(() => {
    const raw = prediction?.timestamp || prediction?.prediction_date;
    if (!raw) return "";
    const date = new Date(raw);
    if (isNaN(date.getTime())) return raw;
    return date.toLocaleString();
  }, [prediction]);

  /* =========================
     PREMIUM CHECK
  ========================== */
  const isPremium = useMemo(() => {
    return prediction?.isPremium || prediction?.is_premium || false;
  }, [prediction]);

  /* =========================
     SHARE
  ========================== */
  const handleShare = useCallback(async () => {
    const message = `🔥 Football Prediction

⚽ Match: ${matchTitle}
🏆 League: ${prediction?.league || "-"}

📊 Prediction: ${prediction?.prediction || "-"}
📈 Confidence: ${confidence}%

Get more premium predictions on HYSMART!`;

    try {
      await navigator.clipboard.writeText(message);
      alert("Prediction copied to clipboard! You can now share it.");
    } catch (err) {
      console.log("Share error:", err);
      alert("Failed to copy. Please try again.");
    }
  }, [matchTitle, prediction, confidence]);

  /* =========================
     ERROR
  ========================== */
  if (!prediction) {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <h2 style={styles.goldText}>Prediction not found</h2>
          <button style={styles.backBtn} onClick={() => navigate("/predictions")}>
            Back to Predictions
          </button>
        </div>
      </div>
    );
  }

  /* =========================
     UI
  ========================== */
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Back Button */}
        <button style={styles.backBtn} onClick={() => navigate("/predictions")}>
          ← Back to Predictions
        </button>

        {/* HEADER */}
        <div style={styles.header}>
          <span style={styles.leagueBadge}>{prediction.league || "Football"}</span>
          <h1 style={styles.match}>{matchTitle}</h1>
          <p style={styles.timestamp}>{timestamp}</p>
        </div>

        {/* CONFIDENCE */}
        <div style={styles.card}>
          <h3 style={styles.section}>Confidence</h3>
          <div style={styles.confidenceWrapper}>
            <div style={styles.confidenceCircle}>
              <span style={styles.confidenceValue}>{confidence}%</span>
            </div>
            <div style={styles.confidenceBar}>
              <div style={{...styles.confidenceFill, width: `${confidence}%`}} />
            </div>
          </div>
        </div>

        {/* MARKETS */}
        {Array.isArray(prediction?.markets) && prediction.markets.length > 0 && (
          <div style={styles.card}>
            <h3 style={styles.section}>Markets & Predictions</h3>
            <div style={styles.marketsTable}>
              <div style={styles.marketsHeader}>
                <span>Market</span>
                <span>Prediction</span>
                <span>Odds</span>
              </div>
              {prediction.markets.map((market, idx) => (
                <div key={idx} style={styles.marketRow}>
                  <span style={styles.marketName}>{market.name}</span>
                  <span style={styles.marketValue}>{market.value}</span>
                  <span style={styles.marketOdds}>{market.odds}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ANALYSIS */}
        {prediction?.analysis && (
          <div style={styles.card}>
            <h3 style={styles.section}>Detailed Analysis</h3>
            <p style={styles.text}>{prediction.analysis}</p>
          </div>
        )}

        {/* STAT MODEL */}
        <div style={styles.card}>
          <h3 style={styles.section}>Statistical Model</h3>
          <p style={styles.text}>
            Prediction generated using AI probability modeling based on
            team form, expected goals (xG), head-to-head results,
            attacking efficiency, and defensive metrics.
          </p>
        </div>

        {/* PREMIUM AI */}
        {isPremium && (
          <div style={styles.card}>
            <h3 style={styles.section}>AI Reasoning</h3>
            {isActive ? (
              <p style={styles.text}>
                {prediction?.ai_reasoning || "Premium AI analysis available."}
              </p>
            ) : (
              <div style={styles.upgradePrompt}>
                <div style={styles.lockIcon}>🔒</div>
                <p style={styles.upgradeText}>Premium content locked</p>
                <p style={styles.upgradeSubtext}>Upgrade to Premium to unlock AI reasoning and exclusive insights</p>
                <button style={styles.upgradeBtn} onClick={() => navigate("/upgrade")}>
                  Upgrade Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* SHARE BUTTON */}
        <button style={styles.shareBtn} onClick={handleShare}>
          📤 Share Prediction
        </button>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #000000 0%, #1a1a2e 100%)",
    padding: "20px",
  },
  
  container: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  
  backBtn: {
    background: "#333",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    marginBottom: "20px",
    transition: "all 0.2s",
  },
  
  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
  },
  
  header: {
    marginBottom: "25px",
    textAlign: "center",
  },
  
  leagueBadge: {
    display: "inline-block",
    background: "#FFD700",
    color: "#000",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
    marginBottom: "15px",
  },
  
  match: {
    color: "#FFD700",
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  
  timestamp: {
    color: "#666",
    fontSize: "12px",
  },
  
  card: {
    background: "#111",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "15px",
    border: "1px solid #222",
  },
  
  section: {
    color: "#FFD700",
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "15px",
  },
  
  confidenceWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },
  
  confidenceCircle: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #FFD700, #FFA500)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  
  confidenceValue: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#000",
  },
  
  confidenceBar: {
    flex: 1,
    height: "10px",
    background: "#333",
    borderRadius: "5px",
    overflow: "hidden",
  },
  
  confidenceFill: {
    height: "100%",
    background: "linear-gradient(90deg, #FFD700, #FFA500)",
    borderRadius: "5px",
  },
  
  marketsTable: {
    overflowX: "auto",
  },
  
  marketsHeader: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    padding: "12px",
    background: "#000",
    borderRadius: "8px",
    marginBottom: "8px",
    fontWeight: "bold",
    color: "#FFD700",
    fontSize: "13px",
  },
  
  marketRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    padding: "10px 12px",
    borderBottom: "1px solid #222",
  },
  
  marketName: {
    color: "#aaa",
    fontSize: "13px",
  },
  
  marketValue: {
    color: "#FFD700",
    fontSize: "13px",
    fontWeight: "bold",
  },
  
  marketOdds: {
    color: "#00ffcc",
    fontSize: "13px",
  },
  
  text: {
    color: "#ccc",
    fontSize: "14px",
    lineHeight: "1.6",
  },
  
  upgradePrompt: {
    textAlign: "center",
    padding: "20px",
    background: "#000",
    borderRadius: "8px",
  },
  
  lockIcon: {
    fontSize: "48px",
    marginBottom: "10px",
  },
  
  upgradeText: {
    color: "#ff4d4d",
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "5px",
  },
  
  upgradeSubtext: {
    color: "#aaa",
    fontSize: "12px",
    marginBottom: "15px",
  },
  
  upgradeBtn: {
    background: "#FFD700",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  
  shareBtn: {
    width: "100%",
    background: "#FFD700",
    border: "none",
    padding: "14px",
    borderRadius: "8px",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "10px",
    marginBottom: "40px",
    transition: "all 0.2s",
  },
  
  goldText: {
    color: "#FFD700",
    textAlign: "center",
    marginBottom: "15px",
  },
};

// Add animations
const addAnimations = () => {
  const style = document.createElement('style');
  style.textContent = `
    button:hover:not(:disabled) {
      transform: translateY(-2px);
    }
    
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(255,215,0,0.1);
    }
    
    button:active {
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);
};
addAnimations();