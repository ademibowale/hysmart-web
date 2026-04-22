import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function SplashScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let mounted = true;
    let animationFrame;
    let startTime = performance.now();
    const duration = 4000; // 4 seconds total

    const updateProgress = (currentTime) => {
      if (!mounted) return;
      
      const elapsed = currentTime - startTime;
      let newProgress = (elapsed / duration) * 100;
      
      // Add easing for smoother animation
      newProgress = Math.min(100, Math.pow(newProgress / 100, 0.7) * 100);
      
      setProgress(Math.floor(newProgress));
      
      if (newProgress < 100) {
        animationFrame = requestAnimationFrame(updateProgress);
      }
    };

    animationFrame = requestAnimationFrame(updateProgress);

    return () => {
      mounted = false;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return (
    <div style={styles.splash}>
      <div style={styles.glow} />
      
      <div style={styles.ballWrapper}>
        <motion.div
          animate={{ y: [0, -80, 0] }}
          transition={{
            y: { repeat: Infinity, duration: 1.2, ease: "easeInOut" },
          }}
          style={styles.ball}
        >
          <svg width="80" height="80" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="#000" stroke="#FFD700" strokeWidth="3"/>
            <path d="M50 5 L50 95 M5 50 L95 50" stroke="#FFD700" strokeWidth="2"/>
            <circle cx="50" cy="50" r="15" fill="#FFD700"/>
            <path d="M50 35 L50 65 M35 50 L65 50" stroke="#000" strokeWidth="2"/>
          </svg>
        </motion.div>
        
        <motion.div
          animate={{ scale: [1, 0.8, 1], opacity: [0.4, 0.2, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          style={styles.shadow}
        />
      </div>

      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={styles.logo}
      >
        HYSMART
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        style={styles.title}
      >
        PREDICTIONS
      </motion.p>

      <div style={styles.progressContainer}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
          style={styles.progressBar}
        />
      </div>

      <motion.p
        animate={{ opacity: progress < 100 ? 1 : 0 }}
        style={styles.percent}
      >
        {progress}%
      </motion.p>
    </div>
  );
}

const styles = {
  splash: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(135deg, #000000 0%, #1a1a2e 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: "200%",
    height: "200%",
    background: "radial-gradient(circle at center, rgba(255,215,0,0.1) 0%, rgba(0,0,0,0) 70%)",
    animation: "pulse 2s ease-in-out infinite",
  },
  ballWrapper: {
    position: "relative",
    marginBottom: "30px",
  },
  ball: {
    cursor: "pointer",
    filter: "drop-shadow(0 0 10px rgba(255,215,0,0.5))",
  },
  shadow: {
    position: "absolute",
    bottom: "-15px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "60px",
    height: "20px",
    background: "radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 70%)",
    borderRadius: "50%",
  },
  logo: {
    color: "#FFD700",
    fontSize: "48px",
    fontWeight: "bold",
    margin: "20px 0 10px",
    letterSpacing: "2px",
    textShadow: "0 0 20px rgba(255,215,0,0.5)",
  },
  title: {
    color: "#fff",
    fontSize: "18px",
    letterSpacing: "4px",
    marginBottom: "40px",
    opacity: 0.8,
  },
  progressContainer: {
    width: "280px",
    height: "4px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "2px",
    overflow: "hidden",
    marginBottom: "15px",
  },
  progressBar: {
    height: "100%",
    background: "linear-gradient(90deg, #FFD700, #FFA500)",
    borderRadius: "2px",
    transition: "width 0.1s linear",
  },
  percent: {
    color: "#FFD700",
    fontSize: "14px",
    fontWeight: "bold",
    margin: 0,
  },
};

// Add keyframes animation for the glow
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }
`;
document.head.appendChild(styleSheet);