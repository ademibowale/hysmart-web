import React, { useState, useEffect } from 'react';

let deferredPrompt = null;

export default function InstallPrompt() {
  const [showInstall, setShowInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for beforeinstallprompt (Android/Desktop)
    const handler = (e) => {
      e.preventDefault();
      deferredPrompt = e;
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        deferredPrompt = null;
        setShowInstall(false);
      });
    }
  };

  if (isIOS) {
    return (
      <div style={styles.banner}>
        📱 Tap Share → <strong>Add to Home Screen</strong> to install
      </div>
    );
  }

  if (!showInstall) return null;

  return (
    <div style={styles.banner}>
      <span>🚀 Install HYSMART for a better experience</span>
      <button onClick={handleInstall} style={styles.button}>Install</button>
    </div>
  );
}

const styles = {
  banner: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: '#FFD700',
    color: '#000',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    zIndex: 1000,
    fontWeight: 'bold',
  },
  button: {
    background: '#000',
    color: '#FFD700',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};