import React from "react";
import { useNavigate } from "react-router-dom";

export default function PredictionCard({ item, onPress }) {
  const navigate = useNavigate();
  
  const locked = item.locked;
  const freePick = item.free_pick;
  const isPremium = item.is_premium;
  const userPlan = localStorage.getItem('userPlan') || 'Free'; // Get user's plan from localStorage

  const handleCardClick = () => {
    if (!locked && onPress) {
      onPress();
    }
  };

  const handleUnlockClick = (e) => {
    e.stopPropagation();
    navigate("/upgrade");
  };

  return (
    <div 
      style={styles.card}
      onClick={handleCardClick}
      className="prediction-card"
    >
      {/* Free Pick Badge */}
      {freePick && (
        <div style={styles.freeBadge}>
          <span style={styles.freeText}>FREE PICK</span>
        </div>
      )}

      {/* Premium Badge */}
      {isPremium && !freePick && (
        <div style={styles.premiumBadge}>
          <span style={styles.premiumText}>⭐ PREMIUM</span>
        </div>
      )}

      <div style={styles.content}>
        {/* Match Info */}
        <h3 style={styles.match}>
          {item.home_team} vs {item.away_team}
        </h3>

        <p style={styles.league}>
          {item.league}
        </p>

        {/* Date and Time */}
        {item.date && (
          <p style={styles.dateTime}>
            📅 {new Date(item.date).toLocaleDateString()} • {item.time || "TBD"}
          </p>
        )}

        {/* Unlocked Content */}
        {!locked && (
          <>
            <div style={styles.predictionContainer}>
              <span style={styles.predictionLabel}>Prediction:</span>
              <span style={styles.predictionValue}>{item.prediction}</span>
            </div>

            <div style={styles.confidenceContainer}>
              <span style={styles.confidenceLabel}>Confidence:</span>
              <div style={styles.confidenceBar}>
                <div 
                  style={{
                    ...styles.confidenceFill,
                    width: `${item.confidence || 70}%`
                  }}
                />
              </div>
              <span style={styles.confidenceText}>
                {item.confidence || 70}%
              </span>
            </div>

            {/* Show analysis preview if available */}
            {item.analysis && (
              <p style={styles.analysisPreview}>
                💡 {item.analysis.length > 100 ? item.analysis.substring(0, 100) + '...' : item.analysis}
              </p>
            )}
          </>
        )}
      </div>

      {/* Locked Overlay */}
      {locked && (
        <div style={styles.blurOverlay}>
          <div style={styles.lockIcon}>🔒</div>
          <p style={styles.lockText}>Premium Prediction</p>
          <p style={styles.lockSubtext}>Upgrade to unlock full analysis</p>
          <button 
            style={styles.unlockBtn}
            onClick={handleUnlockClick}
          >
            Unlock Premium
          </button>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  card: {
    position: "relative",
    backgroundColor: "#111",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "16px",
    overflow: "hidden",
    border: "1px solid #222",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  freeBadge: {
    position: "absolute",
    top: "12px",
    right: "12px",
    backgroundColor: "#FFD700",
    padding: "4px 10px",
    borderRadius: "4px",
    zIndex: 2,
  },

  freeText: {
    fontSize: "10px",
    fontWeight: "bold",
    color: "#000",
  },

  premiumBadge: {
    position: "absolute",
    top: "12px",
    right: "12px",
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    border: "1px solid #FFD700",
    padding: "4px 10px",
    borderRadius: "4px",
    zIndex: 2,
  },

  premiumText: {
    fontSize: "10px",
    fontWeight: "bold",
    color: "#FFD700",
  },

  content: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  match: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#fff",
    margin: 0,
  },

  league: {
    fontSize: "13px",
    color: "#aaa",
    margin: 0,
  },

  dateTime: {
    fontSize: "11px",
    color: "#666",
    margin: 0,
  },

  predictionContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "8px",
    padding: "8px",
    backgroundColor: "#000",
    borderRadius: "6px",
  },

  predictionLabel: {
    fontSize: "13px",
    color: "#aaa",
  },

  predictionValue: {
    fontSize: "14px",
    color: "#FFD700",
    fontWeight: "bold",
  },

  confidenceContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "6px",
  },

  confidenceLabel: {
    fontSize: "12px",
    color: "#aaa",
  },

  confidenceBar: {
    flex: 1,
    height: "6px",
    backgroundColor: "#333",
    borderRadius: "3px",
    overflow: "hidden",
  },

  confidenceFill: {
    height: "100%",
    backgroundColor: "#FFD700",
    borderRadius: "3px",
    transition: "width 0.3s ease",
  },

  confidenceText: {
    fontSize: "11px",
    color: "#FFD700",
    fontWeight: "bold",
  },

  analysisPreview: {
    fontSize: "12px",
    color: "#666",
    marginTop: "8px",
    fontStyle: "italic",
    lineHeight: "1.4",
  },

  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    backdropFilter: "blur(8px)",
    zIndex: 10,
  },

  lockIcon: {
    fontSize: "32px",
    marginBottom: "8px",
  },

  lockText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: "16px",
    marginBottom: "4px",
  },

  lockSubtext: {
    color: "#aaa",
    fontSize: "12px",
    marginBottom: "12px",
  },

  unlockBtn: {
    backgroundColor: "#FFD700",
    border: "none",
    padding: "8px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    transition: "all 0.2s",
  },
};

// Add global hover effects
const addGlobalStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    .prediction-card:hover {
      transform: translateY(-2px);
      border-color: #FFD700;
      box-shadow: 0 4px 15px rgba(255, 215, 0, 0.1);
    }
    
    .unlock-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
    }
    
    .unlock-btn:active {
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);
};

addGlobalStyles();